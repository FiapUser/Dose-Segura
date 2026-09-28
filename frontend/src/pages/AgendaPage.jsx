import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, CalendarDays, Check, Clock3, ListFilter, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { agendaApi, marketplaceApi } from '../services/api'
import { errorMessage, formatDate, formatTime, onlyFilled } from '../lib/format'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, StatusBadge } from '../components/ui'

const initialForm = {
  tipo: 'MEDICAMENTO',
  titulo: '',
  dosagem: '',
  horarioInicio: '',
  frequenciaHoras: '24',
  observacoes: '',
}

export default function AgendaPage() {
  const { activePatientId } = useAuth()
  const { notify } = useToast()
  const [items, setItems] = useState([])
  const [pending, setPending] = useState([])
  const [medicines, setMedicines] = useState([])
  const [view, setView] = useState('all')
  const [form, setForm] = useState(initialForm)
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
      marketplaceApi.listarMedicamentos(),
    ]).then(([allResult, pendingResult, medicineResult]) => {
      if (allResult.status === 'fulfilled') setItems(Array.isArray(allResult.value) ? allResult.value : [])
      else setError(errorMessage(allResult.reason))
      if (pendingResult.status === 'fulfilled') setPending(Array.isArray(pendingResult.value) ? pendingResult.value : [])
      if (medicineResult.status === 'fulfilled') setMedicines(Array.isArray(medicineResult.value) ? medicineResult.value : [])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [activePatientId])

  const visibleItems = useMemo(() => {
    if (view === 'pendentes') return pending
    if (view === 'concluidos') return items.filter((item) => Boolean(item.concluido))
    return items
  }, [view, items, pending])

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))

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
    }
  }

  const createItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = onlyFilled({
        paciente: { id: activePatientId },
        tipo: form.tipo,
        titulo: form.titulo,
        dosagem: form.dosagem,
        horarioInicio: form.horarioInicio,
        frequenciaHoras: form.frequenciaHoras ? Number(form.frequenciaHoras) : undefined,
        observacoes: form.observacoes,
        concluido: false,
      })
      const created = await agendaApi.criar(payload)
      setItems((current) => [created, ...current])
      setPending((current) => [created, ...current])
      setForm(initialForm)
      setSelectedMedicineId('')
      setModalOpen(false)
      notify('Compromisso adicionado à agenda.', 'success')
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
      setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
      setPending((current) => current.filter((entry) => entry.id !== updated.id))
      notify('Compromisso concluído.', 'success')
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
      setPending((current) => current.filter((entry) => entry.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify('Compromisso excluído.', 'success')
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
        action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Novo compromisso</Button>}
      />

      <div className="agenda-overview">
        <div className="agenda-overview__shape"><CalendarDays size={34} /></div>
        <div><span>Todos os compromissos</span><strong>{items.length}</strong></div>
        <div><span>Aguardando ação</span><strong>{pending.length}</strong></div>
        <div className="agenda-overview__note"><Clock3 size={20} /><b>Próximo cuidado</b><span>{pending[0] ? `${pending[0].titulo || 'Compromisso'} · ${formatDate(pending[0].horarioInicio, true)}` : 'Nenhum item pendente'}</span></div>
      </div>

      <div className="list-toolbar">
        <div className="segmented-control">
          <button type="button" className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}><CalendarDays size={17} /> Todos</button>
          <button type="button" className={view === 'pendentes' ? 'active' : ''} onClick={() => setView('pendentes')}><ListFilter size={17} /> Pendentes <b>{pending.length}</b></button>
          <button type="button" className={view === 'concluidos' ? 'active' : ''} onClick={() => setView('concluidos')}><Check size={17} /> Concluídos</button>
        </div>
        <span>Ordenado pela API</span>
      </div>

      <ErrorNotice message={error} onRetry={load} />
      {loading ? <LoadingState /> : visibleItems.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Agenda sem compromissos" description="Crie o primeiro compromisso para organizar sua rotina." action={<Button onClick={() => setModalOpen(true)} icon={Plus}>Adicionar compromisso</Button>} />
      ) : (
        <div className="agenda-list">
          {visibleItems.map((item, index) => {
            const done = Boolean(item.concluido)
            return (
              <article className={done ? 'agenda-item agenda-item--done' : 'agenda-item'} key={item.id || index}>
                <div className="agenda-item__date">
                  <span>{formatDate(item.horarioInicio).split('/').slice(0, 2).join('/')}</span>
                  <b>{formatTime(item.horarioInicio)}</b>
                </div>
                <div className="agenda-item__content">
                  <div><StatusBadge tone={done ? 'green' : 'yellow'}>{item.tipo || 'Compromisso'}</StatusBadge><span>#{String(item.id || index + 1).padStart(2, '0')}</span></div>
                  <h2>{item.titulo || 'Compromisso'}</h2>
                  <p>{item.observacoes || item.dosagem || 'Sem observações.'}</p>
                </div>
                <div className="agenda-item__dose"><span>Frequência</span><strong>{item.frequenciaHoras || '—'}</strong></div>
                <div className="agenda-item__actions">
                  {!done && <Button size="sm" variant="lime" loading={busyId === item.id} onClick={() => completeItem(item)} icon={Check}>Concluir</Button>}
                  <button className="icon-button icon-button--dark" type="button" onClick={() => setDeleteTarget(item)} aria-label="Excluir compromisso"><Trash2 size={18} /></button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo compromisso" eyebrow="Agenda" size="lg">
        <form onSubmit={createItem}>
          <div className="form-grid">
            <Field label="Tipo" htmlFor="agenda-type" required>
              <select id="agenda-type" className="select" value={form.tipo} onChange={(event) => setValue('tipo', event.target.value)} required>
                <option value="MEDICAMENTO">Medicamento</option>
                <option value="CONSULTA">Consulta</option>
                <option value="EXAME">Exame</option>
                <option value="CUIDADO">Cuidado</option>
              </select>
            </Field>
            <Field label="Medicamento do catálogo" htmlFor="agenda-medicine" hint="Opcional: preenche título e dosagem.">
              <select id="agenda-medicine" className="select" value={selectedMedicineId} onChange={(event) => selectMedicine(event.target.value)}>
                <option value="">Selecione, se disponível</option>
                {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.nome}</option>)}
              </select>
            </Field>
            <Field label="Título" htmlFor="agenda-title" className="field--full" required>
              <input id="agenda-title" className="input" value={form.titulo} onChange={(event) => setValue('titulo', event.target.value)} placeholder="Ex.: Tomar Losartana" required />
            </Field>
            <Field label="Dosagem" htmlFor="agenda-dosage">
              <input id="agenda-dosage" className="input" value={form.dosagem} onChange={(event) => setValue('dosagem', event.target.value)} placeholder="Ex.: 50mg" />
            </Field>
            <Field label="Data e hora" htmlFor="agenda-time" required>
              <input id="agenda-time" type="datetime-local" className="input" value={form.horarioInicio} onChange={(event) => setValue('horarioInicio', event.target.value)} required />
            </Field>
            <Field label="Frequência (horas)" htmlFor="agenda-frequency" hint="Usada como informação do compromisso.">
              <input id="agenda-frequency" type="number" min="1" className="input" value={form.frequenciaHoras} onChange={(event) => setValue('frequenciaHoras', event.target.value)} />
            </Field>
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
        <p className="modal-copy">Esta ação remove <b>{deleteTarget?.titulo || 'o compromisso'}</b> da agenda e não pode ser desfeita.</p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="primary" loading={busyId === deleteTarget?.id} onClick={deleteItem} icon={Trash2}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
