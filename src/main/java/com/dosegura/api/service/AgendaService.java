package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.repo.AgendaRepo;
import com.dosegura.api.repo.Repo; // Repositório de pacientes
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AgendaService {

    @Autowired
    private AgendaRepo agendaRepo;

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public List<AgendaModel> findByPaciente(Long pacienteId) {
        return agendaRepo.findByPacienteId(pacienteId);
    }

    public List<AgendaModel> findPendentesByPaciente(Long pacienteId) {
        return agendaRepo.findByPacienteIdAndConcluidoFalse(pacienteId);
    }

    public AgendaModel salvarCompromisso(AgendaModel agenda) {
        if (agenda.getPaciente() == null || agenda.getPaciente().getId() == null) {
            throw new DadosInvalidosException("O paciente é obrigatório.");
        }
        autorizacao.exigirAcessoAoPaciente(agenda.getPaciente().getId());

        PacienteModel pacienteCompleto = pacienteRepo.findById(agenda.getPaciente().getId())
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));

        // Somente criação: um id enviado pelo cliente sobrescreveria o compromisso de outro paciente.
        agenda.setId(null);
        agenda.setPaciente(pacienteCompleto);
        return agendaRepo.save(agenda);
    }

    public AgendaModel marcarComoConcluido(Long id) {
        return agendaRepo.findById(id).map(compromisso -> {
            compromisso.setConcluido(true);
            return agendaRepo.save(compromisso);
        }).orElseThrow(() -> new RuntimeException("Registro da agenda não encontrado"));
    }

    public void deletarCompromisso(Long id) {
        agendaRepo.deleteById(id);
    }
}
