package com.dosegura.api.controller;

import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.MedicamentoModel;
import com.dosegura.api.service.MarketplaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/marketplace")
public class MarketplaceController {

    @Autowired
    private MarketplaceService marketplaceService;

    @GetMapping("/fornecedores")
    public List<FornecedorModel> listarFornecedores() {
        return marketplaceService.findAllFornecedores();
    }

    @GetMapping("/fornecedor/{id}")
    public ResponseEntity<FornecedorModel> obterFornecedorPorId(@PathVariable Long id) {
        return marketplaceService.findFornecedorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/fornecedor")
    public FornecedorModel criarFornecedor(@RequestBody FornecedorModel fornecedor) {
        return marketplaceService.saveFornecedor(fornecedor);
    }

    @PutMapping("/fornecedor/{id}")
    public ResponseEntity<FornecedorModel> atualizarFornecedor(@PathVariable Long id, @RequestBody FornecedorModel details) {
        try {
            return ResponseEntity.ok(marketplaceService.updateFornecedor(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/fornecedor/{id}")
    public ResponseEntity<Void> excluirFornecedor(@PathVariable Long id) {
        try {
            marketplaceService.deleteFornecedor(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/medicamentos")
    public List<MedicamentoModel> listarTodosMedicamentos() {
        return marketplaceService.findAllMedicamentos();
    }

    @GetMapping("/buscar")
    public List<MedicamentoModel> buscarMedicamentos(@RequestParam String nome) {
        return marketplaceService.buscarMedicamentosPorNome(nome);
    }

    @GetMapping("/medicamento/{id}")
    public ResponseEntity<MedicamentoModel> obterMedicamentoPorId(@PathVariable Long id) {
        return marketplaceService.findMedicamentoById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/medicamento")
    public MedicamentoModel cadastrarMedicamento(@RequestBody MedicamentoModel medicamento) {
        return marketplaceService.saveMedicamento(medicamento);
    }

    @PutMapping("/medicamento/{id}")
    public ResponseEntity<MedicamentoModel> atualizarMedicamento(@PathVariable Long id, @RequestBody MedicamentoModel details) {
        try {
            return ResponseEntity.ok(marketplaceService.updateMedicamento(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/medicamento/{id}")
    public ResponseEntity<Void> excluirMedicamento(@PathVariable Long id) {
        try {
            marketplaceService.deleteMedicamento(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
