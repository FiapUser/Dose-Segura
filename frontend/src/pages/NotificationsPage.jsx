import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  CheckCheck,
  Clock3,
  Inbox,
  PackageX,
  Pill,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { notificationApi, vinculosApi } from '../services/api'
import { errorMessage, formatDate } from '../lib/format'
import { Button, EmptyState, ErrorNotice, LoadingState, PageIntro, StatusBadge } from '../components/ui'

const ACAO_VINCULO = 'VINCULO'

/** Ícone do alerta conforme o assunto (nada de emoji na interface). */
function iconeDoAlerta(alerta) {
  if (alerta.acaoTipo === ACAO_VINCULO) return Users
  if (alerta.acaoId) return Check
  if (String(alerta.titulo || '').includes('estoque') || String(alerta.titulo || '').toLowerCase().includes('acaba')) {
    return PackageX
  }
  if (String(alerta.titulo || '').toLowerCase().includes('medicamento')) return Pill
  if (String(alerta.titulo || '').toLowerCase().includes('compromisso')) return CalendarClock
  return Bell
}

/**
 * Área de notificações.
 *
 * <p>Os alertas são gravados, então há duas listas: as ativas (não lidas) e o
 * histórico. É daqui que a pessoa responde aos pedidos de vínculo de cuidado
 * ("Deseja vincular?").</p>
 */
