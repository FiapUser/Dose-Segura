package com.dosegura.api.service;

import com.dosegura.api.model.NotificacaoModel;
import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.repo.NotificacaoRepo;
import com.dosegura.api.repo.AgendaRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificacaoService {

    @Autowired
    private NotificacaoRepo notificacaoRepo;

    @Autowired
    private AgendaRepo agendaRepo;

    public List<NotificacaoModel> obterAlertasAtivos(Long pacienteId) {
        return notificacaoRepo.findByPacienteIdAndLidaFalseOrderByDataDisparoDesc(pacienteId);
    }

    public List<NotificacaoModel> obterHistoricoAlertas(Long pacienteId) {
        return notificacaoRepo.findByPacienteIdOrderByDataDisparoDesc(pacienteId);
    }

    public NotificacaoModel marcarComoLida(Long id) {
        return notificacaoRepo.findById(id).map(notificacao -> {
            notificacao.setLida(true);
            return notificacaoRepo.save(notificacao);
        }).orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
    }

    @Scheduled(fixedRate = 60000)
    public void verificarAgendaEEnviarAlertas() {
        LocalDateTime agora = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        List<AgendaModel> compromissosAbertos = agendaRepo.findAll();

        for (AgendaModel item : compromissosAbertos) {
            if (item.getConcluido()) continue;

            LocalDateTime horarioItem = item.getHorarioInicio().truncatedTo(ChronoUnit.MINUTES);

            if (item.getTipo().equalsIgnoreCase("MEDICAMENTO") && horarioItem.equals(agora)) {
                dispararAlerta(item.getPaciente(), "⏰ Hora do Medicamento!",
                        String.format("Está na hora de administrar o medicamento %s (%s). %s",
                                item.getTitulo(), item.getDosagem(), item.getObservacoes()));
            }
            else if (!item.getTipo().equalsIgnoreCase("MEDICAMENTO") && horarioItem.equals(agora.plusDays(1))) {
                dispararAlerta(item.getPaciente(), "📅 Lembrete de Compromisso de Saúde",
                        String.format("Aviso: Amanhã você tem um(a) %s agendado(a): '%s' às %s. %s",
                                item.getTipo().toLowerCase(), item.getTitulo(), item.getHorarioInicio().toLocalTime(), item.getObservacoes()));
            }
        }
    }

    private void dispararAlerta(com.dosegura.api.model.PacienteModel paciente, String titulo, String mensagem) {
        NotificacaoModel notificacao = new NotificacaoModel();
        notificacao.setPaciente(paciente);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setDataDisparo(LocalDateTime.now());
        notificacaoRepo.save(notificacao);
        System.out.println("\n[SISTEMA DE ALERTAS DOSE SEGURA]");
        System.out.println("Destinatário: Paciente " + paciente.getNome());
        if (paciente.getCuidador() != null) {
            System.out.println("Notificação espelhada para o Cuidador: " + paciente.getCuidador().getNome());
        }
        System.out.println("Título: " + titulo);
        System.out.println("Mensagem: " + mensagem);
        System.out.println("----------------------------------------\n");
    }
}
