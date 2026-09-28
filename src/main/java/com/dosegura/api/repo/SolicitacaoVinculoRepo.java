package com.dosegura.api.repo;

import com.dosegura.api.model.SolicitacaoVinculoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoVinculoRepo extends JpaRepository<SolicitacaoVinculoModel, Long> {

    List<SolicitacaoVinculoModel> findByDestinatarioIdOrderByCriadoEmDesc(Long destinatarioId);

    List<SolicitacaoVinculoModel> findBySolicitanteIdOrderByCriadoEmDesc(Long solicitanteId);

    Optional<SolicitacaoVinculoModel> findBySolicitanteIdAndDestinatarioIdAndStatus(
            Long solicitanteId, Long destinatarioId, String status);

    List<SolicitacaoVinculoModel> findBySolicitanteIdAndDestinatarioId(
            Long solicitanteId, Long destinatarioId);
}
