import { useEffect, useState } from 'react'
import { BadgeCheck, Building2, Edit3, Eye, Package, Plus, RefreshCw, Save, ShieldAlert, Store, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { marketplaceApi, pharmacyApi } from '../services/api'
import { errorMessage, formatCurrency, onlyFilled, somenteDigitos } from '../lib/format'
import { urlFarmacia, urlFornecedor, urlMedicamento } from '../lib/images'
import SmartImage from '../components/SmartImage'
import ImageUploadField from '../components/ImageUploadField'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, StatusBadge } from '../components/ui'

const abas = [
  { id: 'fornecedores', label: 'Fornecedores', icon: Building2 },
  { id: 'farmacias', label: 'Farmácias', icon: Store },
  { id: 'medicamentos', label: 'Medicamentos', icon: Package },
]

// Imagem de cada recurso: quem envia e qual pasta do Cloudinary é usada.
// `bruto` devolve a URL já salva (null quando ainda não houve upload).
const IMAGEM = {
  fornecedores: { tipo: 'FORNECEDOR', rotulo: 'Logo do fornecedor', url: urlFornecedor, bruto: (item) => item?.urlLogo },
  farmacias: { tipo: 'FARMACIA', rotulo: 'Foto da farmácia', url: urlFarmacia, bruto: (item) => item?.urlImagem },
  medicamentos: { tipo: 'MEDICAMENTO', rotulo: 'Foto do medicamento', url: urlMedicamento, bruto: (item) => item?.urlImagem },
}

const configuracoes = {
  fornecedores: {
    title: 'Fornecedor',
    empty: 'Nenhum fornecedor cadastrado',
    initial: { nomeFornecedor: '', cnpj: '', endereco: '', telefone: '', avaliacao: '', descricao: '' },
    fields: [
      { key: 'nomeFornecedor', label: 'Nome do fornecedor', full: true, required: true },
      { key: 'cnpj', label: 'CNPJ', required: true },
      { key: 'telefone', label: 'Telefone' },
      { key: 'avaliacao', label: 'Avaliação', type: 'number' },
      { key: 'endereco', label: 'Endereço', full: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },
    ],
  },
  farmacias: {
    title: 'Farmácia',
    empty: 'Nenhuma farmácia cadastrada',
    initial: { nomeUnidade: '', cnpj: '', endereco: '', telefone: '', taxaEntrega: '', tempoEntregaMinutos: '', fornecedorId: '' },
    fields: [
      { key: 'nomeUnidade', label: 'Nome da unidade', full: true, required: true },
      { key: 'cnpj', label: 'CNPJ', required: true },
      { key: 'telefone', label: 'Telefone' },
      { key: 'fornecedorId', label: 'Fornecedor', type: 'supplier', required: true },
      { key: 'endereco', label: 'Endereço', full: true },
      { key: 'taxaEntrega', label: 'Taxa de entrega', type: 'number' },
      { key: 'tempoEntregaMinutos', label: 'Tempo de entrega (min)', type: 'number' },
    ],
  },
  medicamentos: {
    title: 'Medicamento',
    empty: 'Nenhum medicamento cadastrado',
    initial: { nome: '', dosagem: '', fabricante: '', categoria: '', principioAtivo: '', descricao: '', precoOriginal: '', descontoPorcentagem: '0', descontoSelecionado: false, estoqueDisponivel: '0', estoqueFabricante: '0', fornecedorId: '' },
    fields: [
      { key: 'nome', label: 'Nome', full: true, required: true },
      { key: 'categoria', label: 'Categoria', hint: 'Ex.: Cardiovascular, Digestivo, Suplementos' },
      { key: 'precoOriginal', label: 'Preço original', type: 'number', required: true },
      { key: 'descontoPorcentagem', label: 'Desconto (%)', type: 'number' },
      { key: 'fornecedorId', label: 'Fornecedor', type: 'supplier', required: true },
      { key: 'dosagem', label: 'Dosagem' },
      { key: 'fabricante', label: 'Fabricante' },
      { key: 'estoqueDisponivel', label: 'Estoque disponível', type: 'number', required: true },
      { key: 'estoqueFabricante', label: 'Estoque do fabricante', type: 'number', required: true },
      { key: 'principioAtivo', label: 'Princípio ativo', full: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },
      { key: 'descontoSelecionado', label: 'Aplicar desconto', type: 'checkbox', full: true },
    ],
  },
}

