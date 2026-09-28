package com.dosegura.api.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /** Em produção (Render) o front é servido pelo próprio Spring: não há CORS. */
    private final List<String> origensPermitidas;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${dosegura.cors.origens:${CORS_ORIGENS:http://localhost:5173,http://localhost:4173}}")
            String origens) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.origensPermitidas = Arrays.stream(origens.split(","))
                .map(String::trim)
                .filter(origem -> !origem.isBlank())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOrigins(origensPermitidas);
                    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
                    configuration.setAllowCredentials(true);
                    return configuration;
                }))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(erros -> erros
                        .authenticationEntryPoint((request, response, excecao) ->
                                escreverJson(response, 401, "NAO_AUTENTICADO", "Sessão inválida ou expirada."))
                        .accessDeniedHandler((request, response, excecao) ->
                                escreverJson(response, 403, "ACESSO_NEGADO", "Você não tem permissão para acessar este recurso.")))
                .authorizeHttpRequests(authorize -> authorize
                        // Interface (SPA) e arquivos estáticos: servidos pelo próprio Spring Boot.
                        // Tudo que não for a API (/dosegura/api/**) é público para GET.
                        .requestMatchers((request) -> !"GET".equals(request.getMethod())
                                || !request.getRequestURI().startsWith("/dosegura/api/")).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Ilustrações geradas pela API (usadas quando não há imagem no Cloudinary).
                        .requestMatchers(HttpMethod.GET, "/dosegura/api/ilustracoes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/dosegura/api/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/dosegura/api/paciente").permitAll()
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static void escreverJson(HttpServletResponse response, int status, String codigo, String mensagem)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"codigo\":\"" + codigo + "\",\"mensagem\":\"" + mensagem + "\"}");
    }
}
