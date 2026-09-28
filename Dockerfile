# =============================================================================
# DOSE SEGURA - aplicacao unica (front React + back Spring Boot)
#
# Estagio 1  build   : compila o front (Node) e a API Java (Maven)
# Estagio 2  runtime : JRE 21 slim servindo a interface e a API na mesma origem
#
# docker build -t dose-segura .
# docker run -p 8080:8080 -e DB_HOST=... dose-segura
# =============================================================================

# ------------------------------- build ---------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Dependencias primeiro (camada em cache)
COPY pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests || true

# Front + back
COPY frontend ./frontend
COPY src ./src
COPY mvnw ./
COPY .mvn ./.mvn

RUN chmod +x mvnw
RUN mvn -B -DskipTests clean package

# ------------------------------- runtime -------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runtime

# curl para o healthcheck; fonts para os textos padrao
RUN apt-get update \
    && apt-get install --no-install-recommends -y curl fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /build/target/dose-segura.jar app.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom" \
    SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -fsS http://localhost:8080/dosegura/api/ilustracoes/perfil/saude > /dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
