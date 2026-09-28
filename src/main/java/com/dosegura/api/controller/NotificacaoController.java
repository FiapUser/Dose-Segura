package com.dosegura.api.controller;

import com.dosegura.api.model.NotificacaoModel;
import com.dosegura.api.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @GetMapping("/paciente/{pacienteId}")
    public List<NotificacaoModel> listarAlertasAtivos(@PathVariable Long pacienteId) {
        return notificacaoService.obterAlertasAtivos(pacienteId);
    }

    @GetMapping("/paciente/{pacienteId}/historico")
    public List<NotificacaoModel> listarHistorico(@PathVariable Long pacienteId) {
        return notificacaoService.obterHistoricoAlertas(pacienteId);
    }

    @PutMapping("/{id}/ler")
    public ResponseEntity<NotificacaoModel> lerNotificacao(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(notificacaoService.marcarComoLida(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

