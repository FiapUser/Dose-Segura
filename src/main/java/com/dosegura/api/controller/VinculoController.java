package com.dosegura.api.controller;

import com.dosegura.api.model.SolicitacaoVinculoModel;
import com.dosegura.api.security.AutorizacaoService;
import com.dosegura.api.service.VinculoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pedidos de vínculo de cuidado.
 *
 * <p>Regra: ninguém é vinculado sem a confirmação de quem vai ser cuidada/o. O pedido
 * aparece na área de notificações do destinatário, que decide aceitar ou recusar.</p>
 */
@RestController
@RequestMapping("/dosegura/api/vinculos")
public class VinculoController {

    @Autowired
    private VinculoService vinculoService;

    @Autowired
    private AutorizacaoService autorizacao;

    /** Envia o pedido de vínculo (não pede senha do dependente). */
    @PostMapping("/solicitar")
    public SolicitacaoVinculoModel solicitar(@RequestBody Map<String, String> corpo) {
        return vinculoService.solicitar(
                autorizacao.idUsuarioAtual(),
                corpo.get("email"),
                corpo.get("tipo"),
                corpo.get("mensagem"));
    }

    /** Pedidos que EU recebi e preciso responder. */
    @GetMapping("/recebidos")
    public List<SolicitacaoVinculoModel> recebidos() {
        return vinculoService.recebidos(autorizacao.idUsuarioAtual());
    }

    /** Pedidos que EU enviei, com o status de cada um. */
    @GetMapping("/enviados")
    public List<SolicitacaoVinculoModel> enviados() {
        return vinculoService.enviados(autorizacao.idUsuarioAtual());
    }

    @PutMapping("/{id}/aceitar")
    public ResponseEntity<SolicitacaoVinculoModel> aceitar(@PathVariable Long id) {
        return ResponseEntity.ok(vinculoService.aceitar(id, autorizacao.idUsuarioAtual()));
    }

    @PutMapping("/{id}/recusar")
    public ResponseEntity<SolicitacaoVinculoModel> recusar(@PathVariable Long id) {
        return ResponseEntity.ok(vinculoService.recusar(id, autorizacao.idUsuarioAtual()));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<SolicitacaoVinculoModel> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(vinculoService.cancelar(id, autorizacao.idUsuarioAtual()));
    }

    /** Resumo usado na área de notificações. */
    @GetMapping("/resumo")
    public Map<String, Object> resumo() {
        Long id = autorizacao.idUsuarioAtual();
        List<SolicitacaoVinculoModel> recebidos = vinculoService.recebidos(id);
        long pendentes = recebidos.stream().filter(SolicitacaoVinculoModel::isPendente).count();
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("pendentesRecebidos", pendentes);
        resposta.put("totalRecebidos", recebidos.size());
        resposta.put("totalEnviados", vinculoService.enviados(id).size());
        return resposta;
    }
}
