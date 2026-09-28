# Dose Segura

> "A dose certa, na hora certa, para quem mais importa."

Aplicação **única** (front + back) para gestão de tratamentos médicos: agenda de
medicamentos, controle inteligente de estoque, alertas de reposição, dashboard de
saúde, relatórios e uma loja de medicamentos conectada a farmácias e fornecedores
parceiros. Projeto desenvolvido em parceria com a **Eurofarma**.

```
┌──────────────────────────── 1 container / 1 aplicação  ────────────────────────────┐
│  Spring Boot 4 (Java 21)                                                            │
│    ├── API REST  /dosegura/api/**   (JWT, MySQL, Cloudinary)                        │
│    └── SPA       /**                (React 19 + Vite, servida pelo próprio Spring)  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Estrutura do projeto

```
.
├── pom.xml                     # build Maven único (Java 21) — inclui o build do front
├── Dockerfile                  # build Node + Maven, runtime JRE
├── docker-compose.yml          # app + MySQL local
├── render-build.sh             # build nativo para o Render
├── .env.example                # variáveis de ambiente
├── src/main/java/...           # API (controllers, services, models, security, config)
├── src/main/resources/
│   ├── application.properties  # configuração por ambiente (Render/Aiven/Cloudinary)
│   └── static/                 # build do front (gerado, fora do Git)
└── frontend/                   # React + Vite (SPA da loja)
    └── src/{pages,components,context,services,lib}
```

O front é compilado para `src/main/resources/static` e servido pelo próprio Spring
Boot, então **não existe CORS em produção**: uma única origem para a interface e a API.

---

## 2. Rodando localmente

### Opção A — Docker (recomendado)

```bash
cp .env.example .env      # opcional: ajuste senhas e credenciais
docker compose up --build
```

- Interface + API: <http://localhost:8080>
- MySQL: `localhost:3307`

### Opção B — sem Docker

```bash
# 1. front (com proxy para a API na 8080)
cd frontend && npm install && npm run dev     # http://localhost:5173

# 2. back
DB_HOST=localhost DB_PORT=3307 DB_NAME=dosesegura DB_USER=usr DB_PASSWORD=123 \
DB_SSL=false ./mvnw spring-boot:run
```

### Build do artefato único

```bash
./mvnw clean package          # compila o front e a API em target/dose-segura.jar
java -jar target/dose-segura.jar

