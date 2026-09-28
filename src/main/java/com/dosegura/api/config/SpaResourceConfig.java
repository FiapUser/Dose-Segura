package com.dosegura.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.time.Duration;

/**
 * Serve a interface (React) junto com a API, na mesma aplicação Java.
 *
 * <p>O build do front fica em {@code src/main/resources/static}. Rotas da SPA
 * ({@code /painel}, {@code /medicamento/1}...) são resolvidas pelo
 * {@code index.html} para que o roteador do front assuma o controle, enquanto
 * {@code /dosegura/api/**} continua indo para os controllers.</p>
 *
 * <p>Cache: arquivos com hash em {@code /assets} podem ficar no cache do
 * navegador; o {@code index.html} é sempre revalidado, senão um deploy novo não
 * apareceria até o cache expirar.</p>
 */
@Configuration
public class SpaResourceConfig implements WebMvcConfigurer {

    private static final String AMBIENTE = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1) assets com hash: cache longo (o nome do arquivo muda a cada build).
        registry.addResourceHandler("/assets/**")
                .addResourceLocations(AMBIENTE + "assets/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());

        // 2) index.html e demais rotas da SPA: sempre revalidado.
        registry.addResourceHandler("/**")
                .addResourceLocations(AMBIENTE)
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource solicitado = location.createRelative(resourcePath);
                        if (solicitado.exists() && solicitado.isReadable()) {
                            return solicitado;
                        }
                        // API, assets e arquivos inexistentes não devem virar o index.html.
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("dosegura/")
                                || resourcePath.startsWith("assets/") || resourcePath.startsWith("actuator/")) {
                            return null;
                        }
                        ClassPathResource index = new ClassPathResource("/static/index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
