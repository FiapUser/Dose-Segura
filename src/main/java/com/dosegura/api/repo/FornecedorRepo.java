package com.dosegura.api.repo;

import com.dosegura.api.model.FornecedorModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FornecedorRepo extends JpaRepository<FornecedorModel, Long> {
}
