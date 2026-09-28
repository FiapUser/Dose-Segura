package com.dosegura.api.service;

import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.model.NotificacaoModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.SolicitacaoVinculoModel;
import com.dosegura.api.repo.AgendaRepo;
import com.dosegura.api.repo.NotificacaoRepo;
import com.dosegura.api.repo.Repo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Alertas da área de notificações.
 *
 * <p>Os alertas <b>são gravados</b> em {@code notificacoes_sistema}: existe
 * histórico, com a aba "Histórico" na tela de notificações. Para não encher a
 * lista, o mesmo compromisso não gera alerta repetido dentro da mesma hora.</p>
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    @Autowired
    private NotificacaoRepo notificacaoRepo;

    @Autowired
    private AgendaRepo agendaRepo;

    @Autowired
    private Repo pacienteRepo;

    /** Alertas ainda não lidos. */
    public List<NotificacaoModel> obterAlertasAtivos(Long pacienteId) {
        return notificacaoRepo.findByPacienteIdAndLidaFalseOrderByDataDisparoDesc(pacienteId);
    }

    /** Histórico completo de alertas do paciente, do mais recente ao mais antigo. */
    public List<NotificacaoModel> obterHistoricoAlertas(Long pacienteId) {
        return notificacaoRepo.findByPacienteIdOrderByDataDisparoDesc(pacienteId);
    }

    /** Marca como lida; devolve null quando o alerta não existe. */
    public NotificacaoModel marcarComoLida(Long id) {
        return notificacaoRepo.findById(id).map(notificacao -> {
            notificacao.setLida(true);
            return notificacaoRepo.save(notificacao);
        }).orElse(null);
    }

    @Transactional
    public NotificacaoModel registrar(Long destinatarioId, String titulo, String mensagem,
                                      String acaoTipo, Long acaoId) {
        PacienteModel destinatario = pacienteRepo.findById(destinatarioId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado."));
        NotificacaoModel notificacao = new NotificacaoModel();
        notificacao.setPaciente(destinatario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setDataDisparo(LocalDateTime.now());
        notificacao.setLida(false);
        notificacao.setAcaoTipo(acaoTipo);
        notificacao.setAcaoId(acaoId);
        NotificacaoModel salva = notificacaoRepo.save(notificacao);
        log.info("Alerta '{}' registrado para o paciente {}", titulo, destinatarioId);
        return salva;
    }

    /** Encerra os alertas de um pedido já respondido (somem da aba "Ativas", ficam no histórico). */
    @Transactional
    public void encerrarAlertasDeVinculo(Long destinatarioId, Long solicitacaoId) {
        for (NotificacaoModel alerta : notificacaoRepo
                .findByPacienteIdAndAcaoTipoAndAcaoIdOrderByDataDisparoDesc(
                        destinatarioId, NotificacaoModel.ACAO_VINCULO, solicitacaoId)) {
            if (!Boolean.TRUE.equals(alerta.getLida())) {
                alerta.setLida(true);
                notificacaoRepo.save(alerta);
            }
        }
    }

    /**
     * Alerta de pedido de vínculo: o destinatário responde na área de notificações
     * se deseja vincular. O texto deixa claro quem cuida de quem.
     */
    @Transactional
    public NotificacaoModel notificarSolicitacaoVinculo(PacienteModel destinatario, PacienteModel solicitante,
                                                         String tipoVinculo, Long solicitacaoId) {
        boolean solicitantePrestaraCuidado = SolicitacaoVinculoModel.PRESTAR_CUIDADO.equals(tipoVinculo);
        String mensagem = String.format("%s (%s) %s. Deseja vincular?",
                solicitante.getNome(),
                PacienteService.mascararEmail(solicitante.getEmail()),
                solicitantePrestaraCuidado
                        ? "quer cuidar da sua saúde"
                        : "quer ser seu responsável de cuidado");
        return registrar(destinatario.getId(), "Pedido de vínculo de cuidado", mensagem,
                NotificacaoModel.ACAO_VINCULO, solicitacaoId);
    }

    /**
     * A cada minuto: alerta do medicamento na hora e lembrete de consultas/exames do
     * dia seguinte.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void verificarAgendaEEnviarAlertas() {
        LocalDateTime agora = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        for (AgendaModel item : agendaRepo.findAll()) {
            if (Boolean.TRUE.equals(item.getConcluido()) || item.getHorarioInicio() == null) {
                continue;
            }
            LocalDateTime horarioItem = item.getHorarioInicio().truncatedTo(ChronoUnit.MINUTES);
            boolean agoraMesmo = horarioItem.equals(agora);
            boolean amanha = horarioItem.equals(agora.plusDays(1));
            if (!agoraMesmo && !amanha) {
                continue;
            }
            if (jaAvisou(item)) {
                continue;
            }
            String titulo = amanha ? "Compromisso amanhã" : "Hora do medicamento";
            String mensagem = amanha
                    ? String.format("Amanhã você tem %s: %s às %s. %s",
                    item.getTipo().toLowerCase(), item.getTitulo(),
                    item.getHorarioInicio().toLocalTime(),
                    item.getObservacoes() == null ? "" : item.getObservacoes())
                    : String.format("Está na hora de administrar %s%s. %s",
                    item.getTitulo(),
                    item.getDosagem() == null ? "" : " (" + item.getDosagem() + ")",
                    item.getObservacoes() == null ? "" : item.getObservacoes());
            registrar(item.getPaciente().getId(), titulo, mensagem, null, null);
        }
    }

    /** Evita alertas repetidos do mesmo compromisso dentro da mesma hora. */
    private boolean jaAvisou(AgendaModel item) {
        String titulo = item.getTitulo();
        if (titulo == null || titulo.isBlank()) {
            return false;
        }
        LocalDateTime janela = item.getHorarioInicio().truncatedTo(ChronoUnit.HOURS);
        return notificacaoRepo.findByPacienteIdOrderByDataDisparoDesc(item.getPaciente().getId()).stream()
                .anyMatch(alerta -> alerta.getMensagem() != null
                        && alerta.getMensagem().contains(titulo)
                        && alerta.getDataDisparo() != null
                        && !alerta.getDataDisparo().isBefore(janela.minusMinutes(1))
                        && alerta.getDataDisparo().isBefore(janela.plusHours(1)));
    }
}
