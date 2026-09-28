import { useEffect, useState } from 'react'
import { Clock3, LogOut, RefreshCw, Save, Send, Trash2, Unlink, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { authApi, vinculosApi } from '../services/api'
import { errorMessage } from '../lib/format'
import { urlPerfil } from '../lib/images'
import SmartImage from '../components/SmartImage'
import ImageUploadField from '../components/ImageUploadField'
import { Button, EmptyState, ErrorNotice, Field, LoadingState, Modal, PageIntro, SectionTitle, StatusBadge } from '../components/ui'

function profileToForm(patient) {
  return {
    nome: patient?.nome || '',
    idade: patient?.idade ?? '',
    email: patient?.email || '',
    cpf: patient?.cpf || '',
    cnpj: patient?.cnpj || '',
    senha: '',
    historicoMedico: patient?.historicoMedico || '',
    alergias: patient?.alergias || '',
    medicamentosEmUso: patient?.medicamentosEmUso || '',
    contatosEmergencia: patient?.contatosEmergencia || '',
    observacoesMedicas: patient?.observacoesMedicas || '',
  }
}

export default function CareNetworkPage() {
  const { user, updateCurrentUser, logout } = useAuth()
  const { navigate } = useRouter()
  const { notify } = useToast()
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState(() => profileToForm(user))
  const [dependents, setDependents] = useState([])
  const [linkForm, setLinkForm] = useState({ email: '', tipo: 'PRESTAR_CUIDADO', mensagem: '' })
  const [enviados, setEnviados] = useState([])
  const [recebidos, setRecebidos] = useState([])
  const [linkError, setLinkError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    Promise.allSettled([
      authApi.obter(user.id),
      authApi.listarDependentes(user.id),
      vinculosApi.enviados(),
      vinculosApi.recebidos(),
    ])
      .then(([profileResult, dependentResult, enviadosResult, recebidosResult]) => {
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value)
          setProfileForm(profileToForm(profileResult.value))
        } else setError(errorMessage(profileResult.reason))
        if (dependentResult.status === 'fulfilled') setDependents(Array.isArray(dependentResult.value) ? dependentResult.value : [])
        if (enviadosResult.status === 'fulfilled') setEnviados(Array.isArray(enviadosResult.value) ? enviadosResult.value : [])
        if (recebidosResult.status === 'fulfilled') setRecebidos(Array.isArray(recebidosResult.value) ? recebidosResult.value : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [user?.id])

  const updateProfile = async (event) => {
    event.preventDefault()
    setBusy('profile')
    setError('')
    try {
      const { senha, ...values } = profileForm
      const payload = {
        ...values,
        idade: values.idade === '' ? null : Number(values.idade),
      }
      if (senha) payload.senha = senha
      const updated = await updateCurrentUser(payload)
      setProfile(updated)
      setProfileForm(profileToForm(updated))
      notify('Perfil atualizado.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  /** Envia o pedido de vinculo. Quem aceita e a outra conta, na area de notificacoes. */
  const solicitarVinculo = async (event) => {
    event.preventDefault()
    setBusy('link')
    setLinkError('')
    try {
      const solicitacao = await vinculosApi.solicitar({
        email: linkForm.email,
        tipo: linkForm.tipo,
        mensagem: linkForm.mensagem,
      })
      setEnviados((current) => [solicitacao, ...current])
      setLinkForm({ email: '', tipo: 'PRESTAR_CUIDADO', mensagem: '' })
      notify('Pedido enviado. A outra pessoa responde na área de notificações.', 'success')
    } catch (requestError) {
      setLinkError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  const cancelarVinculo = async (solicitacao) => {
    setBusy(`cancel-${solicitacao.id}`)
    try {
      await vinculosApi.cancelar(solicitacao.id)
      setEnviados((current) => current.map((item) => (item.id === solicitacao.id ? { ...item, status: 'CANCELADA' } : item)))
      notify('Pedido cancelado.', 'info')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusy('')
    }
  }

  const unlinkDependent = async (dependent) => {
    setBusy(`unlink-${dependent.id}`)
    try {
      await authApi.desvincularCuidador(dependent.id)
      setDependents((current) => current.filter((item) => item.id !== dependent.id))
      notify('Vínculo de cuidado removido.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  const unlinkOwnCaregiver = async () => {
    setBusy('unlink-self')
    try {
      const updated = await authApi.desvincularCuidador(user.id)
      setProfile(updated)
      setProfileForm(profileToForm(updated))
      notify('Seu vínculo de cuidado foi removido.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  const recebidosPendentes = recebidos.filter((item) => item.status === 'PENDENTE').length

  const deleteAccount = async () => {
    setBusy('delete')
    try {
      await authApi.excluir(user.id)
      logout()
      notify('Conta removida.', 'success')
      navigate('/')
    } catch (requestError) {
      setError(errorMessage(requestError))
      setBusy('')
    }
  }

  return (
    <div className="page-shell page-container care-page">
      <PageIntro
        eyebrow="Identidade e cuidado compartilhado"
        title="Meu perfil. Minha rede."
        description="Atualize seus dados, encontre pacientes e organize os vínculos de cuidado."
        action={<Button variant="light" onClick={load} icon={RefreshCw}>Atualizar</Button>}
      />
      <ErrorNotice message={error} />

      {recebidosPendentes > 0 && (
        <div className="notice notice--permission notice--permission--ok">
          <Users size={19} />
          <span>
            Você tem {recebidosPendentes} {recebidosPendentes === 1 ? 'pedido de vínculo' : 'pedidos de vínculo'} aguardando resposta.
            {' '}
            <Link to="/notificacoes" className="text-link">Abrir a área de notificações</Link>
          </span>
        </div>
      )}

      <div className="care-grid">
        <section className="care-profile">
          <div className="care-profile__shape" aria-hidden="true" />
          <div className="care-profile__identity">
            <SmartImage
              src={urlPerfil(profile || user, { w: 200, h: 200 })}
              tipo="perfil"
              rotulo={profile?.nome || user?.nome}
              alt={profile?.nome || user?.nome || 'Perfil'}
            />
            <div>
              <span className="eyebrow">Meus dados</span>
              <h2>{profile?.nome || user.nome}</h2>
              <div className="care-profile__badges">
                <StatusBadge tone="blue">{user?.masterAdmin ? 'Master admin' : 'Paciente autenticado'}</StatusBadge>
                {user?.cnpj && <StatusBadge tone="green">Conta CNPJ</StatusBadge>}
                {user?.cpf && <StatusBadge tone="green">Conta CPF</StatusBadge>}
              </div>
            </div>
          </div>
          <ImageUploadField
            tipo="PERFIL"
            id={user?.id}
            nome={profile?.nome || user?.nome}
            valor={profile?.fotoPerfil || user?.fotoPerfil}
            rotulo="Foto de perfil"
            permitidos={user?.tiposImagemPermitidos || ['PERFIL']}
            dica="Pacientes e cuidadores enviam apenas a própria foto. O restante é gerenciado por fornecedores, farmácias e pelo master admin."
            onUploaded={() => load()}
            onRemoved={() => load()}
          />
          {profile?.cuidador && (
            <div className="current-caregiver">
              <div><span>Cuidador atual</span><b>{profile.cuidador.nome || 'Responsável vinculado'}</b></div>
              <Button size="sm" variant="ghost" loading={busy === 'unlink-self'} onClick={unlinkOwnCaregiver} icon={Unlink}>Desvincular</Button>
            </div>
          )}
          {loading ? <LoadingState /> : (
            <form className="form-grid" onSubmit={updateProfile}>
              <Field label="Nome" htmlFor="profile-name" className="field--full" required>
                <input id="profile-name" className="input" value={profileForm.nome} onChange={(event) => setProfileForm({ ...profileForm, nome: event.target.value })} required />
              </Field>
              <Field label="Idade" htmlFor="profile-age">
                <input id="profile-age" className="input" type="number" min="0" max="130" value={profileForm.idade} onChange={(event) => setProfileForm({ ...profileForm, idade: event.target.value })} />
              </Field>
              <Field label="E-mail" htmlFor="profile-email" required>
                <input id="profile-email" className="input" type="email" maxLength="254" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required />
              </Field>
              <Field label="CPF" htmlFor="profile-cpf">
                <input id="profile-cpf" className="input" value={profileForm.cpf} onChange={(event) => setProfileForm({ ...profileForm, cpf: event.target.value })} />
              </Field>
              <Field label="CNPJ" htmlFor="profile-cnpj">
                <input id="profile-cnpj" className="input" value={profileForm.cnpj} onChange={(event) => setProfileForm({ ...profileForm, cnpj: event.target.value })} />
              </Field>
              <Field label="Nova senha" htmlFor="profile-password" className="field--full" hint="Deixe em branco para manter a senha atual.">
                <input id="profile-password" className="input" type="password" minLength="8" maxLength="72" value={profileForm.senha} onChange={(event) => setProfileForm({ ...profileForm, senha: event.target.value })} />
              </Field>
              <details className="profile-health-details field--full" open>
                <summary>Informações médicas e de emergência</summary>
                <div className="form-grid">
                  <Field label="Histórico médico" htmlFor="profile-history" className="field--full" required>
                    <textarea id="profile-history" className="textarea" value={profileForm.historicoMedico} onChange={(event) => setProfileForm({ ...profileForm, historicoMedico: event.target.value })} required />
                  </Field>
                  <Field label="Alergias" htmlFor="profile-allergies">
                    <textarea id="profile-allergies" className="textarea" value={profileForm.alergias} onChange={(event) => setProfileForm({ ...profileForm, alergias: event.target.value })} />
                  </Field>
                  <Field label="Contatos de emergência" htmlFor="profile-emergency">
                    <textarea id="profile-emergency" className="textarea" value={profileForm.contatosEmergencia} onChange={(event) => setProfileForm({ ...profileForm, contatosEmergencia: event.target.value })} />
                  </Field>
                  <Field label="Medicamentos em uso" htmlFor="profile-medications" className="field--full" required>
                    <textarea id="profile-medications" className="textarea" value={profileForm.medicamentosEmUso} onChange={(event) => setProfileForm({ ...profileForm, medicamentosEmUso: event.target.value })} required />
                  </Field>
                  <Field label="Observações médicas" htmlFor="profile-notes" className="field--full" required>
                    <textarea id="profile-notes" className="textarea" value={profileForm.observacoesMedicas} onChange={(event) => setProfileForm({ ...profileForm, observacoesMedicas: event.target.value })} required />
                  </Field>
                </div>
              </details>
              <div className="form-actions field--full">
                <Button type="button" variant="ghost" onClick={() => setDeleteOpen(true)} icon={Trash2}>Excluir conta</Button>
                <Button type="submit" loading={busy === 'profile'} icon={Save}>Salvar alterações</Button>
              </div>
            </form>
          )}
        </section>

        <section className="care-dependents">
          <SectionTitle eyebrow="Rede de apoio" title="Pacientes vinculados" description="Selecione um dependente na barra superior para acessar os dados. Vínculos só existem após o aceite do pedido." />
          {loading ? <LoadingState /> : dependents.length ? (
            <div className="dependent-list">
              {dependents.map((dependent, index) => (
                <article key={dependent.id || index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div><b>{dependent.nome}</b><small>{dependent.email || dependent.emailMascarado || 'E-mail não informado'}</small></div>
                  <StatusBadge tone="green">Vinculado</StatusBadge>
                  <Button size="sm" variant="ghost" loading={busy === `unlink-${dependent.id}`} onClick={() => unlinkDependent(dependent)} icon={Unlink}>Desvincular</Button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Nenhum dependente vinculado" description="Envie um pedido de vínculo: a pessoa confirma na área de notificações antes de você ter acesso aos dados dela." />
          )}
        </section>
      </div>

      <section className="network-actions">
        <article className="network-action network-action--search">
          <span className="network-action__index">A</span>
          <UserPlus size={30} />
          <h2>Solicitar vínculo de cuidado</h2>
          <p>
            Informe o e-mail da conta e o tipo de pedido. Não é preciso senha: quem vai ser
            cuidado é quem aceita, na área de notificações.
          </p>
          <form className="form-grid" onSubmit={solicitarVinculo} noValidate>
            <Field label="E-mail da conta" htmlFor="link-email" className="field--full" required>
              <input
                id="link-email"
                className="input"
                type="email"
                value={linkForm.email}
                onChange={(event) => setLinkForm({ ...linkForm, email: event.target.value })}
                placeholder="cuidador@exemplo.com"
              />
            </Field>
            <Field
              label="Quem cuida de quem?"
              htmlFor="link-type"
              className="field--full"
              hint="O pedido é enviado para a outra conta, que aceita ou recusa na área de notificações."
            >
              <select
                id="link-type"
                className="select"
                value={linkForm.tipo}
                onChange={(event) => setLinkForm({ ...linkForm, tipo: event.target.value })}
              >
                <option value="PRESTAR_CUIDADO">Eu cuido de alguém (eu sou o cuidador)</option>
                <option value="RECEBER_CUIDADO">Quero que alguém cuide de mim (eu sou o paciente)</option>
              </select>
            </Field>
            <Field label="Mensagem" htmlFor="link-message" className="field--full" hint="Opcional: aparece junto do pedido.">
              <input
                id="link-message"
                className="input"
                value={linkForm.mensagem}
                onChange={(event) => setLinkForm({ ...linkForm, mensagem: event.target.value })}
                placeholder="Ex.: sou seu filho, cuidarei das doses."
              />
            </Field>
            {linkError && <p className="field__error field--full">{linkError}</p>}
            <div className="form-actions field--full">
              <Button type="submit" loading={busy === 'link'} icon={Send}>Enviar pedido</Button>
            </div>
          </form>
        </article>

        <article className="network-action network-action--credentials">
          <span className="network-action__index">B</span>
          <Clock3 size={30} />
          <h2>Pedidos enviados</h2>
          <p>Acompanhe o que você solicitou. O vínculo só existe depois do aceite de quem vai ser cuidado.</p>
          {enviados.length ? (
            <div className="dependent-list">
              {enviados.map((solicitacao) => (
                <article key={solicitacao.id}>
                  <span><Send size={16} /></span>
                  <div>
                    <b>{solicitacao.destinatario?.email || 'Conta solicitada'}</b>
                    <small>{solicitacao.tipoRotulo || solicitacao.tipo}</small>
                  </div>
                  {solicitacao.status === 'PENDENTE' ? (
                    <Button size="sm" variant="ghost" loading={busy === `cancel-${solicitacao.id}`} onClick={() => cancelarVinculo(solicitacao)} icon={Unlink}>Cancelar</Button>
                  ) : (
                    <StatusBadge tone={solicitacao.status === 'ACEITA' ? 'green' : 'neutral'}>
                      {solicitacao.status === 'ACEITA' ? 'Vinculado' : solicitacao.status === 'RECUSADA' ? 'Recusado' : 'Cancelado'}
                    </StatusBadge>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Send} title="Nenhum pedido enviado" description="Use o formulário ao lado para solicitar um vínculo." />
          )}
        </article>
      </section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir sua conta?" eyebrow="Ação permanente" size="sm">
        <p className="modal-copy">Esta operação remove o perfil e exige confirmação. KPIs e vínculos relacionados podem mudar.</p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button loading={busy === 'delete'} onClick={deleteAccount} icon={LogOut}>Excluir definitivamente</Button>
        </div>
      </Modal>
    </div>
  )
}
