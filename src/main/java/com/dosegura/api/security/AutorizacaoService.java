package com.dosegura.api.security;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.exception.NaoAutenticadoException;
import com.dosegura.api.model.FarmaciaModel;
import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.MedicamentoModel;
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

    private static final String SEM_GESTAO =
            "Apenas o master admin ou a instituição responsável (mesmo CNPJ) gerencia este registro.";
    private static final String SEM_IMAGEM =
            "Sua conta não pode enviar a imagem deste registro. Master admin e a instituição responsável "
                    + "(mesmo CNPJ) gerenciam as imagens da rede.";

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

    // ---------- Gestao da rede (fornecedores, farmacias, medicamentos) ----------

    /**
     * Somente master admin e contas de instituição (CNPJ) administram a rede.
     * Paciente, familiar e cuidador (CPF) não criam, editam nem excluem
     * fornecedores, farmácias ou medicamentos.
     */
    public boolean podeGerenciarRede() {
        PacienteModel usuario = usuarioAtual();
        return usuario.isMasterAdminConta() || usuario.isPessoaJuridica();
    }

    public void exigirGestaoDaRede() {
        if (!podeGerenciarRede()) {
            throw new AcessoNegadoException(
                    "Apenas o master admin e contas de instituição (CNPJ) administram fornecedores, "
                            + "farmácias e medicamentos da rede.");
        }
    }

    /**
     * Criação de registro: a instituição só cria em nome do próprio CNPJ e passa
     * a ser a responsável. O master admin cria livremente.
     */
    public void exigirCriacaoNaRede(String cnpjInformado) {
        exigirGestaoDaRede();
        PacienteModel usuario = usuarioAtual();
        if (usuario.isMasterAdminConta() || cnpjCoincide(usuario, cnpjInformado)) {
            return;
        }
        throw new AcessoNegadoException("Use o CNPJ da sua conta ("
                + (usuario.getCnpj() == null ? "não cadastrado" : usuario.getCnpj())
                + ") para cadastrar um registro da rede.");
    }

    public void exigirGestaoDeFornecedor(Long id) {
        if (!podeGerenciarFornecedor(id)) {
            throw new AcessoNegadoException(SEM_GESTAO);
        }
    }

    public boolean podeGerenciarFornecedor(Long id) {
        PacienteModel usuario = usuarioAtual();
        if (usuario.isMasterAdminConta()) {
            return true;
        }
        if (id == null || !usuario.isPessoaJuridica()) {
            return false;
        }
        return fornecedorRepo.findById(id)
                .map(fornecedor -> possuiRegistro(usuario, fornecedor.getResponsavel(), fornecedor.getCnpj()))
                .orElse(false);
    }

    public void exigirGestaoDeFarmacia(Long id) {
        if (!podeGerenciarFarmacia(id)) {
            throw new AcessoNegadoException(SEM_GESTAO);
        }
    }

    public boolean podeGerenciarFarmacia(Long id) {
        PacienteModel usuario = usuarioAtual();
        if (usuario.isMasterAdminConta()) {
            return true;
        }
        if (id == null || !usuario.isPessoaJuridica()) {
            return false;
        }
        return farmaciaRepo.findById(id)
                .map(farmacia -> possuiUnidade(usuario, farmacia.getResponsavel(), farmacia.getCnpj(),
                        farmacia.getFornecedor()))
                .orElse(false);
    }

    public void exigirGestaoDeMedicamento(Long id) {
        if (!podeGerenciarMedicamento(id)) {
            throw new AcessoNegadoException(SEM_GESTAO);
        }
    }

    /** O medicamento pertence a quem responde pelo fornecedor que o comercializa. */    public boolean podeGerenciarMedicamento(Long id) {
        PacienteModel usuario = usuarioAtual();
        if (usuario.isMasterAdminConta()) {
            return true;
        }
        if (id == null || !usuario.isPessoaJuridica()) {
            return false;
        }
        return medicamentoRepo.findById(id)
                .map(medicamento -> respondePeloFornecedor(usuario, medicamento.getFornecedor()))
                .orElse(false);
    }

    // ---------- Regras de imagem (Cloudinary) ----------

    /**
     * Regra de upload de imagens, por tipo de conta:
     * master admin gerencia toda a rede; a conta de fornecedor envia o logo da
     * empresa e as fotos dos medicamentos que comercializa; a de farmacia envia a
     * foto da unidade; paciente, familiar e cuidador enviam apenas a propria foto
     * de perfil.
     *
     * <p>Alem do master admin, a instituicao acessa quando e a responsavel pelo
     * registro ou quando o CNPJ da conta e o mesmo CNPJ do registro (do fornecedor,
     * no caso das farmacias e dos medicamentos).</p>
     */
    public void exigirPermissaoDeImagem(TipoImagem tipo, Long recursoId) {
        if (!podeEnviarImagem(tipo, recursoId)) {
            throw new AcessoNegadoException(SEM_IMAGEM);
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
                    .map(fornecedor -> possuiRegistro(usuario, fornecedor.getResponsavel(), fornecedor.getCnpj()))
                    .orElse(false);
            case FARMACIA -> recursoId != null
                    && farmaciaRepo.findById(recursoId)
                    .map(farmacia -> possuiUnidade(usuario, farmacia.getResponsavel(), farmacia.getCnpj(),
                            farmacia.getFornecedor()))
                    .orElse(false);
            case MEDICAMENTO -> recursoId != null
                    && medicamentoRepo.findById(recursoId)
                    .map(medicamento -> respondePeloFornecedor(usuario, medicamento.getFornecedor()))
                    .orElse(false);
        };
    }

    // ---------- Auxiliares de posse ----------

    /** A conta é dona do registro se for a responsável ou se o CNPJ da conta bater. */
    private boolean possuiRegistro(PacienteModel usuario, PacienteModel responsavel, String cnpjRegistro) {
        return dono(responsavel, usuario) || cnpjCoincide(usuario, cnpjRegistro);
    }

    /** Farmácia: dona por si mesma ou pelo fornecedor responsável. */
    private boolean possuiUnidade(PacienteModel usuario, PacienteModel responsavel, String cnpjUnidade,
                                  FornecedorModel fornecedor) {
        if (possuiRegistro(usuario, responsavel, cnpjUnidade)) {
            return true;
        }
        return respondePeloFornecedor(usuario, fornecedor);
    }

    private boolean respondePeloFornecedor(PacienteModel usuario, FornecedorModel fornecedor) {
        return fornecedor != null
                && (dono(fornecedor.getResponsavel(), usuario) || cnpjCoincide(usuario, fornecedor.getCnpj()));
    }

    private boolean dono(PacienteModel responsavel, PacienteModel usuario) {
        return responsavel != null && responsavel.getId() != null && responsavel.getId().equals(usuario.getId());
    }

    /** Compara CNPJ só pelos dígitos: "61.774.267/0001-00" = "61774267000100". */
    private boolean cnpjCoincide(PacienteModel usuario, String cnpjRegistro) {
        String conta = somenteDigitos(usuario.getCnpj());
        String registro = somenteDigitos(cnpjRegistro);
        return !conta.isEmpty() && conta.equals(registro);
    }

    public static String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }
}
