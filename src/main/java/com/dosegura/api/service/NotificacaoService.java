package com.dosegura.api.service;

import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.model.AlertaUsuario;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.SolicitacaoVinculoModel;
import com.dosegura.api.repo.AgendaRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Alertas da área de notificações.
 *
 * <p><b>Nada é salvo no banco:</b> os alertas ficam em memória, no máximo
 * {@value #MAXIMO_POR_USUARIO} por conta, expiram depois de {@value #VALidade_HORAS} horas e
 * somem quando a aplicação reinicia. O agendador continua gerando os lembretes de
 * medicamento e de consulta, mas a lista é sempre "agora", nunca histórico.</p>
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    /** Marca o alerta que traz o botao de aceitar/recusar vinculo de cuidado. */
    public static final String ACAO_VINCULO = "VINCULO";

    private static final int MAXIMO_POR_USUARIO = 20;
    private static final int VALIDADE_HORAS = 24;

    private final Map<Long, Deque<AlertaUsuario>> alertas = new ConcurrentHashMap<>();
    private final AtomicLong sequencia = new AtomicLong();

    @Autowired
    private AgendaRepo agendaRepo;

    /** Alertas atuais (não lidos primeiro). Nada de histórico. */
    public List<AlertaUsuario> obterAlertasAtivos(Long destinatarioId) {
        return ordenar(limpar(destinatarioId, false));
    }

    /** Mesma lista de "ativos": o front não tem mais uma aba de histórico. */
    public List<AlertaUsuario> obterHistoricoAlertas(Long destinatarioId) {
        return ordenar(limpar(destinatarioId, true));
    }

    public List<AlertaUsuario> ordenar(List<AlertaUsuario> lista) {
        List<AlertaUsuario> copia = new ArrayList<>(lista);
        copia.sort(Comparator.comparing(AlertaUsuario::isLida)
                .thenComparing(AlertaUsuario::getDataDisparo, Comparator.reverseOrder()));
        return copia;
    }

    /** Marca/desmarca a leitura em memória. */
    public AlertaUsuario alternarLeitura(String id, Long destinatarioId) {
        Deque<AlertaUsuario> fila = alertas.get(destinatarioId);
        if (fila == null) {
            return null;
        }
        for (AlertaUsuario alerta : fila) {
            if (alerta.getId().equals(id)) {
                alerta.setLida(!alerta.isLida());
                return alerta;
            }
        }
        return null;
    }

    public AlertaUsuario registrar(Long destinatarioId, String titulo, String mensagem,
                                   String acaoTipo, Long acaoId) {
        Deque<AlertaUsuario> fila = alertas.computeIfAbsent(destinatarioId, chave -> new ArrayDeque<>());
        AlertaUsuario alerta = new AlertaUsuario(
                sequencia.incrementAndGet() + "-" + UUID.randomUUID().toString().substring(0, 8),
                destinatarioId, titulo, mensagem, LocalDateTime.now(), acaoTipo, acaoId);
        synchronized (fila) {
            fila.addFirst(alerta);
            while (fila.size() > MAXIMO_POR_USUARIO) {
                fila.removeLast();
            }
        }
        return alerta;
    }

    /** Remove da caixa o alerta cujo id não existe mais (ex.: vínculo já respondido). */
    public void descartarPorAcao(Long destinatarioId, String acaoTipo, Long acaoId) {
        Deque<AlertaUsuario> fila = alertas.get(destinatarioId);
        if (fila == null || acaoId == null) {
            return;
        }
        synchronized (fila) {
            fila.removeIf(alerta -> acaoTipo.equals(alerta.getAcaoTipo())
                    && acaoId.equals(alerta.getAcaoId()));
        }
    }

    private List<AlertaUsuario> limpar(Long destinatarioId, boolean incluirLidos) {
        Deque<AlertaUsuario> fila = alertas.get(destinatarioId);
        if (fila == null) {
            return List.of();
        }
        LocalDateTime limite = LocalDateTime.now().minusHours(VALIDADE_HORAS);
        List<AlertaUsuario> validos = new ArrayList<>();
        synchronized (fila) {
            fila.removeIf(alerta -> alerta.getDataDisparo().isBefore(limite));
            for (AlertaUsuario alerta : fila) {
                if (incluirLidos || !alerta.isLida()) {
                    validos.add(alerta);
                }
            }
        }
        return validos;
    }

    /**
     * Varre a agenda a cada minuto: dispara o alerta do medicamento na hora e avisa
     * sobre consultas/exames do dia seguinte. Sem gravação em banco.
     */
    @Scheduled(fixedRate = 60000)
    public void verificarAgendaEEnviarAlertas() {
        LocalDateTime agora = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MINUTES);
        for (AgendaModel item : agendaRepo.findAll()) {
            if (Boolean.TRUE.equals(item.getConcluido()) || item.getHorarioInicio() == null) {
                continue;
            }
            LocalDateTime horarioItem = item.getHorarioInicio()
                    .truncatedTo(java.time.temporal.ChronoUnit.MINUTES);
            boolean medicamento = "MEDICAMENTO".equalsIgnoreCase(item.getTipo());

            if (medicamento && horarioItem.equals(agora)) {
                registrar(item.getPaciente().getId(), "⏰ Hora do medicamento",
                        String.format("Está na hora de administrar %s%s. %s",
                                item.getTitulo(),
                                item.getDosagem() == null ? "" : " (" + item.getDosagem() + ")",
                                item.getObservacoes() == null ? "" : item.getObservacoes()), null, null);
                log.info("Alerta de medicamento enviado ao paciente {}", item.getPaciente().getId());
            } else if (!medicamento && horarioItem.equals(agora.plusDays(1))) {
                registrar(item.getPaciente().getId(), "📅 Compromisso amanhã",
                        String.format("Amanhã você tem %s: %s às %s. %s",
                                item.getTipo().toLowerCase(), item.getTitulo(),
                                item.getHorarioInicio().toLocalTime(),
                                item.getObservacoes() == null ? "" : item.getObservacoes()), null, null);
                log.info("Lembrete de compromisso enviado ao paciente {}", item.getPaciente().getId());
            }
        }
    }

    /**
     * Alerta de pedido de vínculo de cuidado: o destinatário vê o pedido na área de
     * notificações e responde se deseja vincular.
     */
    public AlertaUsuario notificarSolicitacaoVinculo(PacienteModel destinatario, PacienteModel solicitante,
                                                     String tipoVinculo, Long solicitacaoId) {
        return registrar(destinatario.getId(), "🤝 Pedido de vínculo de cuidado",
                String.format("%s (%s) solicita %s. Deseja vincular?",
                        solicitante.getNome(),
                        PacienteService.mascararEmail(solicitante.getEmail()),
                        SolicitacaoVinculoModel.TIPO_RESPONSAVEL.equals(tipoVinculo)
                                ? "ser seu responsável de cuidado"
                                : "cuidar da sua saúde"),
                ACAO_VINCULO, solicitacaoId);
    }
}
