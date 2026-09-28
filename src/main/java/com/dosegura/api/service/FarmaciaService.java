package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.FarmaciaModel;
import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.repo.FarmaciaRepo;
import com.dosegura.api.repo.FornecedorRepo;
import com.dosegura.api.security.AutorizacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FarmaciaService {

    @Autowired
    private FarmaciaRepo farmaciaRepo;

    @Autowired
    private FornecedorRepo fornecedorRepo;

    @Autowired
    private AutorizacaoService autorizacao;

    public List<FarmaciaModel> findAll() {
        return farmaciaRepo.findAll();
    }

    public List<FarmaciaModel> findByFornecedor(Long fornecedorId) {
        return farmaciaRepo.findByFornecedorId(fornecedorId);
    }

    public Optional<FarmaciaModel> findById(Long id) {
        return farmaciaRepo.findById(id);
    }

    public FarmaciaModel save(FarmaciaModel farmacia) {
        if (farmacia.getFornecedor() == null || farmacia.getFornecedor().getId() == null) {
            throw new DadosInvalidosException("Toda farmácia deve estar vinculada a um fornecedor.");
        }
        // Perfil de rede: paciente/cuidador não cadastram farmácias.
        autorizacao.exigirGestaoDaRede();
        // A unidade só é criada por quem responde pelo fornecedor ou, quando é a
        // própria instituição cadastrando a sua loja, pelo CNPJ da conta.
        if (!autorizacao.usuarioAtual().isMasterAdminConta()
                && !autorizacao.podeGerenciarFornecedor(farmacia.getFornecedor().getId())) {
            autorizacao.exigirCriacaoNaRede(farmacia.getCnpj());
        }

        FornecedorModel fornecedor = fornecedorRepo.findById(farmacia.getFornecedor().getId())
                .orElseThrow(() -> new DadosInvalidosException("Fornecedor pai não encontrado."));
        if (farmacia.getNomeUnidade() == null || farmacia.getNomeUnidade().isBlank()
                || farmacia.getCnpj() == null || farmacia.getCnpj().isBlank()) {
            throw new DadosInvalidosException("Informe o nome da unidade e o CNPJ da farmácia.");
        }
        farmacia.setFornecedor(fornecedor);
        // A conta logada passa a responder pela unidade e pode enviar a foto.
        if (farmacia.getResponsavel() == null || farmacia.getResponsavel().getId() == null) {
            farmacia.setResponsavel(usuarioAtualOuNulo());
        }
        return farmaciaRepo.save(farmacia);
    }

    public FarmaciaModel update(Long id, FarmaciaModel details) {
        return farmaciaRepo.findById(id).map(farmacia -> {
            farmacia.setNomeUnidade(details.getNomeUnidade());
            farmacia.setCnpj(details.getCnpj());
            farmacia.setEndereco(details.getEndereco());
            farmacia.setTelefone(details.getTelefone());
            farmacia.setTaxaEntrega(details.getTaxaEntrega());
            farmacia.setTempoEntregaMinutos(details.getTempoEntregaMinutos());
            // A imagem da unidade só muda pelo upload no Cloudinary.
            if (details.getFornecedor() != null && details.getFornecedor().getId() != null) {
                FornecedorModel f = fornecedorRepo.findById(details.getFornecedor().getId())
                        .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado."));
                farmacia.setFornecedor(f);
            }
            return farmaciaRepo.save(farmacia);
        }).orElseThrow(() -> new RuntimeException("Farmácia não encontrada."));
    }

    private PacienteModel usuarioAtualOuNulo() {
        try {
            return autorizacao.usuarioAtual();
        } catch (RuntimeException semSessao) {
            return null;
        }
    }

    public void delete(Long id) {
        farmaciaRepo.deleteById(id);
    }
}
