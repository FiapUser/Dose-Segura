package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.MedicamentoModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.repo.FornecedorRepo;
import com.dosegura.api.repo.MedicamentoRepo;
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MarketplaceService {

    @Autowired
    private FornecedorRepo fornecedorRepo;

    @Autowired
    private MedicamentoRepo medicamentoRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public List<FornecedorModel> findAllFornecedores() {
        return fornecedorRepo.findAll();
    }
    public Optional<FornecedorModel> findFornecedorById(Long id) {
        return fornecedorRepo.findById(id);
    }

    /**
     * Novo fornecedor: a conta logada (CNPJ) passa a ser a responsável, e por isso
     * passa a poder enviar o logo e as fotos dos medicamentos para o Cloudinary.
     */
    public FornecedorModel saveFornecedor(FornecedorModel fornecedor) {
        if (fornecedor.getId() != null) {
            throw new DadosInvalidosException("Novo fornecedor não deve informed id.");
        }
        fornecedor.setResponsavel(usuarioResponsavel());
        return fornecedorRepo.save(fornecedor);
    }

    public void deleteFornecedor(Long id) {
        fornecedorRepo.deleteById(id);
    }

    public FornecedorModel updateFornecedor(Long id, FornecedorModel details) {
        return fornecedorRepo.findById(id).map(fornecedor -> {
            fornecedor.setNomeFornecedor(details.getNomeFornecedor());
            fornecedor.setCnpj(details.getCnpj());
            fornecedor.setEndereco(details.getEndereco());
            fornecedor.setTelefone(details.getTelefone());
            fornecedor.setAvaliacao(details.getAvaliacao());
            fornecedor.setDescricao(details.getDescricao());
            fornecedor.setUrlLogo(details.getUrlLogo());
            return fornecedorRepo.save(fornecedor);
        }).orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
    }

    public MedicamentoModel saveMedicamento(MedicamentoModel medicamento) {
        FornecedorModel fornecedorCompleto = fornecedorRepo.findById(medicamento.getFornecedor().getId())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
        medicamento.setFornecedor(fornecedorCompleto);
        calcularPrecoComDescontoCondicional(medicamento);
        return medicamentoRepo.save(medicamento);
    }

    public MedicamentoModel updateMedicamento(Long id, MedicamentoModel details) {
        return medicamentoRepo.findById(id).map(medicamento -> {
            medicamento.setNome(details.getNome());
            medicamento.setDosagem(details.getDosagem());
            medicamento.setFabricante(details.getFabricante());
            medicamento.setDescricao(details.getDescricao());
            medicamento.setPrincipioAtivo(details.getPrincipioAtivo());
            medicamento.setCategoria(details.getCategoria());
            medicamento.setEstoqueDisponivel(details.getEstoqueDisponivel());
            medicamento.setEstoqueFabricante(details.getEstoqueFabricante());
            // A URL da imagem só muda pelo upload no Cloudinary (regra de permissões).
            if (details.getUrlImagem() != null && !details.getUrlImagem().isBlank()) {
                medicamento.setUrlImagem(details.getUrlImagem());
            }
            medicamento.setPrecoOriginal(details.getPrecoOriginal());
            medicamento.setDescontoPorcentagem(details.getDescontoPorcentagem());
            medicamento.setDescontoSelecionado(details.getDescontoSelecionado());
            calcularPrecoComDescontoCondicional(medicamento);
            if (details.getFornecedor() != null) {
                FornecedorModel f = fornecedorRepo.findById(details.getFornecedor().getId())
                        .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
                medicamento.setFornecedor(f);
            }
            return medicamentoRepo.save(medicamento);
        }).orElseThrow(() -> new RuntimeException("Medicamento não encontrado"));
    }

    private PacienteModel usuarioResponsavel() {
        try {
            return autorizacao.usuarioAtual();
        } catch (RuntimeException semSessao) {
            return null;
        }
    }

    private void calcularPrecoComDescontoCondicional(MedicamentoModel medicamento) {
        if (medicamento.getPrecoOriginal() != null) {
            if (Boolean.TRUE.equals(medicamento.getDescontoSelecionado())
                    && medicamento.getDescontoPorcentagem() != null
                    && medicamento.getDescontoPorcentagem() > 0) {
                double fatorDesconto = 1.0 - (medicamento.getDescontoPorcentagem() / 100.0);
                medicamento.setPreco(medicamento.getPrecoOriginal() * fatorDesconto);
            } else {
                medicamento.setPreco(medicamento.getPrecoOriginal());
            }
        }
    }

    public List<MedicamentoModel> findAllMedicamentos() {
        return medicamentoRepo.findAll();
    }
    public List<MedicamentoModel> buscarMedicamentosPorNome(String nome) {
        return medicamentoRepo.findByNomeContainingIgnoreCase(nome);
    }
    public Optional<MedicamentoModel> findMedicamentoById(Long id) {
        return medicamentoRepo.findById(id);
    }
    public void deleteMedicamento(Long id) {
        medicamentoRepo.deleteById(id);
    }
}