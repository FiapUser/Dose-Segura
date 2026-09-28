package com.dosegura.api.controller;

import com.dosegura.api.model.AlertaUsuario;
import com.dosegura.api.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Alertas da conta logada.
 *
 * <p>Os alertas são gerados em memória (a agenda, o estoque e os pedidos de
 * vínculo). Não existe histórico: o que já foi respondido deixa de aparecer e
 * nada é gravado no banco.</p>
 */
@RestController
@RequestMapping("/dosegura/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private com.dosegura.api.security.AutorizacaoService autorizacao;

    @GetMapping("/paciente/{pacienteId}")
    public List<AlertaUsuario> listarAtivas(@PathVariable Long pacienteId) {
        return notificacaoService.obterAlertasAtivos(verificarAcesso(pacienteId));
    }

    /**
     * Mesma lista dos alertas ativos. O histórico deixou de existir, então esta
     * rota devolve o que está ativo agora.
     */
    @GetMapping("/paciente/{pacienteId}/historico")
    public List<AlertaUsuario> listarHistorico(@PathVariable Long pacienteId) {
        return notificacaoService.obterHistoricoAlertas(verificarAcesso(pacienteId));
    }

    @GetMapping("/minhas")
    public List<AlertaUsuario> listarMinhas() {
        return notificacaoService.obterAlertasAtivos(autorizacao.idUsuarioAtual());
    }

    /** Marca como lida (ou desmarca) em memória. */
    @PutMapping("/{id}/ler")
    public ResponseEntity<AlertaUsuario> marcarComoLida(@PathVariable String id) {
        AlertaUsuario alerta = notificacaoService.alternarLeitura(id, autorizacao.idUsuarioAtual());
        return alerta == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(alerta);
    }

    private Long verificarAcesso(Long pacienteId) {
        if (!pacienteId.equals(autorizacao.idUsuarioAtual())) {
            autorizacao.exigirAcessoAoPaciente(pacienteId);
        }
        return pacienteId;
    }
}
