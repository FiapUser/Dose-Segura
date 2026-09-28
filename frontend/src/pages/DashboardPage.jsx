import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, Boxes, CalendarClock, CheckCircle2, RefreshCw, Stethoscope } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from '../context/RouterContext'
import { agendaApi, dashboardApi, notificationApi } from '../services/api'
import { errorMessage, formatDate, formatTime } from '../lib/format'
import { Button, EmptyState, ErrorNotice, LinkButton, LoadingState, PageIntro } from '../components/ui'

function adherenceValue(data) {
  const raw = data?.taxaAdesaoPorcentagem ?? data?.adesao ?? data?.taxaAdesao
  if (raw === undefined || raw === null) return null
  if (typeof raw === 'number' && raw > 0 && raw <= 1) return `${Math.round(raw * 100)}%`
  return typeof raw === 'number' ? `${raw}%` : String(raw)
}

export default function DashboardPage() {
  const { user, activePatientId } = useAuth()
  const [data, setData] = useState(null)
  const [stock, setStock] = useState([])
  const [agenda, setAgenda] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      dashboardApi.obterPainel(activePatientId),
      dashboardApi.listarEstoque(activePatientId),
      agendaApi.listarPendentes(activePatientId),
      notificationApi.ativas(activePatientId),
    ]).then(([panelResult, stockResult, agendaResult, notificationResult]) => {
      const failed = [panelResult, stockResult, agendaResult, notificationResult].find((result) => result.status === 'rejected')
      if (failed) setError(errorMessage(failed.reason))
      if (panelResult.status === 'fulfilled') setData(panelResult.value)
      if (stockResult.status === 'fulfilled' && Array.isArray(stockResult.value)) setStock(stockResult.value)
      if (agendaResult.status === 'fulfilled' && Array.isArray(agendaResult.value)) setAgenda(agendaResult.value)
      if (notificationResult.status === 'fulfilled' && Array.isArray(notificationResult.value)) setNotifications(notificationResult.value)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [activePatientId])

  const metrics = useMemo(() => {
    const adherence = adherenceValue(data)
    return [
      { label: 'Adesão ao tratamento', value: adherence || '—', detail: adherence ? 'Conforme dados da API' : 'Aguardando dados', icon: Activity, color: 'lime' },
      { label: 'Itens no estoque', value: stock.length, detail: 'Registrados para você', icon: Boxes, color: 'yellow' },
      { label: 'Agenda pendente', value: agenda.length, detail: 'Compromissos a concluir', icon: CalendarClock, color: 'blue' },
      { label: 'Alertas ativos', value: notifications.length, detail: 'Precisam de atenção', icon: AlertTriangle, color: 'red' },
    ]
  }, [data, stock.length, agenda.length, notifications.length])

  return (
    <div className="page-shell page-container dashboard-page">
      <PageIntro
        eyebrow={`Olá, ${user?.nome?.split(' ')[0] || 'paciente'}`}
        title="Seu cuidado, em perspectiva."
        description="Os principais sinais da rotina aparecem aqui sem perder o contexto."
        action={<Button variant="light" onClick={load} icon={RefreshCw}>Atualizar dados</Button>}
      />
      <ErrorNotice message={error} onRetry={load} />

      {loading ? <LoadingState label="Montando seu painel" /> : (
        <>
          <section className="dashboard-metrics">
            {metrics.map(({ label, value, detail, icon: Icon, color }, index) => (
              <article className={`metric-card metric-card--${color}`} key={label}>
                <span className="metric-card__index">0{index + 1}</span>
                <Icon size={29} />
                <strong>{value}</strong>
                <h2>{label}</h2>
                <p>{detail}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel dashboard-panel--schedule">
              <header>
                <div><span className="eyebrow">Próximos cuidados</span><h2>Agenda em movimento</h2></div>
                <Link to="/agenda" className="text-link">Ver agenda <ArrowRight size={16} /></Link>
              </header>
              {agenda.length ? (
                <div className="schedule-list">
                  {agenda.slice(0, 4).map((item, index) => (
                    <div className="schedule-item" key={item.id || index}>
                      <div><span>{formatDate(item.horarioInicio).split('/').slice(0, 2).join('/')}</span><b>{formatTime(item.horarioInicio)}</b></div>
                      <i />
                      <div><h3>{item.titulo || 'Medicamento'}</h3><p>{item.dosagem || item.observacoes || 'Compromisso de tratamento'}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckCircle2} title="Agenda em dia" description="Nenhum compromisso pendente no momento." />
              )}
              <LinkButton to="/agenda" variant="blue">Organizar agenda</LinkButton>
            </article>

            <article className="dashboard-panel dashboard-panel--stock">
              <header>
                <div><span className="eyebrow">Visão rápida</span><h2>Estoque atual</h2></div>
                <Link to="/estoque" className="text-link">Abrir estoque <ArrowRight size={16} /></Link>
              </header>
              <div className="stock-stack">
                {stock.slice(0, 3).map((entry, index) => {
                  const medicine = entry.medicamento || entry.produto || entry
                  return (
                    <div className="stock-stack__item" key={entry.id || index}>
                      <span>{String(entry.quantidadeAtualComprimidos ?? 0).padStart(2, '0')}</span>
                      <div><b>{entry.nomeMedicamento || medicine.nome || 'Medicamento'}</b><small>{entry.diasRestantes != null ? `${entry.diasRestantes} dias restantes` : 'Consumo diário não informado'}</small></div>
                      <Stethoscope size={20} />
                    </div>
                  )
                })}
                {!stock.length && <div className="stock-stack__empty"><Boxes size={28} /><b>Estoque vazio</b><span>Registre seu primeiro medicamento.</span></div>}
              </div>
              <LinkButton to="/estoque" variant="lime">Registrar estoque</LinkButton>
            </article>

            <article className="dashboard-panel dashboard-panel--alerts">
              <header>
                <div><span className="eyebrow">Atenção</span><h2>Alertas recentes</h2></div>
                <Link to="/notificacoes" className="text-link">Ver todos <ArrowRight size={16} /></Link>
              </header>
              {notifications.length ? (
                <div className="alert-preview">
                  {notifications.slice(0, 3).map((notification, index) => (
                    <div key={notification.id || index}><span><AlertTriangle size={18} /></span><div><b>{notification.titulo || notification.tipo || 'Alerta'}</b><p>{notification.mensagem || 'Consulte o detalhe da notificação.'}</p></div></div>
                  ))}
                </div>
              ) : (
                <div className="all-clear"><CheckCircle2 size={38} /><b>Tudo tranquilo</b><span>Não há alertas ativos.</span></div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  )
}
