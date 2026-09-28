package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.AgendaModel;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendaRepo extends JpaRepository<AgendaModel, Long> {

    /** Agenda sempre em ordem cronológica: é o que garante o "próximo cuidado". */
    List<AgendaModel> findByPacienteIdOrderByHorarioInicioAsc(Long pacienteId);

    List<AgendaModel> findByPacienteIdAndConcluidoFalseOrderByHorarioInicioAsc(Long pacienteId);

    /** Pendentes que ainda não passaram do horário, do mais próximo para o mais distante. */
    List<AgendaModel> findByPacienteIdAndConcluidoFalseAndHorarioInicioGreaterThanEqualOrderByHorarioInicioAsc(
            Long pacienteId, LocalDateTime agora);

    List<AgendaModel> findByPacienteIdAndConcluidoFalseAndHorarioInicioBeforeOrderByHorarioInicioDesc(
            Long pacienteId, LocalDateTime agora);
}
