package com.dosegura.api.security;

import com.dosegura.api.model.PacienteModel;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final Key key;
    private final long jwtExpirationInMs;

    public JwtTokenProvider(
            @Value("${dosegura.jwt.secret:}") String segredoBase64,
            @Value("${dosegura.jwt.expiration-ms:86400000}") long jwtExpirationInMs) {
        this.jwtExpirationInMs = jwtExpirationInMs;
        if (segredoBase64 == null || segredoBase64.isBlank()) {
            log.warn("dosegura.jwt.secret nao configurado: usando chave temporaria. "
                    + "Todos os tokens serao invalidados a cada reinicio. Defina JWT_SECRET em producao.");
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(segredoBase64.trim()));
        }
    }

    public String gerarToken(PacienteModel paciente) {
        Date agora = new Date();
        Date dataExpiracao = new Date(agora.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(String.valueOf(paciente.getId()))
                .setIssuedAt(agora)
                .setExpiration(dataExpiracao)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Long obterIdDoToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return Long.valueOf(claims.getSubject());
    }

    public boolean validarToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