function nomeDoRecurso(item) {
  return item?.nome || item?.nomeUnidade || item?.nomeFornecedor || ''
}

function flattenEntity(entity) {
  const { fornecedor, fornecedorId, ...values } = entity || {}
  return {
    ...values,
    fornecedorId: fornecedor?.id || fornecedorId || '',
    descontoSelecionado: Boolean(values.descontoSelecionado),
  }
}

function buildPayload(abaAtiva, form) {
  const { fornecedorId, ...values } = onlyFilled(form)
  const payload = onlyFilled(values)
  const numericFields = {
    fornecedores: ['avaliacao'],
    farmacias: ['taxaEntrega', 'tempoEntregaMinutos'],
    medicamentos: ['precoOriginal', 'descontoPorcentagem', 'estoqueDisponivel', 'estoqueFabricante'],
  }
  numericFields[abaAtiva].forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key])
  })
  if (fornecedorId && abaAtiva !== 'fornecedores') payload.fornecedor = { id: Number(fornecedorId) }
  return payload
}

function displayRecord(abaAtiva, item, suppliers) {
  if (abaAtiva === 'medicamentos') {
    return {
      title: item.nome || 'Medicamento',
      subtitle: `${item.dosagem || 'Dosagem não informada'} · ${item.fabricante || 'Fabricante não informado'}`,
      badge: formatCurrency(item.preco ?? item.precoOriginal),
      lines: [
        item.categoria,
        item.estoqueDisponivel != null ? `Disponível: ${item.estoqueDisponivel}` : null,
        item.descontoPorcentagem ? `Desconto: ${item.descontoPorcentagem}%` : null,
      ],
      relation: suppliers.find((supplier) => String(supplier.id) === String(item.fornecedor?.id || item.fornecedorId))?.nomeFornecedor,
    }
  }
  if (abaAtiva === 'farmacias') {
    const supplier = suppliers.find((entry) => String(entry.id) === String(item.fornecedor?.id || item.fornecedorId))
    return {
      title: item.nomeUnidade || 'Farmácia',
      subtitle: item.telefone || 'Unidade da rede',
      badge: item.cnpj || 'Rede',
      lines: [
        item.endereco,
        item.taxaEntrega != null ? `Entrega: ${formatCurrency(item.taxaEntrega)}` : null,
        item.tempoEntregaMinutos != null ? `Tempo: ${item.tempoEntregaMinutos} min` : null,
      ],
      relation: supplier?.nomeFornecedor,
    }
  }
  return {
    title: item.nomeFornecedor || 'Fornecedor',
    subtitle: item.telefone || 'Parceiro da rede',
    badge: item.cnpj || 'Parceiro',
    lines: [item.endereco, item.avaliacao != null ? `Avaliação: ${item.avaliacao}` : null],
    relation: null,
  }
}

function listRequest(abaAtiva) {
  if (abaAtiva === 'fornecedores') return marketplaceApi.listarFornecedores()
  if (abaAtiva === 'farmacias') return pharmacyApi.listar()
  return marketplaceApi.listarMedicamentos()
}

function getRequest(abaAtiva, id) {
  if (abaAtiva === 'fornecedores') return marketplaceApi.obterFornecedor(id)
  if (abaAtiva === 'farmacias') return pharmacyApi.obter(id)
  return marketplaceApi.obterMedicamento(id)
}

