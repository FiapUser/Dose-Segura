package com.dosegura.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.dosegura.api.config.CloudinaryProperties;
import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.TipoImagem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Upload e remocao de imagens no Cloudinary.
 *
 * <p>As imagens sao organizadas por tipo de recurso ({@link TipoImagem}) para que
 * a pasta do provedor fique organizada: {@code dose-segura/medicamentos/...},
 * {@code dose-segura/farmacias/...} e assim por diante.</p>
 */
@Service
public class ImagemService {

    private static final Logger log = LoggerFactory.getLogger(ImagemService.class);

    private static final List<String> EXTENSOES_PERMITIDAS =
            List.of("jpg", "jpeg", "png", "webp", "gif", "avif", "svg");

    private static final long TAMANHO_MAXIMO = 5L * 1024 * 1024; // 5 MB

    private final CloudinaryProperties propriedades;
    private final Cloudinary cloudinary;

    @Autowired
    public ImagemService(CloudinaryProperties propriedades) {
        this.propriedades = propriedades;
        this.cloudinary = propriedades.isConfigurado()
                ? new Cloudinary(configuracao())
                : null;
    }

    private Map<String, Object> configuracao() {
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", propriedades.getCloudName());
        config.put("api_key", propriedades.getApiKey());
        config.put("api_secret", propriedades.getApiSecret());
        config.put("secure", true);
        return config;
    }

    public boolean isCloudinaryAtivo() {
        return cloudinary != null;
    }

    /**
     * Envia a imagem para o Cloudinary.
     *
     * @param arquivo   arquivo enviado (validado por tipo e tamanho)
     * @param tipo      tipo do recurso, usado para organizar a pasta
     * @param recursoId id do registro (medicamento, farmácia, fornecedor ou paciente)
     * @param nomeBase  nome sugerido, sem extensão
     */
    public Map<String, Object> enviar(MultipartFile arquivo, TipoImagem tipo, Long recursoId, String nomeBase) {
        validar(arquivo);
        if (cloudinary == null) {
            throw new DadosInvalidosException(
                    "O envio de imagens está desativado: configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e "
                            + "CLOUDINARY_API_SECRET no ambiente da aplicação.");
        }

        Map<String, Object> opcoes = new HashMap<>();
        opcoes.put("folder", propriedades.getFolder() + "/" + tipo.getPasta());
        opcoes.put("public_id", publicId(tipo, recursoId, nomeBase));
        opcoes.put("resource_type", "image");
        opcoes.put("overwrite", true);
        opcoes.put("invalidate", true);
        opcoes.put("use_filename", false);
        opcoes.put("unique_filename", true);
        opcoes.put("tags", new String[]{"dose-segura", tipo.getSlug()});

        try {
            Uploader uploader = cloudinary.uploader();
            return uploader.upload(arquivo.getBytes(), opcoes);
        } catch (IOException e) {
            log.error("Falha ao enviar imagem para o Cloudinary", e);
            throw new DadosInvalidosException("Não foi possível enviar a imagem. Tente novamente.");
        } catch (RuntimeException e) {
            log.error("Erro inesperado do Cloudinary no upload", e);
            throw new DadosInvalidosException("O Cloudinary recusou o envio da imagem.");
        }
    }

    /** Remove a imagem pelo public id. Silencioso quando o id não existe mais. */
    public void remover(String publicId) {
        if (publicId == null || publicId.isBlank() || cloudinary == null) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image", "invalidate", true));
        } catch (IOException | RuntimeException e) {
            log.warn("Nao foi possivel remover a imagem {} no Cloudinary: {}", publicId, e.getMessage());
        }
    }

    /**
     * Monta uma URL do Cloudinary com transformacoes (usada pelo front para
     * redimensionar sem baixar a imagem original).
     */
    public String urlTransformada(String publicIdOuUrl, int largura, int altura) {
        if (publicIdOuUrl == null || publicIdOuUrl.isBlank() || cloudinary == null) {
            return publicIdOuUrl;
        }
        try {
            return cloudinary.url().transformation(
                            new com.cloudinary.Transformation().width(largura).height(altura).crop("fill")
                                    .gravity("auto").quality("auto").fetchFormat("auto"))
                    .generate(publicIdOuUrl);
        } catch (RuntimeException e) {
            return publicIdOuUrl;
        }
    }

    private String publicId(TipoImagem tipo, Long recursoId, String nomeBase) {
        String base = sanitize(nomeBase);
        if (base.isBlank()) {
            base = tipo.getSlug();
        }
        String sufixo = recursoId == null ? "" : "-" + recursoId;
        return base + sufixo;
    }

    private String sanitize(String valor) {
        if (valor == null) {
            return "";
        }
        String limpo = java.text.Normalizer.normalize(valor, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "")
                .toLowerCase();
        return limpo.length() > 60 ? limpo.substring(0, 60) : limpo;
    }

    private void validar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new DadosInvalidosException("Selecione uma imagem para enviar.");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new DadosInvalidosException("A imagem deve ter no máximo 5 MB.");
        }
        String nome = arquivo.getOriginalFilename();
        String extensao = nome != null && nome.contains(".")
                ? nome.substring(nome.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new DadosInvalidosException("Formato não suportado. Use JPG, PNG, WEBP, GIF, AVIF ou SVG.");
        }
    }
}