# pular o front (só Java):
./mvnw clean package -Dskip.frontend=true
```

### Contas criadas na carga inicial

| Perfil         | E-mail                            | CNPJ                 | Senha             |
|----------------|-----------------------------------|----------------------|-------------------|
| Master admin   | `admin@dosesegura.com.br`         | —                    | `DoseSegura@2026` |
| Instituição    | `parceira@dose-segura.com.br`     | `61.774.267/0001-00` | `Parceira@2026`   |
| Cuidador (CPF) | `cuidador@exemplo.com`            | —                    | `Cuidador@2026`   |
| Paciente (CPF) | `paciente@exemplo.com`            | —                    | `Paciente@2026`   |

A conta de instituição é a dona dos registros do CNPJ `61.774.267/0001-00` na
vitrine: é ela que cadastra/edita e envia as imagens do fornecedor Eurofarma, das
farmácias da rede e dos medicamentos do portfólio. Troque com
`DEMO_INSTITUICAO_EMAIL` / `DEMO_INSTITUICAO_SENHA` / `DEMO_INSTITUICAO_CNPJ`.

A carga inicial também monta a vitrine (2 fornecedores, 3 farmácias, 10
medicamentos, estoque e agenda do paciente de exemplo). Para desligar:
`DOSEGURA_SEED_ENABLED=false`.

---

## 3. Cloudinary — imagens da rede

O SDK oficial (`com.cloudinary:cloudinary-core` + `cloudinary-http5`) é usado no
backend; a chave `api_secret` **nunca** vai para o navegador.

```env
CLOUDINARY_CLOUD_NAME=x
CLOUDINARY_API_KEY=y
CLOUDINARY_API_SECRET=z
CLOUDINARY_FOLDER=dose-segura      # opcional
```

Sem essas variáveis a aplicação continua funcionando: as telas exibem a
ilustração SVG gerada pela própria API
(`/dosegura/api/ilustracoes/{tipo}/{nome}`), com a identidade de saúde/farmácia
(cápsula, cruz, farmácia) em azul e verde.

### Quem gerencia o quê (validado no backend)

| Conta | Lê a rede | Cria/edita/exclui registros | Envia imagens |
|-------|-----------|----------------------------|---------------|
| **Master admin** | sim | **qualquer** registro | **toda a rede** |
| **Instituição (CNPJ)** | sim | apenas os registros do **próprio CNPJ** (ou em que é a responsável) | logo do fornecedor, fotos das farmácias e dos medicamentos da empresa |
| **Paciente / familiar / cuidador (CPF)** | sim | **não** | apenas a própria foto de perfil |

Duas âncoras de posse, combinadas:

1. **responsável** — quem cadastrou o registro vira `responsavel` dele;
2. **CNPJ** — a conta de instituição também administra o registro cujo CNPJ é
   igual ao dela (comparado só pelos dígitos), e, nas farmácias e medicamentos,
   os do CNPJ do fornecedor responsável.

Consequências diretas:

- paciente/cuidador **não** cria, edita nem exclui fornecedor, farmácia ou remédio
  (`403` mesmo chamando a API direto, não só escondendo botões);
- uma instituição não consegue cadastrar registro em nome de outra empresa
  (`403` na criação com CNPJ divergente);
- uma instituição não altera nem apaga registros de terceiros;
- medicamento não pode ser transferido para o portfólio de outro fornecedor.

Na interface, a tela **Gestão** mostra um aviso conforme o perfil: para conta de
pessoa física explica que a administração da rede é do master admin e das
instituições; para instituição, avisa que ela responde pelo próprio CNPJ. Registros
de outras empresas abrem em modo somente leitura (sem botão de salvar, sem upload).

### Endpoints

| Método | Rota                                   | Descrição                                   |
|--------|----------------------------------------|---------------------------------------------|
| GET    | `/dosegura/api/imagens/config`         | se o Cloudinary está ativo + pastas         |
| POST   | `/dosegura/api/imagens`                | `multipart`: `tipo`, `id`, `nome`, `arquivo`|
| DELETE | `/dosegura/api/imagens/{tipo}/{id}`    | remove do Cloudinary e limpa o campo        |

`tipo` = `PERFIL`, `FORNECEDOR`, `FARMACIA` ou `MEDICAMENTO`. As imagens ficam
organizadas em `dose-segura/medicamentos`, `dose-segura/farmacias`,
`dose-segura/fornecedores` e `dose-segura/perfis`. A URL salva é devolvida com
transformações `f_auto,q_auto,w_,h_` aplicadas pelo front.

Na interface, o envio acontece em **Gestão** (fornecedores, farmácias e
medicamentos) e em **Minha rede → foto de perfil**; contas sem permissão veem
exatamente o que podem ou não podem enviar.

---

## 4. Render + Aiven (MySQL)

Sem YAML de configuração: tudo pelo painel do Render e variáveis de ambiente.

### 4.1 Banco no Aiven

1. Crie um serviço **MySQL** no Aiven.
2. Em *Connection*, copie **Host**, **Port**, **Database**, **User** e **Password**.

### 4.2 Web Service no Render

| Campo                    | Valor                                |
|--------------------------|--------------------------------------|
| Runtime                  | Docker (usa o `Dockerfile` da raiz)  |
| Region                   | a mesma do Aiven (menor latência)    |
| Health Check Path        | `/dosegura/api/ilustracoes/perfil/health` |

Variáveis de ambiente (**Settings → Environment**):

```env
# Aiven
DB_HOST=xxxx.aivencloud.com
DB_PORT=12345
DB_NAME=dosesegura
DB_USER=avnadmin
DB_PASSWORD=••••••
DB_SSL=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=x
CLOUDINARY_API_KEY=y
CLOUDINARY_API_SECRET=z

# Segurança (gere com: openssl rand -base64 48)
JWT_SECRET=••••••

