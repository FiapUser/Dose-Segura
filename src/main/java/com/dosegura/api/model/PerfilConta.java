package com.dosegura.api.model;

/**
 * Perfis de conta do Dose Segura.
 *
 * <p>A regra de upload de imagens no Cloudinary depende do tipo da conta:
 * fornecedor envia o logo da empresa e as fotos dos seus medicamentos; farmácia
 * envia a foto da unidade; paciente/cuidador envia apenas a própria foto de perfil.
 * O master admin pode fazer tudo.</p>
 */
public enum PerfilConta {

    /** Paciente, familiar ou cuidador particular (cadastro por CPF). */
    PESSOA_FISICA("Pessoa física", false, false),

    /** Clínica, hospital, home care, casa de repouso ou operadora (cadastro por CNPJ). */
    INSTITUICAO("Instituição", true, false),

    /** Administrador master da plataforma: gerencia imagens de toda a rede. */
    MASTER_ADMIN("Master admin", true, true);

    private final String rotulo;
    private final boolean pessoaJuridica;
    private final boolean masterAdmin;

    PerfilConta(String rotulo, boolean pessoaJuridica, boolean masterAdmin) {
        this.rotulo = rotulo;
        this.pessoaJuridica = pessoaJuridica;
        this.masterAdmin = masterAdmin;
    }

    public String getRotulo() {
        return rotulo;
    }

    public boolean isPessoaJuridica() {
        return pessoaJuridica;
    }

    public boolean isMasterAdmin() {
        return masterAdmin;
    }

    /** Converte o nome persistido; devolve null quando não reconhece. */
    public static PerfilConta de(String valor) {
        if (valor != null) {
            for (PerfilConta perfil : values()) {
                if (perfil.name().equalsIgnoreCase(valor.trim())) {
                    return perfil;
                }
            }
        }
        return null;
    }

    /** Perfil padrão quando não há valor gravado. */
    public static PerfilConta padrao(boolean possuiCnpj) {
        return possuiCnpj ? INSTITUICAO : PESSOA_FISICA;
    }
}
