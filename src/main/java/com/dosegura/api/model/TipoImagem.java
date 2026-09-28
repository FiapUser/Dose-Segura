package com.dosegura.api.model;

/** Tipos de recurso que recebem imagem da rede no Cloudinary. */
public enum TipoImagem {

    /** Foto de perfil de paciente, familiar ou cuidador. */
    PERFIL("perfil", "perfis"),

    /** Logo do fornecedor (conta jurídica). */
    FORNECEDOR("fornecedor", "fornecedores"),

    /** Foto da unidade da farmácia (conta jurídica). */
    FARMACIA("farmacia", "farmacias"),

    /** Foto do medicamento, enviada pelo fornecedor responsável. */
    MEDICAMENTO("medicamento", "medicamentos");

    private final String slug;
    private final String pasta;

    TipoImagem(String slug, String pasta) {
        this.slug = slug;
        this.pasta = pasta;
    }

    public String getSlug() {
        return slug;
    }

    public String getPasta() {
        return pasta;
    }

    public static TipoImagem de(String valor) {
        if (valor != null) {
            for (TipoImagem tipo : values()) {
                if (tipo.name().equalsIgnoreCase(valor.trim())) {
                    return tipo;
                }
            }
        }
        return null;
    }
}
