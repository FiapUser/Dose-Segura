# Front do Dose Segura (React + Vite)

Interface da aplicação **única** do Dose Segura. O build é gerado em
`../src/main/resources/static` para que o Spring Boot sirva a SPA na mesma
origem da API.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173 (faz proxy de /dosegura para :8080)
npm run build    # gera ../src/main/resources/static
npm run preview
npx oxlint src   # lint
```

## Organização

| Pasta          | Conteúdo                                                        |
|----------------|-----------------------------------------------------------------|
| `pages/`       | uma página por rota (loja, carrinho, painel, agenda, rede, gestão) |
| `components/`  | `Layout`, `ProductCard`, `StoreCards`, `StoreBlocks`, `StoreRating`, `StockMeter`, `SmartImage`, `ImageUploadField`, `ui` |
| `context/`     | `AuthContext` (sessão), `CartContext` (contador do carrinho), `RouterContext`, `ToastContext` |
| `services/`    | `api.js` (cliente HTTP + upload no Cloudinary)                 |
| `lib/`         | `format.js` (moeda/data/avatar) e `images.js` (Cloudinary + ilustração da API) |

## Imagens

`SmartImage` usa a foto enviada ao Cloudinary e cai automaticamente na
ilustração da API (`/dosegura/api/ilustracoes/...`) quando não há imagem ou a URL
quebra. `lib/images.js` aplica `f_auto,q_auto` e o tamanho pedido na URL do
Cloudinary.

## API

Por padrão a SPA chama `/dosegura/api` (mesma origem). Para apontar outro host,
defina `VITE_API_URL` (veja `.env.example`).
