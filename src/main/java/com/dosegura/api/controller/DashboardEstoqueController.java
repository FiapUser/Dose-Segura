package com.dosegura.api.controller;

import com.dosegura.api.model.EstoquePacienteModel;
import com.dosegura.api.service.DashboardEstoqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/dashboard-estoque")
public class DashboardEstoqueController {

    @Autowired
    private DashboardEstoqueService dashboardEstoqueService;

    @PostMapping("/estoque")
    public EstoquePacienteModel registrarEstoque(@RequestBody EstoquePacienteModel estoque) {
        return dashboardEstoqueService.registrarOuAtualizarEstoque(estoque);
    }

    @GetMapping("/estoque/paciente/{pacienteId}")
    public List<EstoquePacienteModel> listarEstoqueDoPaciente(@PathVariable Long pacienteId) {
        return dashboardEstoqueService.buscarEstoquePorPaciente(pacienteId);
    }

    @GetMapping("/painel/paciente/{pacienteId}")
    public ResponseEntity<Map<String, Object>> obterDashboardSaude(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(dashboardEstoqueService.gerarDashboard(pacienteId));
    }
}
