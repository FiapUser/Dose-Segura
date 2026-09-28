import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Inbox, RefreshCw, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { notificationApi, vinculosApi } from '../services/api'
import { errorMessage, formatDate } from '../lib/format'
import { Button, EmptyState, ErrorNotice, LoadingState, PageIntro, StatusBadge } from '../components/ui'

const ACAO_VINCULO = 'VINCULO'

/**
 * Área de notificações.
 *
 * <p>Os alertas ficam apenas em memória: não há histórico salvo. É daqui que a
 * pessoa responde aos pedidos de vínculo de cuidado ("deseja vincular?").</p>
 */
export default function NotificationsPage() {
  const { user, refreshCurrentUser } = useAuth()
  const { notify } = useToast()
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

  const alternarLeitura = async (alerta) => {
    setBusyId(alerta.id)
    try {
      const updated = await notificationApi.alternarLeitura(alerta.id)
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
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

  const pendentes = solicitacoes.filter((item) => item.status === 'PENDENTE')
  const respondidos = solicitacoes.filter((item) => item.status !== 'PENDENTE')

  return (
    <div className="page-shell page-container notifications-page">
      <PageIntro
        eyebrow="Sinais de cuidado"
        title="Notificações em primeiro plano."
        description="Alertas da agenda, do estoque e os pedidos de vínculo que aguardam a sua resposta."
        action={<Button variant="ghost" onClick={load} icon={RefreshCw}>Atualizar</Button>}
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
                  {solicitacao.tipo === 'RESPONSAVEL'
                    ? 'quer ser seu responsável de cuidado.'
                    : 'quer cuidar da sua saúde.'}
                  {solicitacao.mensagem ? ` “${solicitacao.mensagem}”` : ''}
                </p>
                <small>Recebido em {formatDate(solicitacao.criadoEm, true)}</small>
              </div>
              <div className="vinculo-pendente__actions">
                <Button
                  variant="green"
                  size="sm"
                  loading={busyId === solicitacao.id}
                  onClick={() => responderVinculo(solicitacao, true)}
                  icon={Check}
                >
                  Sim, vincular
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busyId === solicitacao.id}
                  onClick={() => responderVinculo(solicitacao, false)}
                  icon={X}
                >
                  Não quero
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {loading ? (
        <LoadingState label="Carregando notificações" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhum alerta ativo"
          description="Os lembretes de medicamento, consulta e estoque baixo aparecem aqui enquanto valerem."
        />
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
                  <h2>{notification.titulo || 'Alerta'}</h2>
                  <p>{notification.mensagem || 'Sem detalhes informados.'}</p>
                </div>
                {notification.acaoTipo !== ACAO_VINCULO && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={busyId === notification.id}
                    onClick={() => alternarLeitura(notification)}
                    icon={read ? Bell : Check}
                  >
                    {read ? 'Marcar como nova' : 'Marcar como lida'}
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {respondidos.length > 0 && (
        <section className="vinculo-historico">
          <h2>Pedidos já respondidos</h2>
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

      <p className="notifications-footnote">
        Os alertas ficam apenas em memória e expiram em 24 horas: não há histórico salvo no servidor.
      </p>
    </div>
  )
}
