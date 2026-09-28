package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.RelatorioModel;
import java.util.List;

@Repository
public interface RelatorioRepo extends JpaRepository<RelatorioModel, Long> {
    List<RelatorioModel> findByPeriodoDeterminado(String periodo);
    List<RelatorioModel> findByFamiliarCuidadorId(Long familiarId);
}
