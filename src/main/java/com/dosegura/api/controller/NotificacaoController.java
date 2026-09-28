package com.dosegura.api.controller;

import com.dosegura.api.model.NotificacaoModel;
import com.dosegura.api.security.AutorizacaoService;
import com.dosegura.api.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Alertas da conta: lembretes de medicamento, consultas do dia seguinte, estoque
 * baixo e pedidos de vínculo de cuidado.
 *
 * <p>Os alertas são gravados, então existe histórico ("/historico"). O patientId
 * é validado: só a própria conta ou o cuidador atual acessam.</p>
 */
@RestController
@RequestMapping("/dosegura/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private AutorizacaoService autorizacao;

    /** Alertas ainda não lidos do paciente informado. */
    @GetMapping("/paciente/{pacienteId}")
    public List<NotificacaoModel> listarAtivas(@PathVariable Long pacienteId) {
        return notificacaoService.obterAlertasAtivos(verificarAcesso(pacienteId));
    }

    /** Histórico completo do paciente. */
    @GetMapping("/paciente/{pacienteId}/historico")
    public List<NotificacaoModel> listarHistorico(@PathVariable Long pacienteId) {
        return notificacaoService.obterHistoricoAlertas(verificarAcesso(pacienteId));
    }

    /** Ativos + histórico da própria conta (usado na área de notificações). */
    @GetMapping("/minhas")
    public List<NotificacaoModel> listarMinhas() {
        return notificacaoService.obterHistoricoAlertas(autorizacao.idUsuarioAtual());
    }

    @PutMapping("/{id}/ler")
    public ResponseEntity<NotificacaoModel> marcarComoLida(@PathVariable Long id) {
        NotificacaoModel alerta = notificacaoService.marcarComoLida(id);
        return alerta == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(alerta);
    }

    private Long verificarAcesso(Long pacienteId) {
        if (!pacienteId.equals(autorizacao.idUsuarioAtual())) {
            autorizacao.exigirAcessoAoPaciente(pacienteId);
        }
        return pacienteId;
    }
}
