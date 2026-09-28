// Resolução de imagens da rede: Cloudinary quando existe upload, ilustração da
// própria API (SVG com linguagem de saúde/farmácia) como reserva.

const API = (import.meta.env.VITE_API_URL || '/dosegura/api').replace(/\/$/, '')

const CLOUDINARY = 'res.cloudinary.com'

function slug(texto) {
  return (texto || 'item')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .toLowerCase()
    .slice(0, 60)
}

export function ilustracao(tipo, rotulo) {
  const url = `${API}/ilustracoes/${tipo}/${slug(rotulo)}`
  return rotulo ? `${url}?rotulo=${encodeURIComponent(rotulo)}` : url
}

/**
 * Aplica transformações do Cloudinary (f_auto/q_auto + redimensionamento) em URLs
 * de entrega do Cloudinary. URLs externas ou locais passam intactas.
 */
export function comTransformacao(url, largura = 640, altura = 480) {
  if (!url || !url.includes(CLOUDINARY)) return url
  if (url.includes('/upload/') && /f_auto|w_/.test(url)) return url
  const [base, ...resto] = url.split('/upload/')
  return `${base}/upload/f_auto,q_auto,c_fill,g_auto,w_${largura},h_${altura}/${resto.join('/upload/')}`
}

export function urlMedicamento(medicamento, tamanho) {
  if (!medicamento) return ilustracao('medicamento', 'medicamento')
  return comTransformacao(medicamento.urlImagem, tamanho?.w || 640, tamanho?.h || 480)
    || ilustracao('medicamento', medicamento.nome)
}

export function urlFornecedor(fornecedor, tamanho) {
  if (!fornecedor) return ilustracao('fornecedor', 'fornecedor')
  return comTransformacao(fornecedor.urlLogo, tamanho?.w || 480, tamanho?.h || 480)
    || ilustracao('fornecedor', fornecedor.nomeFornecedor)
}

export function urlFarmacia(farmacia, tamanho) {
  if (!farmacia) return ilustracao('farmacia', 'farmacia')
  return comTransformacao(farmacia.urlImagem, tamanho?.w || 640, tamanho?.h || 400)
    || ilustracao('farmacia', farmacia.nomeUnidade)
}

export function urlPerfil(paciente, tamanho) {
  if (!paciente) return ilustracao('perfil', 'perfil')
  return comTransformacao(paciente.fotoPerfil, tamanho?.w || 240, tamanho?.h || 240)
    || ilustracao('perfil', paciente.nome)
}

/** Qtde de parcelas exibida no preço (sem juros). */
export function parcelas(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return null
  return Math.min(10, Math.max(3, Math.floor(numero / 20)))
}
