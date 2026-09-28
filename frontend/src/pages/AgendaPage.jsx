import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarCheck, CalendarDays, Check, Clock3, ListFilter, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { agendaApi, marketplaceApi } from '../services/api'
import { errorMessage, formatDate, formatTime, onlyFilled } from '../lib/format'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, StatusBadge } from '../components/ui'

const TIPOS = [
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'CONSULTA', label: 'Consulta' },
  { value: 'EXAME', label: 'Exame' },
  { value: 'CUIDADO', label: 'Cuidado' },
]

const initialForm = {
  tipo: 'MEDICAMENTO',
  titulo: '',
  dosagem: '',
  horarioInicio: '',
  frequenciaHoras: '24',
  observacoes: '',
}

const doisDigitos = (n) => String(n).padStart(2, '0')

const paraInputDateTime = (data) =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
    + `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`

/** Próximo horário cheio (30 min) a partir de agora: evita erro de digitação de data. */
function proximoHorarioCheio() {
  const alvo = new Date()
  alvo.setSeconds(0, 0)
  alvo.setMinutes(Math.ceil((alvo.getMinutes() + 1) / 30) * 30)
  return paraInputDateTime(alvo)
}

function agoraParaMinutos() {
  const agora = new Date()
  agora.setSeconds(0, 0)
  return paraInputDateTime(agora)
}

const ehAtrasado = (item) => !item.concluido && item.horarioInicio && new Date(item.horarioInicio) < new Date()

