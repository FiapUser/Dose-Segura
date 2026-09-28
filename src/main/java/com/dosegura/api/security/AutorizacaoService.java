package com.dosegura.api.security;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.exception.NaoAutenticadoException;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.TipoImagem;
import com.dosegura.api.repo.FarmaciaRepo;
import com.dosegura.api.repo.FornecedorRepo;
import com.dosegura.api.repo.MedicamentoRepo;
import com.dosegura.api.repo.Repo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AutorizacaoService {

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private FornecedorRepo fornecedorRepo;

    @Autowired
    private FarmaciaRepo farmaciaRepo;

    @Autowired
    private MedicamentoRepo medicamentoRepo;

    public Long idUsuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new NaoAutenticadoException();
        }
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException e) {
            throw new NaoAutenticadoException();
        }
    }

    public PacienteModel usuarioAtual() {
        return pacienteRepo.findById(idUsuarioAtual()).orElseThrow(NaoAutenticadoException::new);
    }

    public boolean podeAcessarPaciente(Long pacienteId) {
        if (pacienteId == null) {
            return false;
        }
        Long usuarioId = idUsuarioAtual();
        if (usuarioId.equals(pacienteId)) {
            return true;
        }
        return pacienteRepo.findById(pacienteId)
                .map(alvo -> alvo.getCuidador() != null && usuarioId.equals(alvo.getCuidador().getId()))
                .orElse(false);
    }

    public void exigirAcessoAoPaciente(Long pacienteId) {
        if (!podeAcessarPaciente(pacienteId)) {
            throw new AcessoNegadoException();
        }
    }

    public void exigirProprioUsuario(Long id) {
        if (id == null || !id.equals(idUsuarioAtual())) {
            throw new AcessoNegadoException();
        }
    }

    // ---------- Regras de imagem (Cloudinary) ----------

    /**
     * Regra de upload de imagens, por tipo de conta:
     * <ul>
     *   <li><b>master admin</b>: gerencia as imagens de toda a rede;</li>
     *   <li><b>fornecedor (CNPJ)</b>: envia o logo da empresa e as fotos dos
     *       medicamentos que comercializa;</li>
     *   <li><b>farmácia (CNPJ)</b>: envia a foto da própria unidade;</li>
     *   <li><b>paciente/cuidador (CPF)</b>: envia somente a própria foto de perfil.</li>
     * </ul>
     */
    public void exigirPermissaoDeImagem(TipoImagem tipo, Long recursoId) {
        if (!podeEnviarImagem(tipo, recursoId)) {
            throw new AcessoNegadoException();
        }
    }

    public boolean podeEnviarImagem(TipoImagem tipo, Long recursoId) {
        if (tipo == null) {
            return false;
        }
        PacienteModel usuario = usuarioAtual();
        if (usuario.isMasterAdminConta()) {
            return true;
        }
        return switch (tipo) {
            case PERFIL -> recursoId != null && recursoId.equals(usuario.getId());
            case FORNECEDOR -> recursoId != null
                    && fornecedorRepo.findById(recursoId)
                    .map(fornecedor -> dono(fornecedor.getResponsavel(), usuario))
                    .orElse(false);
            case FARMACIA -> recursoId != null
                    && farmaciaRepo.findById(recursoId)
                    .map(farmacia -> dono(farmacia.getResponsavel(), usuario)
                            || (farmacia.getFornecedor() != null
                            && dono(farmacia.getFornecedor().getResponsavel(), usuario)))
                    .orElse(false);
            case MEDICAMENTO -> recursoId != null
                    && medicamentoRepo.findById(recursoId)
                    .map(medicamento -> medicamento.getFornecedor() != null
                            && dono(medicamento.getFornecedor().getResponsavel(), usuario))
                    .orElse(false);
        };
    }

    private boolean dono(PacienteModel responsavel, PacienteModel usuario) {
        return responsavel != null && responsavel.getId() != null && responsavel.getId().equals(usuario.getId());
    }
}
