package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "pacientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private Integer idade;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @ToString.Exclude
    @Column(nullable = false)
    private String senha;

    @Column(columnDefinition = "TEXT")
    private String historicoMedico;

    private String alergias;

    @Column(columnDefinition = "TEXT")
    private String medicamentosEmUso;

    private String contatosEmergencia;

    @Column(columnDefinition = "TEXT")
    private String observacoesMedicas;

    @Column(unique = true)
    private String cpf;

    @Column(unique = true)
    private String cnpj;

    /**
     * Perfil da conta. Definido no cadastro a partir do documento informado:
     * CPF -> PESSOA_FISICA (paciente, familiar ou cuidador), CNPJ -> INSTITUICAO
     * (fornecedor, farmácia, clínica, hospital, home care...). MASTER_ADMIN é
     * concedido pela administração da plataforma.
     */
    @Column(length = 30)
    private String perfil = PerfilConta.PESSOA_FISICA.name();

    /** Conta master: único perfil autorizado a gerenciar imagens de toda a rede. */
    @Column(nullable = false)
    private Boolean masterAdmin = false;

    /** Foto de perfil (Cloudinary). */
    @Column(length = 500)
    private String fotoPerfil;

    /** Public id do Cloudinary, usado para remover/substituir a imagem. */
    @Column(length = 200)
    private String fotoPerfilPublicId;

    @ManyToOne
    @JoinColumn(name = "cuidador_id", nullable = true)
    @JsonIgnoreProperties({"senha", "cuidador"})
    private PacienteModel cuidador;

    // ---------- Regras de perfil ----------

    /**
     * Perfil efetivo da conta. O CNPJ define a conta jurídica: mesmo com
     * "PESSOA_FISICA" gravado por um cadastro antigo, uma conta com CNPJ é
     * tratada como instituição.
     */
    @JsonIgnore
    public PerfilConta getPerfilConta() {
        boolean possuiCnpj = cnpj != null && !cnpj.isBlank();
        PerfilConta gravado = PerfilConta.de(perfil);
        if (gravado == null) {
            return PerfilConta.padrao(possuiCnpj);
        }
        if (gravado == PerfilConta.MASTER_ADMIN) {
            return gravado;
        }
        return possuiCnpj ? PerfilConta.INSTITUICAO : PerfilConta.PESSOA_FISICA;
    }

    @JsonIgnore
    public boolean isMasterAdminConta() {
        return Boolean.TRUE.equals(masterAdmin) || getPerfilConta().isMasterAdmin();
    }

    @JsonIgnore
    public boolean isPessoaJuridica() {
        return getPerfilConta().isPessoaJuridica();
    }

    /**
     * Tipos de imagem que esta conta pode enviar ao Cloudinary. O backend
     * continua validando a posse do registro; aqui é apenas apoio para a UI.
     */
    @JsonProperty("tiposImagemPermitidos")
    public java.util.List<String> getTiposImagemPermitidos() {
        if (isMasterAdminConta() || isPessoaJuridica()) {
            return java.util.List.of("PERFIL", "FORNECEDOR", "FARMACIA", "MEDICAMENTO");
        }
        return java.util.List.of("PERFIL");
    }

    /**
     * Indica se a conta pode criar, editar e excluir registros da rede
     * (fornecedores, farmácias, medicamentos). Só master admin e instituição.
     */
    @JsonProperty("podeGerenciarRede")
    public boolean isPodeGerenciarRede() {
        return isMasterAdminConta() || isPessoaJuridica();
    }
}
