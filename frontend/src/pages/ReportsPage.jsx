import { useEffect, useState } from 'react'
import { BarChart3, CalendarRange, FilePlus2, History, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { reportApi } from '../services/api'
import { errorMessage, formatDate } from '../lib/format'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, SectionTitle, StatusBadge } from '../components/ui'

const initialForm = {
  periodoDeterminado: 'SEMANAL',
  dadosSaudeAtualizados: '',
  historicoComprasPeriodo: '',
}

export default function ReportsPage() {
  const { user, activePatientId } = useAuth()
  const { notify } = useToast()
  const [form, setForm] = useState(initialForm)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    reportApi
      .historico(user.id)
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [user?.id])

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const saveReport = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        paciente: { id: activePatientId },
        familiarCuidador: { id: user.id },
      }
      const created = await reportApi.configurar(payload)
      setReports((current) => [created, ...current.filter((item) => item.id !== created.id)])
      setForm(initialForm)
      setModalOpen(false)
      notify('Relatório configurado e adicionado ao histórico.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-shell page-container reports-page">
      <PageIntro
        eyebrow="Histórico familiar"
        title="Relatórios para ver o cuidado em contexto."
        description="Crie configurações de relatório e acompanhe o histórico retornado para a sua conta de responsável."
        action={<Button onClick={() => setModalOpen(true)} icon={FilePlus2}>Novo relatório</Button>}
      />
      <ErrorNotice message={error} onRetry={load} />

      <div className="report-summary">
        <div><BarChart3 size={27} /><span>Total de registros</span><strong>{reports.length}</strong></div>
        <div><History size={27} /><span>Mais recente</span><strong>{reports[0] ? formatDate(reports[0].dataGeracao || reports[0].dataCriacao, true) : '—'}</strong></div>
        <div><CalendarRange size={27} /><span>Responsável</span><strong>{user.nome?.split(' ')[0] || '—'}</strong></div>
      </div>

      <section className="report-history">
        <SectionTitle eyebrow="Linha do tempo" title="Histórico de relatórios" description="Os registros aparecem na ordem em que a API os retorna." />
        {loading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <EmptyState icon={History} title="Nenhum relatório ainda" description="Crie a primeira configuração para iniciar seu histórico." action={<Button onClick={() => setModalOpen(true)}>Criar relatório</Button>} />
        ) : (
          <div className="report-list">
            {reports.map((report, index) => (
              <article className="report-card" key={report.id || index}>
                <span className="report-card__number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <div className="report-card__meta">
                    <StatusBadge tone={index % 2 ? 'blue' : 'green'}>{report.periodoDeterminado || 'Relatório'}</StatusBadge>
                    <span>{formatDate(report.dataGeracao, true)}</span>
                  </div>
                  <h2>{report.paciente?.nome || 'Relatório de acompanhamento'}</h2>
                  <p>{report.dadosSaudeAtualizados || 'Sem dados de saúde informados.'}</p>
                </div>
                <div className="report-card__period">
                  <small>Período</small>
                  <b>{report.periodoDeterminado || 'Não informado'}</b>
                  <b>Cuidador: {report.familiarCuidador?.nome || '—'}</b>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Configurar novo relatório" eyebrow="Relatórios" size="lg">
        <form onSubmit={saveReport}>
          <div className="form-grid">
            <Field label="Período determinado" htmlFor="report-period" required>
              <select id="report-period" className="select" value={form.periodoDeterminado} onChange={(event) => setValue('periodoDeterminado', event.target.value)} required>
                <option value="DIÁRIO">Diário</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </Field>
            <div className="report-target field--full">
              <span>Paciente</span><b>{activePatientId === user.id ? user.nome : `Paciente selecionado #${activePatientId}`}</b>
            </div>
            <Field label="Dados de saúde atualizados" htmlFor="report-health" className="field--full">
              <textarea id="report-health" className="textarea" value={form.dadosSaudeAtualizados} onChange={(event) => setValue('dadosSaudeAtualizados', event.target.value)} placeholder="Resumo dos dados de saúde para o período" />
            </Field>
            <Field label="Histórico de compras do período" htmlFor="report-purchases" className="field--full">
              <textarea id="report-purchases" className="textarea" value={form.historicoComprasPeriodo} onChange={(event) => setValue('historicoComprasPeriodo', event.target.value)} placeholder="Resumo de compras, se disponível" />
            </Field>
          </div>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving} icon={Send}>Salvar relatório</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
