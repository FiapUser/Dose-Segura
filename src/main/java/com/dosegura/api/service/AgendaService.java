package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.repo.AgendaRepo;
import com.dosegura.api.repo.Repo; // Repositório de pacientes
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AgendaService {

    private static final int ANOS_MAXIMOS = 10;

    @Autowired
    private AgendaRepo agendaRepo;

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public List<AgendaModel> findByPaciente(Long pacienteId) {
        return agendaRepo.findByPacienteIdOrderByHorarioInicioAsc(pacienteId);
    }

    /** Pendentes ordenados por horário: o primeiro é o cuidado mais próximo. */
    public List<AgendaModel> findPendentesByPaciente(Long pacienteId) {
        return agendaRepo.findByPacienteIdAndConcluidoFalseOrderByHorarioInicioAsc(pacienteId);
    }

    /** Compromissos cuja data/hora já passou e continuam em aberto. */
    public List<AgendaModel> findAtrasados(Long pacienteId) {
        return agendaRepo.findByPacienteIdAndConcluidoFalseAndHorarioInicioBeforeOrderByHorarioInicioDesc(
                pacienteId, LocalDateTime.now());
    }

    /** O próximo cuidado de verdade: o mais próximo entre os que ainda vão acontecer. */
    public AgendaModel findProximo(Long pacienteId) {
        return agendaRepo.findByPacienteIdAndConcluidoFalseAndHorarioInicioGreaterThanEqualOrderByHorarioInicioAsc(
                pacienteId, LocalDateTime.now()).stream().findFirst().orElse(null);
    }

    public AgendaModel salvarCompromisso(AgendaModel agenda) {
        if (agenda.getPaciente() == null || agenda.getPaciente().getId() == null) {
            throw new DadosInvalidosException("Selecione o paciente do compromisso.");
        }
        if (agenda.getHorarioInicio() == null) {
            throw new DadosInvalidosException("Informe a data e a hora do compromisso.");
        }
        validarHorario(agenda.getHorarioInicio());
        validarTexto(agenda.getTipo(), "Selecione o tipo de compromisso.");
        validarTexto(agenda.getTitulo(), "Informe o título do compromisso.");

        autorizacao.exigirAcessoAoPaciente(agenda.getPaciente().getId());

        PacienteModel pacienteCompleto = pacienteRepo.findById(agenda.getPaciente().getId())
                .orElseThrow(() -> new DadosInvalidosException("Paciente não encontrado."));

        // Somente criação: um id enviado pelo cliente sobrescreveria o compromisso de outro paciente.
        agenda.setId(null);
        agenda.setPaciente(pacienteCompleto);
        if (agenda.getConcluido() == null) {
            agenda.setConcluido(false);
        }
        if (agenda.getFrequenciaHoras() != null && agenda.getFrequenciaHoras() <= 0) {
            agenda.setFrequenciaHoras(null);
        }
        return agendaRepo.save(agenda);
    }

    private void validarHorario(LocalDateTime horario) {
        LocalDateTime agora = LocalDateTime.now();
        if (horario.isAfter(agora.plusYears(ANOS_MAXIMOS))) {
            throw new DadosInvalidosException("A data do compromisso está longe demais. Confira o ano informado.");
        }
        // Schedules no passado são permitidos (registro retroativo de dose), mas com aviso.
    }

    private void validarTexto(String valor, String mensagem) {
        if (valor == null || valor.isBlank()) {
            throw new DadosInvalidosException(mensagem);
        }
    }

    public AgendaModel marcarComoConcluido(Long id) {
        return agendaRepo.findById(id).map(compromisso -> {
            compromisso.setConcluido(true);
            return agendaRepo.save(compromisso);
        }).orElseThrow(() -> new DadosInvalidosException("Registro da agenda não encontrado."));
    }

    public void deletarCompromisso(Long id) {
        agendaRepo.deleteById(id);
    }
}
