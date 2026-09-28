package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.EstoquePacienteModel;
import java.util.List;

@Repository
public interface EstoquePacienteRepo extends JpaRepository<EstoquePacienteModel, Long> {
    List<EstoquePacienteModel> findByPacienteId(Long pacienteId);
}
