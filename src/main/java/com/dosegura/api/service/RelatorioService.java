package com.dosegura.api.service;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.RelatorioModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.repo.RelatorioRepo;
import com.dosegura.api.repo.Repo;
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RelatorioService {

    @Autowired
    private RelatorioRepo relatorioRepo;

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public RelatorioModel configurarRelatorio(RelatorioModel configuracao) {
        if (configuracao.getPaciente() == null || configuracao.getPaciente().getId() == null
                || configuracao.getFamiliarCuidador() == null || configuracao.getFamiliarCuidador().getId() == null
                || configuracao.getPeriodoDeterminado() == null || configuracao.getPeriodoDeterminado().isBlank()) {
            throw new DadosInvalidosException("Paciente, familiar/cuidador e período são obrigatórios.");
        }
        autorizacao.exigirAcessoAoPaciente(configuracao.getPaciente().getId());

        PacienteModel pacienteCompleto = pacienteRepo.findById(configuracao.getPaciente().getId())
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));
        PacienteModel familiarCompleto = pacienteRepo.findById(configuracao.getFamiliarCuidador().getId())
                .orElseThrow(() -> new RuntimeException("Familiar/Cuidador não encontrado"));
        // O relatório contém dados de saúde: só pode ir para o próprio usuário ou para o cuidador atual do paciente.
        Long usuarioId = autorizacao.idUsuarioAtual();
        boolean destinoEhUsuario = familiarCompleto.getId().equals(usuarioId);
        boolean destinoEhCuidador = pacienteCompleto.getCuidador() != null
                && familiarCompleto.getId().equals(pacienteCompleto.getCuidador().getId());
        if (!destinoEhUsuario && !destinoEhCuidador) {
            throw new AcessoNegadoException();
        }

        configuracao.setId(null); // somente criação
        configuracao.setPaciente(pacienteCompleto);
        configuracao.setFamiliarCuidador(familiarCompleto);
        configuracao.setDataGeracao(LocalDateTime.now());
        return relatorioRepo.save(configuracao);
    }

    public List<RelatorioModel> buscarHistoricoPorFamiliar(Long familiarId) {
        return relatorioRepo.findByFamiliarCuidadorId(familiarId);
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void processarRelatoriosAgendados() {
        List<RelatorioModel> configuracoesAtivas = relatorioRepo.findAll();

        for (RelatorioModel relatorio : configuracoesAtivas) {
            if (relatorio.getPaciente().getCuidador() != null) {
                PacienteModel paciente = relatorio.getPaciente();

                String informacoesSaude = String.format(
                        "Medicamentos em Uso: %s | Últimas Observações Médicas: %s | Alergias registradas: %s",
                        paciente.getMedicamentosEmUso(),
                        paciente.getObservacoesMedicas(),
                        paciente.getAlergias()
                );

                String informacoesCompras = "Aviso de Estoque: Reposição realizada via farmácias parceiras Eurofarma.";
                relatorio.setDataGeracao(LocalDateTime.now());
                relatorio.setDadosSaudeAtualizados(informacoesSaude);
                relatorio.setHistoricoComprasPeriodo(informacoesCompras);

                relatorioRepo.save(relatorio);
                System.out.println("-----------------------------------------------------------------");
                System.out.println("DOSE SEGURA - RELATÓRIO PERIÓDICO ENVIADO!");
                System.out.println("Destinatário (Familiar/Cuidador): " + relatorio.getFamiliarCuidador().getNome());
                System.out.println("Paciente Monitorado: " + paciente.getNome());
                System.out.println("Frequência: " + relatorio.getPeriodoDeterminado());
                System.out.println("Conteúdo de Saúde: " + informacoesSaude);
                System.out.println("Conteúdo de Compras: " + informacoesCompras);
                System.out.println("-----------------------------------------------------------------");
            }
        }
    }
}

