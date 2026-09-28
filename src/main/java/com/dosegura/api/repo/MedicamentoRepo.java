package com.dosegura.api.repo;

import com.dosegura.api.model.MedicamentoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicamentoRepo extends JpaRepository<MedicamentoModel, Long> {
    List<MedicamentoModel> findByNomeContainingIgnoreCase(String nome);
}
