package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.PacienteModel;
import java.util.List;
import java.util.Optional;

@Repository
public interface Repo extends JpaRepository<PacienteModel, Long> {
    Optional<PacienteModel> findByEmail(String email);
    List<PacienteModel> findByCuidadorId(Long cuidadorId);
}
