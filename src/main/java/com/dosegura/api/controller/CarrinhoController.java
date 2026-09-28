package com.dosegura.api.controller;

import com.dosegura.api.model.CarrinhoModel;
import com.dosegura.api.service.CarrinhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/carrinho")
public class CarrinhoController {

    @Autowired
    private CarrinhoService carrinhoService;

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<CarrinhoModel> obterCarrinho(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(carrinhoService.obterPorPaciente(pacienteId));
    }

    @PostMapping("/paciente/{pacienteId}/adicionar")
    public ResponseEntity<CarrinhoModel> adicionarProduto(
            @PathVariable Long pacienteId,
            @RequestBody Map<String, Object> payload) {
        Long medicamentoId = Long.valueOf(payload.get("medicamentoId").toString());
        Integer quantidade = Integer.valueOf(payload.get("quantidade").toString());
        return ResponseEntity.ok(carrinhoService.adicionarItem(pacienteId, medicamentoId, quantidade));
    }

    @DeleteMapping("/paciente/{pacienteId}/item/{itemId}")
    public ResponseEntity<CarrinhoModel> removerProduto(@PathVariable Long pacienteId, @PathVariable Long itemId) {
        return ResponseEntity.ok(carrinhoService.removerItem(pacienteId, itemId));
    }

    @PostMapping("/paciente/{pacienteId}/finalizar")
    public ResponseEntity<Void> fecharPedido(@PathVariable Long pacienteId) {
        try {
            carrinhoService.finalizarCompra(pacienteId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
