package com.dosegura.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.security.AutorizacaoService;
import com.dosegura.api.security.JwtTokenProvider;
import com.dosegura.api.service.PacienteService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Cadastro, sessão e vínculos.
 *
 * <p>O vínculo de cuidado não acontece mais por aqui: não existe mais
 * {@code vincular-cuidador} nem adicionar dependente com senha. Ambos foram
 * substituídos por pedido + confirmação na área de notificações
 * (ver {@link VinculoController}).</p>
 */
@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/dosegura/api/")
public class PatientController {

    @Autowired
    private PacienteService pacienteService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AutorizacaoService autorizacao;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String senha = credentials.get("senha");

        return pacienteService.login(email, senha)
                .map(paciente -> {
                    String token = tokenProvider.gerarToken(paciente);

                    Map<String, Object> resposta = new HashMap<>();
                    resposta.put("paciente", paciente); // a senha nunca é serializada (ver PacienteModel)
                    resposta.put("token", token);
                    return ResponseEntity.ok((Object) resposta);
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos."));
    }

    @GetMapping("/paciente/{id}")
    public ResponseEntity<PacienteModel> getPacienteById(@PathVariable Long id) {
        return pacienteService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/paciente")
    public ResponseEntity<PacienteModel> createPaciente(@RequestBody PacienteModel paciente) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pacienteService.cadastrar(paciente));
    }

    @PutMapping("/paciente/{id}")
    public ResponseEntity<PacienteModel> updatePaciente(@PathVariable Long id, @RequestBody PacienteModel pacienteDetails) {
        boolean proprioUsuario = id.equals(autorizacao.idUsuarioAtual());
        try {
            return ResponseEntity.ok(pacienteService.update(id, pacienteDetails, proprioUsuario));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/paciente/{id}")
    public ResponseEntity<Void> deletePaciente(@PathVariable Long id) {
        pacienteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Desfaz o vínculo. Continua liberado porque desfazer é direito do próprio,
     * mas exige que a conta seja a paciente ou o cuidador atual (checado no interceptor).
     */
    @PutMapping("/paciente/{pacienteId}/desvincular-cuidador")
    public ResponseEntity<PacienteModel> desvincularCuidador(@PathVariable Long pacienteId) {
        try {
            PacienteModel paciente = pacienteService.findById(pacienteId)
                    .orElseThrow(() -> new NoSuchElementException("Paciente não encontrado"));
            paciente.setCuidador(null);
            return ResponseEntity.ok(pacienteService.save(paciente));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/paciente/cuidador/{cuidadorId}/dependentes")
    public ResponseEntity<List<PacienteModel>> listarDependentes(@PathVariable Long cuidadorId) {
        List<PacienteModel> dependentes = pacienteService.findDependentes(cuidadorId);
        return ResponseEntity.ok(dependentes);
    }
}
