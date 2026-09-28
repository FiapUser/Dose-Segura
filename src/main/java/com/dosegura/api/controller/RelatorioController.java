package com.dosegura.api.controller;

import com.dosegura.api.model.RelatorioModel;
import com.dosegura.api.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/relatorios")
public class RelatorioController {

    @Autowired
    private RelatorioService relatorioService;

    @PostMapping("/configurar")
    public RelatorioModel configurarRelatorio(@RequestBody RelatorioModel configuracao) {
        return relatorioService.configurarRelatorio(configuracao);
    }

    @GetMapping("/familiar/{familiarId}")
    public ResponseEntity<List<RelatorioModel>> obterHistoricoPorFamiliar(@PathVariable Long familiarId) {
        List<RelatorioModel> historico = relatorioService.buscarHistoricoPorFamiliar(familiarId);
        return ResponseEntity.ok(historico);
    }
}
