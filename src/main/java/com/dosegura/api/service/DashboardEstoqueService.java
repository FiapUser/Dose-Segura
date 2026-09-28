package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.*;
import com.dosegura.api.repo.*;
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardEstoqueService {

    @Autowired
    private EstoquePacienteRepo estoqueRepo;

    @Autowired
    private AgendaRepo agendaRepo;

    @Autowired
    private NotificacaoService notificacoes;

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public EstoquePacienteModel registrarOuAtualizarEstoque(EstoquePacienteModel estoque) {
        if (estoque.getPaciente() == null || estoque.getPaciente().getId() == null) {
            throw new DadosInvalidosException("O paciente é obrigatório.");
        }
        Long pacienteId = estoque.getPaciente().getId();
        autorizacao.exigirAcessoAoPaciente(pacienteId);

        // Atualização por id: o registro existente precisa ser do mesmo paciente informado.
        if (estoque.getId() != null) {
            EstoquePacienteModel existente = estoqueRepo.findById(estoque.getId())
                    .orElseThrow(() -> new DadosInvalidosException("Registro de estoque não encontrado."));
            autorizacao.exigirAcessoAoPaciente(existente.getPaciente().getId());
            if (!existente.getPaciente().getId().equals(pacienteId)) {
                throw new DadosInvalidosException("O registro de estoque não pertence ao paciente informado.");
            }
        }

        PacienteModel pacienteCompleto = pacienteRepo.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));
        estoque.setPaciente(pacienteCompleto);
        return estoqueRepo.save(estoque);
    }

    public List<EstoquePacienteModel> buscarEstoquePorPaciente(Long pacienteId) {
        return estoqueRepo.findByPacienteId(pacienteId);
    }

    public void deduzirDoEstoque(Long pacienteId, String nomeMedicamento) {
        List<EstoquePacienteModel> estoques = estoqueRepo.findByPacienteId(pacienteId);
        for (EstoquePacienteModel estoque : estoques) {
            if (estoque.getNomeMedicamento().equalsIgnoreCase(nomeMedicamento) && estoque.getQuantidadeAtualComprimidos() > 0) {
                estoque.setQuantidadeAtualComprimidos(estoque.getQuantidadeAtualComprimidos() - 1);
                estoqueRepo.save(estoque);
                break;
            }
        }
    }

    /** Alerta de estoque baixo uma vez por dia, gravado no histórico de notificações. */
    @Scheduled(cron = "0 0 8 * * ?")
    public void verificarEstoquesCriticos() {
        for (EstoquePacienteModel estoque : estoqueRepo.findAll()) {
            int diasRestantes = estoque.getDiasRestantes();
            if (diasRestantes > 5) {
                continue;
            }
            String titulo = diasRestantes == 0
                    ? "Medicamento acabou"
                    : String.format("%s acaba em %d dias", estoque.getNomeMedicamento(), diasRestantes);
            String mensagem = diasRestantes == 0
                    ? String.format("O estoque de %s zerou. Reabra o pedido no marketplace para não "
                            + "interromper o tratamento.", estoque.getNomeMedicamento())
                    : String.format("Atenção: o seu %s acabará em %d dias. Programe-se para repor na rede "
                            + "de farmácias parceiras.", estoque.getNomeMedicamento(), diasRestantes);
            notificacoes.registrar(estoque.getPaciente().getId(), titulo, mensagem, null, null);
        }
    }

    public Map<String, Object> gerarDashboard(Long pacienteId) {
        List<AgendaModel> compromissos = agendaRepo.findByPacienteIdOrderByHorarioInicioAsc(pacienteId);
        List<EstoquePacienteModel> estoques = estoqueRepo.findByPacienteId(pacienteId);

        long administrados = compromissos.stream().filter(c -> c.getConcluido() && c.getTipo().equalsIgnoreCase("MEDICAMENTO")).count();
        long pendentes = compromissos.stream().filter(c -> !c.getConcluido() && c.getTipo().equalsIgnoreCase("MEDICAMENTO")).count();
        long totalMedicamentos = administrados + pendentes;

        double taxaAdesao = totalMedicamentos > 0 ? ((double) administrados / totalMedicamentos) * 100 : 100.0;

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("pacienteId", pacienteId);
        dashboard.put("medicamentosAdministrados", administrados);
        dashboard.put("medicamentosPendentes", pendentes);
        dashboard.put("taxaAdesaoPorcentagem", Math.round(taxaAdesao * 10.0) / 10.0);
        dashboard.put("proximosHorarios", compromissos.stream()
                .filter(c -> !c.getConcluido())
                .filter(c -> c.getHorarioInicio() != null && !c.getHorarioInicio().isBefore(LocalDateTime.now()))
                .limit(5).toList());
        dashboard.put("compromissosAtrasados", compromissos.stream()
                .filter(c -> !c.getConcluido())
                .filter(c -> c.getHorarioInicio() != null && c.getHorarioInicio().isBefore(LocalDateTime.now()))
                .count());
        dashboard.put("situacaoEstoque", estoques.stream().map(e -> Map.of(
                "medicamento", e.getNomeMedicamento(),
                "quantidadeAtual", e.getQuantidadeAtualComprimidos(),
                "diasRestantes", e.getDiasRestantes()
        )).toList());

        return dashboard;
    }
}
