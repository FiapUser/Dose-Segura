import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Clock3, Inbox } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { notificationApi } from '../services/api'
import { errorMessage, formatDate } from '../lib/format'
import { Button, EmptyState, ErrorNotice, LoadingState, PageIntro, StatusBadge } from '../components/ui'

export default function NotificationsPage() {
  const { activePatientId } = useAuth()
  const { notify } = useToast()
  const [view, setView] = useState('ativas')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    const request = view === 'ativas'
      ? notificationApi.ativas(activePatientId)
      : notificationApi.historico(activePatientId)
    request
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [activePatientId, view])

  const markAsRead = async (notification) => {
    setBusyId(notification.id)
    try {
      const updated = await notificationApi.marcarComoLida(notification.id)
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
      notify('Notificação marcada como lida.', 'success')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-shell page-container notifications-page">
      <PageIntro
        eyebrow="Sinais de cuidado"
        title="Notificações em primeiro plano."
        description="Alertas ativos e histórico de mensagens do paciente selecionado."
        action={
          <div className="segmented-control" role="tablist">
            <button type="button" className={view === 'ativas' ? 'active' : ''} onClick={() => setView('ativas')}><Bell size={17} /> Ativas</button>
            <button type="button" className={view === 'historico' ? 'active' : ''} onClick={() => setView('historico')}><Clock3 size={17} /> Histórico</button>
          </div>
        }
      />
      <ErrorNotice message={error} onRetry={load} />

      {loading ? (
        <LoadingState label="Carregando notificações" />
      ) : items.length === 0 ? (
        <EmptyState icon={Inbox} title={view === 'ativas' ? 'Nenhum alerta ativo' : 'Histórico vazio'} description="Não há notificações para exibir neste momento." />
      ) : (
        <div className="notification-list">
          {items.map((notification, index) => {
            const read = Boolean(notification.lida ?? notification.lido)
            return (
              <article className={read ? 'notification-card notification-card--read' : 'notification-card'} key={notification.id || index}>
                <div className="notification-card__index">{String(index + 1).padStart(2, '0')}</div>
                <div className="notification-card__icon">{read ? <CheckCheck size={25} /> : <Bell size={25} />}</div>
                <div className="notification-card__body">
                  <div className="notification-card__meta">
                    <StatusBadge tone={read ? 'neutral' : 'red'}>{read ? 'Lida' : 'Nova'}</StatusBadge>
                    <span>{formatDate(notification.dataDisparo, true)}</span>
                  </div>
                  <h2>{notification.titulo || notification.tipo || 'Notificação'}</h2>
                  <p>{notification.mensagem || notification.descricao || 'Sem detalhes informados pela API.'}</p>
                </div>
                {!read && (
                  <Button variant="blue" size="sm" loading={busyId === notification.id} onClick={() => markAsRead(notification)} icon={Check}>Marcar como lida</Button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
