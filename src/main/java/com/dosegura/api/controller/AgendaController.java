package com.dosegura.api.controller;

import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.service.AgendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /** Agenda completa, sempre em ordem cronológica. */
    @GetMapping("/paciente/{pacienteId}")
    public List<AgendaModel> listarAgendaDoPaciente(@PathVariable Long pacienteId) {
        return agendaService.findByPaciente(pacienteId);
    }

    @GetMapping("/paciente/{pacienteId}/pendentes")
    public List<AgendaModel> listarPendentesDoPaciente(@PathVariable Long pacienteId) {
        return agendaService.findPendentesByPaciente(pacienteId);
    }

    /**
     * Resumo usado pelo topo da agenda: o próximo cuidado real (o mais próximo entre os
     * que ainda vão acontecer) e os compromissos em atraso.
     */
    @GetMapping("/paciente/{pacienteId}/resumo")
    public Map<String, Object> resumo(@PathVariable Long pacienteId) {
        LocalDateTime agora = LocalDateTime.now();
        List<AgendaModel> todos = agendaService.findByPaciente(pacienteId);
        List<AgendaModel> atrasados = agendaService.findAtrasados(pacienteId);
        AgendaModel proximo = agendaService.findProximo(pacienteId);

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("agora", agora);
        resposta.put("totalCompromissos", todos.size());
        resposta.put("totalPendentes", todos.stream().filter(a -> !Boolean.TRUE.equals(a.getConcluido())).count());
        resposta.put("totalConcluidos", todos.stream().filter(a -> Boolean.TRUE.equals(a.getConcluido())).count());
        resposta.put("totalAtrasados", atrasados.size());
        resposta.put("proximo", proximo);
        return resposta;
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
