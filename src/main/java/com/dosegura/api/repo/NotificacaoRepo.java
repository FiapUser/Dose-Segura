package com.dosegura.api.repo;

import com.dosegura.api.model.NotificacaoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificacaoRepo extends JpaRepository<NotificacaoModel, Long> {

    List<NotificacaoModel> findByPacienteIdAndLidaFalseOrderByDataDisparoDesc(Long pacienteId);

    /** Histórico completo, do mais recente para o mais antigo. */
    List<NotificacaoModel> findByPacienteIdOrderByDataDisparoDesc(Long pacienteId);

    List<NotificacaoModel> findByPacienteIdAndAcaoTipoAndAcaoIdOrderByDataDisparoDesc(
            Long pacienteId, String acaoTipo, Long acaoId);
}