export default function AgendaPage() {
  const { activePatientId } = useAuth()
  const { notify } = useToast()
  const [items, setItems] = useState([])
  const [pending, setPending] = useState([])
  const [resumo, setResumo] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [view, setView] = useState('all')
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [selectedMedicineId, setSelectedMedicineId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      agendaApi.listar(activePatientId),
      agendaApi.listarPendentes(activePatientId),
      agendaApi.resumo(activePatientId),
      marketplaceApi.listarMedicamentos(),
    ]).then(([allResult, pendingResult, resumoResult, medicineResult]) => {
      if (allResult.status === 'fulfilled') setItems(Array.isArray(allResult.value) ? allResult.value : [])
      else setError(errorMessage(allResult.reason))
      if (pendingResult.status === 'fulfilled') setPending(Array.isArray(pendingResult.value) ? pendingResult.value : [])
      if (resumoResult.status === 'fulfilled') setResumo(resumoResult.value)
      if (medicineResult.status === 'fulfilled') setMedicines(Array.isArray(medicineResult.value) ? medicineResult.value : [])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [activePatientId])

  const atrasados = useMemo(() => items.filter(ehAtrasado), [items])
  const proximo = resumo?.proximo || null

  const visibleItems = useMemo(() => {
    const ordenada = items.toSorted((a, b) => new Date(a.horarioInicio) - new Date(b.horarioInicio))
    if (view === 'pendentes') return ordenada.filter((item) => !item.concluido)
    if (view === 'concluidos') return ordenada.filter((item) => item.concluido)
    if (view === 'atrasados') return ordenada.filter(ehAtrasado)
    return ordenada
  }, [view, items])

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  const openModal = () => {
    setForm({ ...initialForm, horarioInicio: proximoHorarioCheio() })
    setFieldErrors({})
    setSelectedMedicineId('')
    setModalOpen(true)
  }

  const selectMedicine = (medicineId) => {
    setSelectedMedicineId(medicineId)
    const medicine = medicines.find((item) => String(item.id) === String(medicineId))
    if (medicine) {
      setForm((current) => ({
        ...current,
        tipo: 'MEDICAMENTO',
        titulo: medicine.nome || current.titulo,
        dosagem: medicine.dosagem || current.dosagem,
      }))
      setFieldErrors((current) => ({ ...current, titulo: '' }))
    }
  }

  /**
   * Validação própria: a mensagem nativa do navegador ("Please fill out this
   * field") sai em inglês e não diz o que falta. Aqui a validação é em português
   * e o campo problemático recebe destaque.
   */
  const validar = () => {
    const erros = {}
    if (!form.tipo) erros.tipo = 'Escolha o tipo de compromisso.'
    if (!form.titulo || !form.titulo.trim()) erros.titulo = 'Informe o título do compromisso.'
    if (!form.horarioInicio) {
      erros.horarioInicio = 'Escolha a data e a hora do compromisso.'
    } else if (Number.isNaN(new Date(form.horarioInicio).getTime())) {
      erros.horarioInicio = 'Data e hora inválidas. Use o seletor de data e hora.'
    }
    if (form.tipo === 'MEDICAMENTO' && form.frequenciaHoras && Number(form.frequenciaHoras) <= 0) {
      erros.frequenciaHoras = 'A frequência deve ser maior que zero.'
    }
    setFieldErrors(erros)
    return Object.keys(erros).length === 0
  }

  const createItem = async (event) => {
    event.preventDefault()
    if (!validar()) {
      notify('Confira os campos destacados para concluir o compromisso.', 'error')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = onlyFilled({
        paciente: { id: activePatientId },
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        dosagem: form.dosagem,
        horarioInicio: form.horarioInicio,
        frequenciaHoras: form.frequenciaHoras ? Number(form.frequenciaHoras) : undefined,
        observacoes: form.observacoes,
        concluido: false,
      })
      const created = await agendaApi.criar(payload)
      setItems((current) => [...current, created])
      setModalOpen(false)
      notify('Compromisso adicionado à agenda.', 'success')
      load()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const completeItem = async (item) => {
    setBusyId(item.id)
    try {
      const updated = await agendaApi.concluir(item.id)
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
      notify('Compromisso concluído.', 'success')
      load()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deleteItem = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await agendaApi.excluir(deleteTarget.id)
      setItems((current) => current.filter((entry) => entry.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify('Compromisso excluído.', 'success')
      load()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-shell page-container agenda-page">
      <PageIntro
        eyebrow="Rotina médica"
        title="Sua agenda, sem ruído."
        description="Crie compromissos, acompanhe os pendentes e conclua cada etapa do tratamento."
        action={<Button onClick={openModal} icon={Plus}>Novo compromisso</Button>}
      />

      <div className="agenda-overview">
        <div><span>Todos os compromissos</span><strong>{resumo?.totalCompromissos ?? items.length}</strong></div>
        <div><span>Aguardando ação</span><strong>{resumo?.totalPendentes ?? pending.length}</strong></div>
        <div className={atrasados.length ? 'agenda-overview__card agenda-overview__card--late' : 'agenda-overview__card'}>
          <span>Em atraso</span>
          <strong>{resumo?.totalAtrasados ?? atrasados.length}</strong>
        </div>
        <div className="agenda-overview__note">
          <Clock3 size={20} />
          <b>Próximo cuidado</b>
          <span>
            {proximo
              ? `${proximo.titulo || 'Compromisso'} · ${formatDate(proximo.horarioInicio, true)}`
              : 'Nenhum item pendente'}
          </span>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="segmented-control">
          <button type="button" className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}><CalendarDays size={17} /> Todos</button>
          <button type="button" className={view === 'pendentes' ? 'active' : ''} onClick={() => setView('pendentes')}><ListFilter size={17} /> Pendentes <b>{resumo?.totalPendentes ?? pending.length}</b></button>
          <button type="button" className={view === 'atrasados' ? 'active' : ''} onClick={() => setView('atrasados')}><AlertTriangle size={17} /> Atrasados <b>{resumo?.totalAtrasados ?? atrasados.length}</b></button>
          <button type="button" className={view === 'concluidos' ? 'active' : ''} onClick={() => setView('concluidos')}><Check size={17} /> Concluídos</button>
        </div>
        <span>Ordenado por data e hora</span>
      </div>

      <ErrorNotice message={error} onRetry={load} />
      {loading ? <LoadingState /> : visibleItems.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={view === 'atrasados' ? 'Nenhum compromisso em atraso' : 'Agenda sem compromissos'}
          description="Crie o primeiro compromisso para organizar sua rotina."
          action={<Button onClick={openModal} icon={Plus}>Adicionar compromisso</Button>}
        />
      ) : (
        <div className="agenda-list">
          {visibleItems.map((item, index) => {
            const done = Boolean(item.concluido)
            const atrasado = ehAtrasado(item)
            return (
              <article className={`agenda-item ${done ? 'agenda-item--done' : ''} ${atrasado ? 'agenda-item--late' : ''}`} key={item.id || index}>
                <div className="agenda-item__date">
                  <span>{formatDate(item.horarioInicio)}</span>
                  <b>{formatTime(item.horarioInicio)}</b>
                </div>
                <div className="agenda-item__content">
                  <div>
                    <StatusBadge tone={done ? 'green' : atrasado ? 'red' : 'yellow'}>{item.tipo || 'Compromisso'}</StatusBadge>
                    {atrasado && <StatusBadge tone="red">Em atraso</StatusBadge>}
                    <span>#{String(item.id || index + 1).padStart(2, '0')}</span>
                  </div>
                  <h2>{item.titulo || 'Compromisso'}</h2>
                  <p>{item.observacoes || item.dosagem || 'Sem observações.'}</p>
                </div>
                <div className="agenda-item__dose">
                  <span>{item.frequenciaHoras ? 'A cada' : 'Frequência'}</span>
                  <strong>{item.frequenciaHoras ? `${item.frequenciaHoras} h` : '—'}</strong>
                </div>
                <div className="agenda-item__actions">
                  {!done && <Button size="sm" variant="green" loading={busyId === item.id} onClick={() => completeItem(item)} icon={Check}>Concluir</Button>}
                  <button className="icon-button icon-button--dark" type="button" onClick={() => setDeleteTarget(item)} aria-label="Excluir compromisso"><Trash2 size={18} /></button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo compromisso" eyebrow="Agenda" size="lg">
        {/* noValidate: a validação é nossa, em português, com o campo destacado */}
        <form onSubmit={createItem} noValidate>
          <div className="form-grid">
            <Field label="Tipo" htmlFor="agenda-type" required error={fieldErrors.tipo}>
              <select id="agenda-type" className="select" value={form.tipo} onChange={(event) => setValue('tipo', event.target.value)}>
                {TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
              </select>
            </Field>
            <Field label="Medicamento do catálogo" htmlFor="agenda-medicine" hint="Opcional: preenche título e dosagem.">
              <select id="agenda-medicine" className="select" value={selectedMedicineId} onChange={(event) => selectMedicine(event.target.value)}>
                <option value="">Selecione, se disponível</option>
                {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.nome}</option>)}
              </select>
            </Field>
            <Field label="Título" htmlFor="agenda-title" className="field--full" required error={fieldErrors.titulo}>
              <input id="agenda-title" className="input" value={form.titulo} onChange={(event) => setValue('titulo', event.target.value)} placeholder="Ex.: Tomar Losartana" />
            </Field>
            <Field label="Dosagem" htmlFor="agenda-dosage">
              <input id="agenda-dosage" className="input" value={form.dosagem} onChange={(event) => setValue('dosagem', event.target.value)} placeholder="Ex.: 50mg" />
            </Field>
            <Field
              label="Data e hora"
              htmlFor="agenda-time"
              required
              error={fieldErrors.horarioInicio}
              hint="Use o calendário. Compromissos no passado ficam marcados como atraso."
            >
              <input
                id="agenda-time"
                type="datetime-local"
                className="input"
                value={form.horarioInicio}
                min={agoraParaMinutos()}
                onChange={(event) => setValue('horarioInicio', event.target.value)}
              />
            </Field>
            {form.tipo === 'MEDICAMENTO' && (
              <Field label="Frequência (horas)" htmlFor="agenda-frequency" hint="Ex.: 12 para de 12 em 12 horas." error={fieldErrors.frequenciaHoras}>
                <input id="agenda-frequency" type="number" min="1" className="input" value={form.frequenciaHoras} onChange={(event) => setValue('frequenciaHoras', event.target.value)} />
              </Field>
            )}
            <Field label="Observações" htmlFor="agenda-notes" className="field--full">
              <textarea id="agenda-notes" className="textarea" value={form.observacoes} onChange={(event) => setValue('observacoes', event.target.value)} placeholder="Orientações para este compromisso" />
            </Field>
          </div>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving} icon={Plus}>Adicionar à agenda</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Excluir compromisso?" eyebrow="Confirmação" size="sm">
        <p className="modal-copy">
          Esta ação remove <b>{deleteTarget?.titulo || 'o compromisso'}</b>
          {deleteTarget?.horarioInicio ? ` (${formatDate(deleteTarget.horarioInicio, true)})` : ''} da agenda.
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="primary" loading={busyId === deleteTarget?.id} onClick={deleteItem} icon={Trash2}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
