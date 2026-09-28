package com.dosegura.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Sobe o contexto completo. Precisa de um MySQL acessivel: rode
 * {@code docker compose up -d db-dose-segura} e
 * {@code DB_HOST=localhost DB_PORT=3307 DB_SSL=false ./mvnw test}.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3307}/${DB_NAME:dosesegura}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
        "spring.datasource.username=${DB_USER:usr}",
        "spring.datasource.password=${DB_PASSWORD:123}",
        "dosegura.seed.enabled=false"
})
class ApiApplicationTests {

    @Test
    void contextLoads() {
    }

}
