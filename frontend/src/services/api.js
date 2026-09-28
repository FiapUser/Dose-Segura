// Em produção o front e a API saem da mesma origem (aplicacao Java unica).
const API_BASE = (import.meta.env.VITE_API_URL || '/dosegura/api').replace(/\/$/, '')
const TOKEN_KEY = 'dose-segura:token'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, params, token, formData } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  const headers = { Accept: 'application/json' }
  const accessToken = token === undefined ? getToken() : token
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const fetchOptions = { method, headers }
  if (formData) {
    fetchOptions.body = formData
  } else if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, fetchOptions)
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está ativo.', 0, null)
  }

  const raw = await response.text()
  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  if (!response.ok) {
    if (response.status === 401 && getToken()) {
      window.dispatchEvent(new Event('dose-segura:unauthorized'))
    }
    const message =
      (data && typeof data === 'object' && (data.message || data.mensagem)) ||
      (typeof data === 'string' && data) ||
      `A solicitação falhou (${response.status}).`
    throw new ApiError(message, response.status, data)
  }

  return data
}

export const authApi = {
  login: (email, senha) => request('/login', { method: 'POST', body: { email, senha }, token: null }),
  buscarPorEmail: (email) => request('/paciente/buscar', { params: { email } }),
  obter: (id) => request(`/paciente/${id}`),
  cadastrar: (data) => request('/paciente', { method: 'POST', body: data, token: null }),
  atualizar: (id, data) => request(`/paciente/${id}`, { method: 'PUT', body: data }),
  excluir: (id) => request(`/paciente/${id}`, { method: 'DELETE' }),
  vincularCuidador: (pacienteId, cuidadorId) =>
    request(`/paciente/${pacienteId}/vincular-cuidador/${cuidadorId}`, { method: 'PUT' }),
  adicionarDependente: (credenciais) =>
    request('/paciente/dependentes', { method: 'POST', body: credenciais }),
  desvincularCuidador: (pacienteId) =>
    request(`/paciente/${pacienteId}/desvincular-cuidador`, { method: 'PUT' }),
  listarDependentes: (cuidadorId) => request(`/paciente/cuidador/${cuidadorId}/dependentes`),
}

export const notificationApi = {
  ativas: (pacienteId) => request(`/notificacoes/paciente/${pacienteId}`),
  historico: (pacienteId) => request(`/notificacoes/paciente/${pacienteId}/historico`),
  marcarComoLida: (id) => request(`/notificacoes/${id}/ler`, { method: 'PUT' }),
}

export const marketplaceApi = {
  listarFornecedores: () => request('/marketplace/fornecedores'),
  obterFornecedor: (id) => request(`/marketplace/fornecedor/${id}`),
  criarFornecedor: (data) => request('/marketplace/fornecedor', { method: 'POST', body: data }),
  atualizarFornecedor: (id, data) => request(`/marketplace/fornecedor/${id}`, { method: 'PUT', body: data }),
  excluirFornecedor: (id) => request(`/marketplace/fornecedor/${id}`, { method: 'DELETE' }),
  listarMedicamentos: () => request('/marketplace/medicamentos'),
  buscarMedicamentos: (nome) => request('/marketplace/buscar', { params: { nome } }),
  obterMedicamento: (id) => request(`/marketplace/medicamento/${id}`),
  cadastrarMedicamento: (data) => request('/marketplace/medicamento', { method: 'POST', body: data }),
  atualizarMedicamento: (id, data) => request(`/marketplace/medicamento/${id}`, { method: 'PUT', body: data }),
  excluirMedicamento: (id) => request(`/marketplace/medicamento/${id}`, { method: 'DELETE' }),
}

export const pharmacyApi = {
  listar: () => request('/farmacias'),
  listarPorFornecedor: (fornecedorId) => request(`/farmacias/fornecedor/${fornecedorId}`),
  obter: (id) => request(`/farmacias/${id}`),
  criar: (data) => request('/farmacias', { method: 'POST', body: data }),
  atualizar: (id, data) => request(`/farmacias/${id}`, { method: 'PUT', body: data }),
  excluir: (id) => request(`/farmacias/${id}`, { method: 'DELETE' }),
}

export const dashboardApi = {
  registrarEstoque: (data) => request('/dashboard-estoque/estoque', { method: 'POST', body: data }),
  listarEstoque: (pacienteId) => request(`/dashboard-estoque/estoque/paciente/${pacienteId}`),
  obterPainel: (pacienteId) => request(`/dashboard-estoque/painel/paciente/${pacienteId}`),
}

export const cartApi = {
  obter: (pacienteId) => request(`/carrinho/paciente/${pacienteId}`),
  adicionar: (pacienteId, medicamentoId, quantidade = 1) =>
    request(`/carrinho/paciente/${pacienteId}/adicionar`, {
      method: 'POST',
      body: { medicamentoId, quantidade },
    }),
  remover: (pacienteId, itemId) =>
    request(`/carrinho/paciente/${pacienteId}/item/${itemId}`, { method: 'DELETE' }),
  finalizar: (pacienteId) => request(`/carrinho/paciente/${pacienteId}/finalizar`, { method: 'POST' }),
}

export const agendaApi = {
  criar: (data) => request('/agenda', { method: 'POST', body: data }),
  listar: (pacienteId) => request(`/agenda/paciente/${pacienteId}`),
  listarPendentes: (pacienteId) => request(`/agenda/paciente/${pacienteId}/pendentes`),
  concluir: (id) => request(`/agenda/${id}/concluir`, { method: 'PUT' }),
  excluir: (id) => request(`/agenda/${id}`, { method: 'DELETE' }),
}

export const reportApi = {
  configurar: (data) => request('/relatorios/configurar', { method: 'POST', body: data }),
  historico: (familiarId) => request(`/relatorios/familiar/${familiarId}`),
}

export const imagensApi = {
  configuracao: () => request('/imagens/config'),
  enviar: ({ tipo, id, nome, arquivo }) => {
    const formData = new FormData()
    formData.append('tipo', tipo)
    if (id) formData.append('id', id)
    if (nome) formData.append('nome', nome)
    formData.append('arquivo', arquivo)
    return request('/imagens', { method: 'POST', formData })
  },
  remover: (tipo, id) => request(`/imagens/${tipo}/${id}`, { method: 'DELETE' }),
}

export const api = {
  auth: authApi,
  notifications: notificationApi,
  marketplace: marketplaceApi,
  pharmacies: pharmacyApi,
  dashboard: dashboardApi,
  cart: cartApi,
  agenda: agendaApi,
  reports: reportApi,
  imagens: imagensApi,
}

export { API_BASE }