# Carga inicial (deixe true no primeiro deploy; depois pode ser false)
DOSEGURA_SEED_ENABLED=true
MASTER_ADMIN_EMAIL=admin@dosesegura.com.br
MASTER_ADMIN_SENHA=<senha forte>
```

O Render já define `PORT`; a aplicação usa `${PORT:8080}`.

### 4.3 Alternativa: build nativo (sem Docker)

| Campo           | Valor                        |
|-----------------|------------------------------|
| Build Command   | `bash render-build.sh`       |
| Start Command   | `java -jar target/dose-segura.jar` |

O script roda `npm ci && npm run build` e depois `./mvnw -DskipTests clean package`.

### Observações

- `spring.jpa.hibernate.ddl-auto=update` cria/atualiza as tabelas no primeiro deploy.
- Aiven exige TLS: `DB_SSL=true` liga `useSSL/requireSSL`.
- `JWT_SECRET` vazio gera uma chave temporária — **toda sessão morre a cada
  reinício**. Defina sempre em produção.

---

## 5. API (resumo)

Base: `/dosegura/api`

| Recurso        | Rotas principais                                                        |
|----------------|-------------------------------------------------------------------------|
| Auth           | `POST /login`, `POST /paciente`, `GET /paciente/{id}`, `PUT /paciente/{id}` |
| Marketplace    | `/marketplace/medicamentos`, `/marketplace/fornecedores`, busca por nome |
| Farmácias      | `/farmacias`, `/farmacias/fornecedor/{id}`                              |
| Carrinho       | `/carrinho/paciente/{id}` (obter, adicionar, remover, finalizar)       |
| Agenda         | `/agenda/paciente/{id}`, `/agenda/{id}/concluir`                        |
| Estoque/Painel | `/dashboard-estoque/estoque`, `/dashboard-estoque/painel/paciente/{id}` |
| Notificações   | `/notificacoes/minhas`, `/notificacoes/{id}/ler` (em memória)        |
| Vínculos       | `/vinculos/solicitar`, `/vinculos/recebidos`, `/vinculos/{id}/aceitar`   |
| Relatórios     | `/relatorios/configurar`, `/relatorios/familiar/{id}`                   |
| Imagens        | `/imagens`, `/imagens/config`, `/imagens/{tipo}/{id}`                  |
| Ilustrações    | `GET /ilustracoes/{tipo}/{nome}` (SVG público)                         |

Autenticação por JWT (`Authorization: Bearer ...`); erros no formato
`{ "codigo": "...", "mensagem": "..." }`.

### Vínculo de cuidado (confirmação obrigatória)

Não existe mais vínculo imediato nem senha de dependente:

1. quem cuida (ou quer um responsável) envia `POST /vinculos/solicitar` com o
   e-mail da outra conta e o tipo (`CUIDADO` ou `RESPONSAVEL`);
2. a conta destinatária recebe o alerta na **área de notificações** e decide em
   **"Sim, vincular"** ou **"Não quero"**;
3. só no aceite o cuidador é gravado em `paciente.cuidador`.

Regras: o pedido duplicado pendente é bloqueado, e-mail inexistente retorna 400
com mensagem clara, apenas o destinatário responde (403 nos demais) e apenas quem
enviou cancela. Os endpoints antigos `PUT /paciente/{id}/vincular-cuidador/{id}` e
`POST /paciente/dependentes` foram removidos.

### Notificações

Os alertas ficam **em memória**: máximo de 20 por conta, expiram em 24 horas e
somem quando a aplicação reinicia. Não há mais histórico salvo no banco (a tabela
`notificacoes_sistema` deixou de ser usada). A aba "Histórico" foi removida da
interface.

---

## 6. Design

Identidade de **loja virtual** com paleta azul + verde e simbolismo de saúde e
farmácia:

- `#0b4ed8` / `#06285c` azul (marca, ações), `#12b76a` verde (confiança, saúde);
- cabeçalho de loja: busca, carrinho com contador, faixa de frete e de parceria;
- cards de produto com fita de desconto, selos, preço riscado, parcelas e
  botão de compra; cartões de farmácia e fornecedor com foto, avaliação e prazo;
- ícones de saúde/farmácia (cápsula, cruz, estetoscópio, seringa, coração);
- marca (`EscudoDoseSegura`): escudo com relógio e selo de confirmação verde, no
  cabeçalho, no rodapé e no favicon;
- acessibilidade: corpo de texto grande, alvos de toque ≥ 44 px, foco visível,
  contraste alto e ícones com rótulo textual.

Componentes novos em `frontend/src/components`: `ProductCard`, `StoreCards`,
`StoreBlocks`, `StoreRating`, `StockMeter`, `SmartImage`, `ImageUploadField`,
`CartContext`.

---

## 7. Scripts úteis

```bash
docker compose up --build           # sobe app + MySQL
docker compose logs -f app          # logs da aplicação
docker compose down -v              # remove containers e o volume do MySQL

cd frontend && npm run dev          # front em modo dev (proxy para :8080)
cd frontend && npx oxlint src       # lint do front
./mvnw -DskipTests package          # artefato único
```
