package com.dosegura.api.controller;

import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.service.AgendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/agenda")
public class AgendaController {

    @Autowired
    private AgendaService agendaService;

    @PostMapping
    public AgendaModel criarCompromisso(@RequestBody AgendaModel agenda) {
        return agendaService.salvarCompromisso(agenda);
    }

    @GetMapping("/paciente/{pacienteId}")
    public List<AgendaModel> listarAgendaDoPaciente(@PathVariable Long pacienteId) {
        return agendaService.findByPaciente(pacienteId);
    }

    @GetMapping("/paciente/{pacienteId}/pendentes")
    public List<AgendaModel> listarPendentesDoPaciente(@PathVariable Long pacienteId) {
        return agendaService.findPendentesByPaciente(pacienteId);
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<AgendaModel> concluirCompromisso(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(agendaService.marcarComoConcluido(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirCompromisso(@PathVariable Long id) {
        try {
            agendaService.deletarCompromisso(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