export default function NotificationsPage() {
  const { user, refreshCurrentUser } = useAuth()
  const { notify } = useToast()
  const [view, setView] = useState('ativas')
  const [items, setItems] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.allSettled([notificationApi.minhas(), vinculosApi.recebidos()])
      .then(([alertasResult, pedidosResult]) => {
        if (alertasResult.status === 'fulfilled') setItems(Array.isArray(alertasResult.value) ? alertasResult.value : [])
        else setError(errorMessage(alertasResult.reason))
        if (pedidosResult.status === 'fulfilled') setSolicitacoes(Array.isArray(pedidosResult.value) ? pedidosResult.value : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [user?.id])

  const ativas = useMemo(() => items.filter((item) => !item.lida), [items])
  const historico = useMemo(() => items.filter((item) => item.lida), [items])
  const visiveis = view === 'ativas' ? ativas : historico
  const pendentes = solicitacoes.filter((item) => item.status === 'PENDENTE')
  const respondidos = solicitacoes.filter((item) => item.status !== 'PENDENTE')

  const marcarComoLida = async (alerta) => {
    setBusyId(alerta.id)
    try {
      await notificationApi.marcarComoLida(alerta.id)
      setItems((current) => current.map((item) => (item.id === alerta.id ? { ...item, lida: true } : item)))
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const responderVinculo = async (solicitacao, aceitar) => {
    setBusyId(solicitacao.id)
    try {
      if (aceitar) {
        await vinculosApi.aceitar(solicitacao.id)
        notify(`${solicitacao.solicitante?.nome} agora cuida dos seus dados de saúde.`, 'success')
        await refreshCurrentUser()
      } else {
        await vinculosApi.recusar(solicitacao.id)
        notify('Pedido recusado.', 'info')
      }
      load()
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
        description="Alertas da agenda, do estoque e os pedidos de vínculo que aguardam a sua resposta."
        action={(
          <div className="page-actions">
            <Button variant="ghost" onClick={load} icon={RefreshCw}>Atualizar</Button>
            <div className="segmented-control" role="tablist">
              <button type="button" role="tab" aria-selected={view === 'ativas'} className={view === 'ativas' ? 'active' : ''} onClick={() => setView('ativas')}>
                <Bell size={17} /> Ativas <b>{ativas.length}</b>
              </button>
              <button type="button" role="tab" aria-selected={view === 'historico'} className={view === 'historico' ? 'active' : ''} onClick={() => setView('historico')}>
                <Clock3 size={17} /> Histórico <b>{historico.length}</b>
              </button>
            </div>
          </div>
        )}
      />
      <ErrorNotice message={error} onRetry={load} />

      {pendentes.length > 0 && (
        <section className="vinculo-pendente">
          <div className="vinculo-pendente__head">
            <Users size={22} />
            <div>
              <span className="eyebrow">Confirmação necessária</span>
              <h2>Deseja vincular esta conta ao seu cuidado?</h2>
            </div>
          </div>
          {pendentes.map((solicitacao) => (
            <article className="vinculo-pendente__item" key={solicitacao.id}>
              <div className="vinculo-pendente__avatar">
                {(solicitacao.solicitante?.nome || '?').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3>{solicitacao.solicitante?.nome || 'Conta parceira'}</h3>
                <p>
                  {solicitacao.tipo === 'PRESTAR_CUIDADO'
                    ? 'quer cuidar da sua saúde.'
                    : 'quer ser seu responsável de cuidado.'}
                  {solicitacao.mensagem ? ` “${solicitacao.mensagem}”` : ''}
                </p>
                <small>Recebido em {formatDate(solicitacao.criadoEm, true)}</small>
              </div>
              <div className="vinculo-pendente__actions">
                <Button variant="green" size="sm" loading={busyId === solicitacao.id} onClick={() => responderVinculo(solicitacao, true)} icon={Check}>
                  Sim, vincular
                </Button>
                <Button variant="ghost" size="sm" loading={busyId === solicitacao.id} onClick={() => responderVinculo(solicitacao, false)} icon={X}>
                  Não quero
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {loading ? (
        <LoadingState label="Carregando notificações" />
      ) : visiveis.length === 0 ? (
        <EmptyState
          icon={view === 'ativas' ? Inbox : BellOff}
          title={view === 'ativas' ? 'Nenhuma notificação ativa' : 'Nenhum histórico'}
          description={
            view === 'ativas'
              ? 'Os lembretes de medicamento, consulta e estoque baixo aparecem aqui enquanto valerem.'
              : 'As notificações que você já marcou como lidas ficam guardadas aqui.'
          }
        />
      ) : (
        <div className="notification-list">
          {visiveis.map((notification, index) => {
            const Icone = iconeDoAlerta(notification)
            const lida = Boolean(notification.lida)
            return (
              <article className={lida ? 'notification-card notification-card--read' : 'notification-card'} key={notification.id || index}>
                <div className="notification-card__index">{String(index + 1).padStart(2, '0')}</div>
                <div className="notification-card__icon"><Icone size={24} /></div>
                <div className="notification-card__body">
                  <div className="notification-card__meta">
                    <StatusBadge tone={lida ? 'neutral' : 'red'}>{lida ? 'Lida' : 'Nova'}</StatusBadge>
                    <span>{formatDate(notification.dataDisparo, true)}</span>
                  </div>
                  <h2>{notification.titulo || 'Notificação'}</h2>
                  <p>{notification.mensagem || 'Sem detalhes informados.'}</p>
                </div>
                {notification.acaoTipo !== ACAO_VINCULO && !lida && (
                  <Button variant="ghost" size="sm" loading={busyId === notification.id} onClick={() => marcarComoLida(notification)} icon={CheckCheck}>
                    Marcar como lida
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {respondidos.length > 0 && (
        <section className="vinculo-historico">
          <h2>Pedidos de vínculo já respondidos</h2>
          <div className="dependent-list">
            {respondidos.map((solicitacao) => (
              <article key={solicitacao.id}>
                <span>{(solicitacao.solicitante?.nome || '?').slice(0, 1).toUpperCase()}</span>
                <div>
                  <b>{solicitacao.solicitante?.nome}</b>
                  <small>{formatDate(solicitacao.respondidoEm || solicitacao.criadoEm, true)}</small>
                </div>
                <StatusBadge tone={solicitacao.status === 'ACEITA' ? 'green' : 'neutral'}>
                  {solicitacao.status === 'ACEITA' ? 'Vinculado' : solicitacao.status === 'RECUSADA' ? 'Recusado' : 'Cancelado'}
                </StatusBadge>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
