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
import java.util.Optional;

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

    /**
     * Substitui a antiga listagem de todos os pacientes. Busca por e-mail exato e devolve apenas
     * o mínimo necessário para o usuário escolher o seu responsável.
     */
    @GetMapping("/paciente/buscar")
    public ResponseEntity<Map<String, Object>> buscarPorEmail(@RequestParam String email) {
        Optional<PacienteModel> encontrado = pacienteService.findByEmail(email);
        if (encontrado.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PacienteModel paciente = encontrado.get();
        Map<String, Object> resumo = new HashMap<>();
        resumo.put("id", paciente.getId());
        resumo.put("nome", paciente.getNome());
        resumo.put("emailMascarado", PacienteService.mascararEmail(paciente.getEmail()));
        return ResponseEntity.ok(resumo);
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

    /** O próprio paciente escolhe o seu responsável (a checagem de posse está no interceptor). */
    @PutMapping("/paciente/{pacienteId}/vincular-cuidador/{cuidadorId}")
    public ResponseEntity<PacienteModel> vincularCuidador(@PathVariable Long pacienteId, @PathVariable Long cuidadorId) {
        if (pacienteId.equals(cuidadorId)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            PacienteModel paciente = pacienteService.findById(pacienteId)
                    .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));
            PacienteModel cuidador = pacienteService.findById(cuidadorId)
                    .orElseThrow(() -> new RuntimeException("Cuidador não encontrado"));

            paciente.setCuidador(cuidador);
            return ResponseEntity.ok(pacienteService.save(paciente));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** O cuidador não pode se vincular sozinho: precisa provar que tem acesso à conta do paciente. */
    @PostMapping("/paciente/dependentes")
    public ResponseEntity<Object> adicionarDependente(@RequestBody Map<String, String> credenciaisDoPaciente) {
        Long cuidadorId = autorizacao.idUsuarioAtual();

        Optional<PacienteModel> dependente = pacienteService.login(
                credenciaisDoPaciente.get("email"), credenciaisDoPaciente.get("senha"));

        if (dependente.isEmpty()) {
            // Status 400 (e não 401) para não ser confundido com sessão expirada.
            Map<String, String> erro = new HashMap<>();
            erro.put("codigo", "CREDENCIAIS_INVALIDAS");
            erro.put("mensagem", "E-mail ou senha do paciente inválidos.");
            return ResponseEntity.badRequest().body(erro);
        }
        if (dependente.get().getId().equals(cuidadorId)) {
            Map<String, String> erro = new HashMap<>();
            erro.put("codigo", "DADOS_INVALIDOS");
            erro.put("mensagem", "Você não pode ser responsável por si mesmo.");
            return ResponseEntity.badRequest().body(erro);
        }

        PacienteModel cuidador = autorizacao.usuarioAtual();
        PacienteModel paciente = dependente.get();
        paciente.setCuidador(cuidador);
        return ResponseEntity.ok(pacienteService.save(paciente));
    }

    /** O paciente ou o cuidador atual podem desfazer o vínculo. */
    @PutMapping("/paciente/{pacienteId}/desvincular-cuidador")
    public ResponseEntity<PacienteModel> desvincularCuidador(@PathVariable Long pacienteId) {
        try {
            PacienteModel paciente = pacienteService.findById(pacienteId)
                    .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));

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
