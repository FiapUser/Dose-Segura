package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.NotificacaoModel;
import java.util.List;

@Repository
public interface NotificacaoRepo extends JpaRepository<NotificacaoModel, Long> {
    List<NotificacaoModel> findByPacienteIdAndLidaFalseOrderByDataDisparoDesc(Long pacienteId);
    List<NotificacaoModel> findByPacienteIdOrderByDataDisparoDesc(Long pacienteId);
}
