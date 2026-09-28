package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.CarrinhoModel;
import java.util.Optional;

@Repository
public interface CarrinhoRepo extends JpaRepository<CarrinhoModel, Long> {
    Optional<CarrinhoModel> findByPacienteId(Long pacienteId);
}
