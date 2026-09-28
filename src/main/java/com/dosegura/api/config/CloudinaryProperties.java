package com.dosegura.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Credenciais do Cloudinary, vindas do ambiente (Render/docker):
 *
 * <pre>
 * CLOUDINARY_CLOUD_NAME=x
 * CLOUDINARY_API_KEY=y
 * CLOUDINARY_API_SECRET=z
 * </pre>
 *
 * <p>Sem essas variáveis a aplicação continua funcionando: o upload é
 * desabilitado e as telas exibem a ilustração padrão gerada pela própria API
 * ({@code /dosegura/api/medicamentos/ilustracao/{tipo}/{nome}}).</p>
 */
@Component
public class CloudinaryProperties {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryProperties.class);

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String folder;
    private final String uploadPreset;

    public CloudinaryProperties(
            @Value("${dosegura.cloudinary.cloud-name:${CLOUDINARY_CLOUD_NAME:}}") String cloudName,
            @Value("${dosegura.cloudinary.api-key:${CLOUDINARY_API_KEY:}}") String apiKey,
            @Value("${dosegura.cloudinary.api-secret:${CLOUDINARY_API_SECRET:}}") String apiSecret,
            @Value("${dosegura.cloudinary.folder:${CLOUDINARY_FOLDER:dose-segura}}") String folder,
            @Value("${dosegura.cloudinary.preset:${CLOUDINARY_UPLOAD_PRESET:}}") String uploadPreset) {
        this.cloudName = limpa(cloudName);
        this.apiKey = limpa(apiKey);
        this.apiSecret = limpa(apiSecret);
        this.folder = limpa(folder);
        this.uploadPreset = limpa(uploadPreset);

        if (isConfigurado()) {
            log.info("Cloudinary configurado (cloud={}, pasta={})", this.cloudName, this.folder);
        } else {
            log.warn("Cloudinary nao configurado: defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e "
                    + "CLOUDINARY_API_SECRET para habilitar o upload de imagens. As telas usarao as "
                    + "ilustracoes geradas pela propria aplicacao.");
        }
    }

    public boolean isConfigurado() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    public String getCloudName() {
        return cloudName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    public String getFolder() {
        return folder.isBlank() ? "dose-segura" : folder;
    }

    public String getUploadPreset() {
        return uploadPreset;
    }

    private static String limpa(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
