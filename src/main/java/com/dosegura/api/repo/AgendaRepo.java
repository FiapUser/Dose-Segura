package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.AgendaModel;
import java.util.List;

@Repository
public interface AgendaRepo extends JpaRepository<AgendaModel, Long> {
    List<AgendaModel> findByPacienteId(Long pacienteId);
    List<AgendaModel> findByPacienteIdAndConcluidoFalse(Long pacienteId);
}
