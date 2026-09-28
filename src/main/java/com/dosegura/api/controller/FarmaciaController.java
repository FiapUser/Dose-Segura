package com.dosegura.api.controller;

import com.dosegura.api.model.FarmaciaModel;
import com.dosegura.api.service.FarmaciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/farmacias")
public class FarmaciaController {

    @Autowired
    private FarmaciaService farmaciaService;

    @GetMapping
    public List<FarmaciaModel> listarTodas() {
        return farmaciaService.findAll();
    }

    @GetMapping("/fornecedor/{fornecedorId}")
    public List<FarmaciaModel> listarPorFornecedor(@PathVariable Long fornecedorId) {
        return farmaciaService.findByFornecedor(fornecedorId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmaciaModel> obterPorId(@PathVariable Long id) {
        return farmaciaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public FarmaciaModel criar(@RequestBody FarmaciaModel farmacia) {
        return farmaciaService.save(farmacia);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FarmaciaModel> atualizar(@PathVariable Long id, @RequestBody FarmaciaModel detalhes) {
        try {
            return ResponseEntity.ok(farmaciaService.update(id, detalhes));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        try {
            farmaciaService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
