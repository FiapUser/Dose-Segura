package com.dosegura.api.repo;

import com.dosegura.api.model.FarmaciaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmaciaRepo extends JpaRepository<FarmaciaModel, Long> {
    List<FarmaciaModel> findByFornecedorId(Long fornecedorId);
}
