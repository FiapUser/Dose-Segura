#!/usr/bin/env bash
# =============================================================================
# DOSE SEGURA - build nativo para o Render (sem YAML de configuracao)
#
# Configure no painel do Render (Settings > Build & Deploy):
#   Build Command : bash render-build.sh
#   Start Command : java -jar target/dose-segura.jar
#
# O script compila o front (que gera a SPA em src/main/resources/static) e
# depois empacota a aplicacao Java unica com o Spring Boot.
# =============================================================================
set -euo pipefail

echo "==> Node: $(node -v 2>/dev/null || echo 'nao encontrado')"
echo "==> npm: $(npm -v 2>/dev/null || echo 'nao encontrado')"

cd "$(dirname "$0")/frontend"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
npm run build

cd ..
./mvnw -B -DskipTests clean package
echo "==> Artefato: target/dose-segura.jar"
