package com.dosegura.api.model;

import java.util.Map;

/** Resposta padrão dos uploads de imagem. */
public record ImagemUploadResponse(
        String tipo,
        Long recursoId,
        String url,
        String secureUrl,
        String publicId,
        String formato,
        Integer largura,
        Integer altura,
        Long bytes,
        boolean cloudinary) {

    public static ImagemUploadResponse de(Map<?, ?> dados, TipoImagem tipo, Long recursoId, boolean cloudinary) {
        return new ImagemUploadResponse(
                tipo.name(),
                recursoId,
                string(dados, "url"),
                string(dados, "secure_url"),
                string(dados, "public_id"),
                string(dados, "format"),
                inteiro(dados, "width"),
                inteiro(dados, "height"),
                longo(dados, "bytes"),
                cloudinary);
    }

    public static ImagemUploadResponse local(String url, TipoImagem tipo, Long recursoId) {
        return new ImagemUploadResponse(tipo.name(), recursoId, url, url, null, "svg", 640, 640, null, false);
    }

    private static String string(Map<?, ?> dados, String chave) {
        Object valor = dados == null ? null : dados.get(chave);
        return valor == null ? null : valor.toString();
    }

    private static Integer inteiro(Map<?, ?> dados, String chave) {
        Object valor = dados == null ? null : dados.get(chave);
        return valor instanceof Number numero ? numero.intValue() : null;
    }

    private static Long longo(Map<?, ?> dados, String chave) {
        Object valor = dados == null ? null : dados.get(chave);
        return valor instanceof Number numero ? numero.longValue() : null;
    }
}