function createRequest(abaAtiva, payload) {
  if (abaAtiva === 'fornecedores') return marketplaceApi.criarFornecedor(payload)
  if (abaAtiva === 'farmacias') return pharmacyApi.criar(payload)
  return marketplaceApi.cadastrarMedicamento(payload)
}

function updateRequest(abaAtiva, id, payload) {
  if (abaAtiva === 'fornecedores') return marketplaceApi.atualizarFornecedor(id, payload)
  if (abaAtiva === 'farmacias') return marketplaceApi.atualizar(id, payload)
  return marketplaceApi.atualizarMedicamento(id, payload)
}

function deleteRequest(abaAtiva, id) {
  if (abaAtiva === 'fornecedores') return marketplaceApi.excluirFornecedor(id)
  if (abaAtiva === 'farmacias') return marketplaceApi.excluir(id)
  return marketplaceApi.excluirMedicamento(id)
}

export default function ManagementPage() {
  const { notify } = useToast()
  const { user } = useAuth()
  const [aba, setAba] = useState('fornecedores')
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(configuracoes.fornecedores.initial)
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const configuracao = configuracoes[aba]
  const permitidos = user?.tiposImagemPermitidos || ['PERFIL']
  // Somente master admin e contas de instituição (CNPJ) administram a rede.
  const podeGerenciar = user?.podeGerenciarRede ?? user?.masterAdmin ?? false
  const meuCnpj = user?.cnpj || ''

  /** Registro pertence a esta conta: responsável ou mesmo CNPJ. */
  const podeEditarRegistro = (item) => {
    if (!podeGerenciar) return false
    if (user?.masterAdmin) return true
    if (item?.responsavel?.id && item.responsavel.id === user.id) return true
    const cnpjItem = item?.cnpj || item?.fornecedor?.cnpj || ''
    return somenteDigitos(meuCnpj) !== '' && somenteDigitos(meuCnpj) === somenteDigitos(cnpjItem)
  }

  const load = (abaAtiva = aba) => {
    setLoading(true)
    setError('')
    const supplierRequest = abaAtiva === 'fornecedores' ? Promise.resolve(null) : marketplaceApi.listarFornecedores()
    Promise.allSettled([listRequest(abaAtiva), supplierRequest])
      .then(([listResult, supplierResult]) => {
        if (listResult.status === 'fulfilled') setItems(Array.isArray(listResult.value) ? listResult.value : [])
        else setError(errorMessage(listResult.reason))
        if (supplierResult.status === 'fulfilled' && Array.isArray(supplierResult.value)) setSuppliers(supplierResult.value)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setForm(configuracoes[aba].initial)
    setEditing(null)
    load(aba)
  }, [aba])

  const openCreate = () => {
    // Instituição cadastra em nome do próprio CNPJ (exigência do backend).
    const inicial = { ...configuracao.initial }
    if (!user?.masterAdmin && meuCnpj && inicial.cnpj !== undefined) inicial.cnpj = meuCnpj
    setForm(inicial)
    setEditing(null)
    setModalOpen(true)
  }

  const openRecord = async (item, mode) => {
    if (mode === 'edit') {
      if (!podeEditarRegistro(item)) {
        notify('Você só pode editar os registros da sua própria empresa (CNPJ).', 'error')
        return
      }
      setForm({ ...configuracao.initial, ...flattenEntity(item) })
      setEditing(item)
      setModalOpen(true)
      return
    }
    setBusyId(item.id)
    try {
      const detalhes = await getRequest(aba, item.id)
      setForm({ ...configuracao.initial, ...flattenEntity(detalhes) })
      setEditing(detalhes)
      setModalOpen(true)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(aba, form)
      const salvo = editing ? await updateRequest(aba, editing.id, payload) : await createRequest(aba, payload)
      setItems((current) => (editing
        ? current.map((item) => (item.id === salvo.id ? salvo : item))
        : [salvo, ...current]))
      setEditing(salvo)
      if (editing) {
        setModalOpen(false)
        notify('Registro atualizado com sucesso.', 'success')
      } else {
        // Novo registro: o modal continua aberto para o usuário enviar a imagem
        // imediatamente (o upload exige o id, que só existe depois de salvar).
        notify('Registro criado. Agora envie a imagem abaixo.', 'success')
      }
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await deleteRequest(aba, deleteTarget.id)
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify('Registro excluído.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const imagemConfig = IMAGEM[aba]
  // Visualização de registro de outra empresa: sem edição, sem upload e sem salvar.
  const somenteLeitura = Boolean(editing) && !podeEditarRegistro(editing)

  return (
    <div className="page-shell page-container management-page">
      <PageIntro
        eyebrow="Backoffice da rede"
        title="Gestão que sustenta o cuidado."
        description={podeGerenciar
          ? 'Cadastre fornecedores, farmácias e medicamentos e envie as imagens direto para o Cloudinary.'
          : 'Consulte a rede. Para cadastrar ou editar registros, a conta precisa ser de instituição (CNPJ).'}
        action={(
          <div className="page-actions">
            <Button variant="ghost" onClick={() => load()} icon={RefreshCw}>Atualizar</Button>
            {podeGerenciar && <Button onClick={openCreate} icon={Plus}>Novo registro</Button>}
          </div>
        )}
      />

      {!podeGerenciar && (
        <div className="notice notice--permission">
          <ShieldAlert size={19} />
          <span>
            Sua conta é de pessoa física: dá para consultar a rede e comprar no marketplace, mas criar,
            editar ou excluir fornecedores, farmácias e medicamentos é restrito ao master admin e às
            instituições (contas com CNPJ).
          </span>
        </div>
      )}

      {podeGerenciar && !user?.masterAdmin && (
        <div className="notice notice--permission notice--permission--ok">
          <BadgeCheck size={19} />
          <span>
            Você gerencia os registros da sua empresa (CNPJ {meuCnpj || 'não informado'}) e envia as imagens deles.
            Registros de outras empresas ficam somente para leitura.
          </span>
        </div>
      )}

      <div className="management-tabs" role="tablist">
        {abas.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            <Icon size={19} />{label}<b>{items.length}</b>
          </button>
        ))}
      </div>
      <ErrorNotice message={error} onRetry={() => load()} />

      {loading ? <LoadingState /> : items.length ? (
        <div className="management-list">
          {items.map((item, index) => {
            const display = displayRecord(aba, item, suppliers)
            return (
              <article className="management-item" key={item.id || index}>
                <span className="management-item__index">{String(index + 1).padStart(2, '0')}</span>
                <div className={`management-item__symbol management-item__symbol--${aba}`}>
                  {aba === 'fornecedores' ? <Building2 /> : aba === 'farmacias' ? <Store /> : <Package />}
                </div>
                <div className="table-identity">
                  <SmartImage
                    src={imagemConfig.url(item, { w: 96, h: 96 })}
                    tipo={aba === 'medicamentos' ? 'medicamento' : aba}
                    rotulo={nomeDoRecurso(item)}
                    alt={display.title}
                  />
                </div>
                <div className="management-item__main">
                  <div>
                    <StatusBadge tone={aba === 'medicamentos' ? 'blue' : 'green'}>{configuracao.title}</StatusBadge>
                    {display.relation && <span>Parceiro: {display.relation}</span>}
                  </div>
                  <h2>{display.title}</h2>
                  <p>{display.subtitle}</p>
                  <div className="management-item__lines">
                    {display.lines.filter(Boolean).map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>
                <StatusBadge tone="yellow">{display.badge}</StatusBadge>
                <div className="management-item__actions">
                  <button className="icon-button" type="button" onClick={() => openRecord(item, 'view')} disabled={busyId === item.id} aria-label="Ver detalhes"><Eye size={18} /></button>
                  {podeEditarRegistro(item) && (
                    <>
                      <button className="icon-button" type="button" onClick={() => openRecord(item, 'edit')} aria-label="Editar registro"><Edit3 size={18} /></button>
                      <button className="icon-button icon-button--dark" type="button" onClick={() => setDeleteTarget(item)} aria-label="Excluir registro"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={configuracao.title === 'Medicamento' ? Package : configuracao.title === 'Farmácia' ? Store : Building2}
          title={configuracao.empty}
          description="Use o botão “Novo registro” para conectar um item à API."
          action={<Button onClick={openCreate} icon={Plus}>Criar registro</Button>}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? 'Editar' : 'Novo'} ${configuracao.title.toLowerCase()}`}
        eyebrow="Gestão de rede"
        size="lg"
      >
        <form onSubmit={save}>
          <fieldset className="form-fieldset" disabled={somenteLeitura}>
          <div className="form-grid">
            {configuracao.fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`manage-${field.key}`}
                hint={field.hint}
                className={field.full ? 'field--full' : ''}
                required={field.required}
              >
                {field.type === 'checkbox' ? (
                  <div className="check-field">
                    <input
                      id={`manage-${field.key}`}
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })}
                    />
                    <span>Usar o desconto configurado no preço</span>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={`manage-${field.key}`}
                    className="textarea"
                    value={form[field.key] || ''}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    required={field.required}
                  />
                ) : field.type === 'supplier' ? (
                  <select
                    id={`manage-${field.key}`}
                    className="select"
                    value={form[field.key] || ''}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    required={field.required}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nomeFornecedor}</option>)}
                  </select>
                ) : (
                  <input
                    id={`manage-${field.key}`}
                    className="input"
                    type={field.type || 'text'}
                    value={form[field.key] ?? ''}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    required={field.required}
                  />
                )}
              </Field>
            ))}

            <div className="field--full">
              <ImageUploadField
                tipo={imagemConfig.tipo}
                id={editing?.id}
                nome={editing ? nomeDoRecurso(editing) : form.nome || form.nomeUnidade || form.nomeFornecedor || ''}
                valor={imagemConfig.bruto(editing)}
                rotulo={imagemConfig.rotulo}
                permitidos={permitidos}
                dica="A imagem é enviada para o Cloudinary e usada em todo o marketplace."
                onUploaded={(resultado) => {
                  setItems((current) => editing
                    ? current.map((item) => (item.id === editing.id
                      ? { ...item, urlImagem: resultado.url, urlLogo: resultado.url }
                      : item))
                    : current)
                  if (editing) setEditing((current) => ({ ...current, urlImagem: resultado.url, urlLogo: resultado.url }))
                }}
                onRemoved={() => {
                  if (editing) {
                    setItems((current) => current.map((item) => (item.id === editing.id
                      ? { ...item, urlImagem: null, urlLogo: null }
                      : item)))
                    setEditing((current) => ({ ...current, urlImagem: null, urlLogo: null }))
                  }
                }}
              />
            </div>
          </div>
          </fieldset>
          {somenteLeitura && (
            <p className="upload-field__blocked">
              <ShieldAlert size={15} /> Registro de outra empresa: você pode consultar, mas não editar
              nem enviar imagens.
            </p>
          )}
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{somenteLeitura ? 'Fechar' : 'Cancelar'}</Button>
            {!somenteLeitura && (
              <Button type="submit" loading={saving} icon={Save}>{editing ? 'Salvar alterações' : 'Criar registro'}</Button>
            )}
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={`Excluir ${configuracao.title.toLowerCase()}?`} eyebrow="Confirmação" size="sm">
        <p className="modal-copy">
          O registro <b>{deleteTarget && nomeDoRecurso(deleteTarget)}</b> será removido permanentemente pela API.
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button loading={busyId === deleteTarget?.id} onClick={remove} icon={Trash2}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
