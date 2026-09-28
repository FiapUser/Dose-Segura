import { useEffect, useMemo, useState } from 'react'
import { Activity, Boxes, Check, Edit3, PackagePlus, Plus, RefreshCw, Search, Stethoscope } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { dashboardApi, marketplaceApi } from '../services/api'
import { errorMessage, onlyFilled } from '../lib/format'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, SectionTitle, StatusBadge } from '../components/ui'

const initialForm = { nomeMedicamento: '', quantidadeAtualComprimidos: '0', consumoDiarioComprimidos: '1' }

export default function StockPage() {
  const { activePatientId } = useAuth()
  const { notify } = useToast()
  const [entries, setEntries] = useState([])
  const [medicines, setMedicines] = useState([])
  const [panel, setPanel] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      dashboardApi.listarEstoque(activePatientId),
      marketplaceApi.listarMedicamentos(),
      dashboardApi.obterPainel(activePatientId),
    ]).then(([stockResult, medicineResult, panelResult]) => {
      if (stockResult.status === 'fulfilled' && Array.isArray(stockResult.value)) setEntries(stockResult.value)
      else setError(errorMessage(stockResult.reason))
      if (medicineResult.status === 'fulfilled' && Array.isArray(medicineResult.value)) setMedicines(medicineResult.value)
      if (panelResult.status === 'fulfilled') setPanel(panelResult.value)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [activePatientId])

  const filteredEntries = useMemo(() => {
    const term = search.toLocaleLowerCase('pt-BR')
    return entries.filter((entry) => (entry.nomeMedicamento || '').toLocaleLowerCase('pt-BR').includes(term))
  }, [entries, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      nomeMedicamento: entry.nomeMedicamento || '',
      quantidadeAtualComprimidos: String(entry.quantidadeAtualComprimidos ?? 0),
      consumoDiarioComprimidos: String(entry.consumoDiarioComprimidos ?? 0),
    })
    setModalOpen(true)
  }

  const saveEntry = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = onlyFilled({
        id: editingId,
        paciente: { id: activePatientId },
        nomeMedicamento: form.nomeMedicamento,
        quantidadeAtualComprimidos: Number(form.quantidadeAtualComprimidos) || 0,
        consumoDiarioComprimidos: Number(form.consumoDiarioComprimidos) || 0,
      })
      const saved = await dashboardApi.registrarEstoque(payload)
      setEntries((current) => {
        const index = current.findIndex((entry) => entry.id === saved.id)
        if (index === -1) return [saved, ...current]
        return current.map((entry, itemIndex) => itemIndex === index ? saved : entry)
      })
      setModalOpen(false)
      setEditingId(null)
      setForm(initialForm)
      notify(editingId ? 'Estoque atualizado com sucesso.' : 'Medicamento registrado no estoque.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-shell page-container stock-page">
      <PageIntro
        eyebrow="Organização doméstica"
        title="Seu estoque em mãos."
        description="Registre quantidades, consumo diário e acompanhe o resumo de saúde retornado pela API."
        action={<div className="page-actions"><Button variant="light" onClick={load} icon={RefreshCw}>Atualizar</Button><Button onClick={openCreate} icon={PackagePlus}>Registrar item</Button></div>}
      />
      <ErrorNotice message={error} onRetry={load} />

      <section className="stock-hero">
        <div className="stock-hero__shape"><Boxes size={42} /></div>
        <div><span>Medicamentos cadastrados</span><strong>{entries.length}</strong><small>Itens registrados para o paciente selecionado</small></div>
        <div className="stock-hero__metric"><Activity size={24} /><span>Adesão do painel</span><b>{panel?.taxaAdesaoPorcentagem != null ? `${panel.taxaAdesaoPorcentagem}%` : '—'}</b></div>
        <div className="stock-hero__metric"><Stethoscope size={24} /><span>Situações de estoque</span><b>{panel?.situacaoEstoque?.length ?? '—'}</b></div>
      </section>

      <div className="list-toolbar stock-toolbar">
        <div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrar por medicamento" aria-label="Filtrar estoque" /></div>
        <span>{filteredEntries.length} resultado(s)</span>
      </div>

      <SectionTitle eyebrow="Inventário" title="Medicamentos no estoque" description="Dias restantes são calculados pelo backend a partir do consumo diário." />
      {loading ? <LoadingState /> : filteredEntries.length ? (
        <div className="stock-table-wrap data-table-wrap">
          <table className="data-table stock-table">
            <thead><tr><th>Medicamento</th><th>Quantidade</th><th>Consumo/dia</th><th>Dias restantes</th><th>Ação</th></tr></thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr key={entry.id || index}>
                  <td><div className="table-identity"><span><Stethoscope size={19} /></span><div><b>{entry.nomeMedicamento || 'Medicamento'}</b><small>{entry.paciente?.nome || 'Paciente selecionado'}</small></div></div></td>
                  <td><StatusBadge tone={Number(entry.quantidadeAtualComprimidos) > 0 ? 'green' : 'red'}>{entry.quantidadeAtualComprimidos ?? 0} comp.</StatusBadge></td>
                  <td>{entry.consumoDiarioComprimidos ?? 0} comp.</td>
                  <td><strong>{entry.diasRestantes ?? 0} dias</strong></td>
                  <td><Button size="sm" variant="light" onClick={() => openEdit(entry)} icon={Edit3}>Editar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Boxes} title={search ? 'Nenhum item encontrado' : 'Estoque ainda vazio'} description={search ? 'Tente outro termo de busca.' : 'Registre medicamentos para acompanhar sua rotina.'} action={!search ? <Button onClick={openCreate} icon={Plus}>Adicionar item</Button> : undefined} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Atualizar estoque' : 'Registrar no estoque'} eyebrow="Inventário" size="lg">
        <form onSubmit={saveEntry}>
          <div className="form-grid">
            <Field label="Medicamento do catálogo" htmlFor="stock-medicine" hint="Selecione um item ou digite o nome abaixo.">
              <select id="stock-medicine" className="select" value="" onChange={(event) => {
                const medicine = medicines.find((item) => String(item.id) === String(event.target.value))
                if (medicine) setForm((current) => ({ ...current, nomeMedicamento: medicine.nome }))
              }}>
                <option value="">Selecione um medicamento</option>
                {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.nome}</option>)}
              </select>
            </Field>
            <Field label="Nome do medicamento" htmlFor="stock-name" className="field--full" required>
              <input id="stock-name" className="input" value={form.nomeMedicamento} onChange={(event) => setForm({ ...form, nomeMedicamento: event.target.value })} required />
            </Field>
            <Field label="Quantidade atual (comprimidos)" htmlFor="stock-quantity" required>
              <input id="stock-quantity" className="input" type="number" min="0" value={form.quantidadeAtualComprimidos} onChange={(event) => setForm({ ...form, quantidadeAtualComprimidos: event.target.value })} required />
            </Field>
            <Field label="Consumo diário (comprimidos)" htmlFor="stock-consumption" required>
              <input id="stock-consumption" className="input" type="number" min="0" value={form.consumoDiarioComprimidos} onChange={(event) => setForm({ ...form, consumoDiarioComprimidos: event.target.value })} required />
            </Field>
          </div>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving} icon={Check}>Salvar estoque</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
