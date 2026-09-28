import { useEffect, useState } from 'react'
import { Link2, LogOut, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Unlink, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { authApi } from '../services/api'
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
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [dependentCredentials, setDependentCredentials] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    Promise.allSettled([authApi.obter(user.id), authApi.listarDependentes(user.id)])
      .then(([profileResult, dependentResult]) => {
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value)
          setProfileForm(profileToForm(profileResult.value))
        } else setError(errorMessage(profileResult.reason))
        if (dependentResult.status === 'fulfilled' && Array.isArray(dependentResult.value)) setDependents(dependentResult.value)
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

  const searchCaregiver = async (event) => {
    event.preventDefault()
    setBusy('search')
    setError('')
    setSearchResult(null)
    try {
      const result = await authApi.buscarPorEmail(searchEmail)
      setSearchResult(result)
      notify('Paciente localizado com segurança.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  const linkCaregiver = async () => {
    if (!searchResult?.id) return
    if (String(searchResult.id) === String(user.id)) {
      notify('Você não pode ser o seu próprio cuidador.', 'error')
      return
    }
    setBusy('link')
    try {
      const linked = await authApi.vincularCuidador(user.id, searchResult.id)
      setProfile(linked)
      setProfileForm(profileToForm(linked))
      setSearchResult(null)
      setSearchEmail('')
      notify('Cuidador vinculado ao seu perfil.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy('')
    }
  }

  const addDependent = async (event) => {
    event.preventDefault()
    setBusy('dependent')
    setError('')
    try {
      const dependent = await authApi.adicionarDependente(dependentCredentials)
      setDependents((current) => [dependent, ...current.filter((item) => item.id !== dependent.id)])
      setDependentCredentials({ email: '', senha: '' })
      notify('Dependente adicionado à sua rede.', 'success')
    } catch (requestError) {
      setError(errorMessage(requestError))
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
          <SectionTitle eyebrow="Rede de apoio" title="Pacientes vinculados" description="Selecione um dependente na barra superior para acessar seus dados." />
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
            <EmptyState icon={Users} title="Nenhum dependente" description="Use uma das formas ao lado para iniciar uma rede de cuidado." />
          )}
        </section>
      </div>

      <section className="network-actions">
        <article className="network-action network-action--search">
          <span className="network-action__index">A</span>
          <Search size={30} />
          <h2>Escolher meu cuidador</h2>
          <p>Busque pelo e-mail exato da pessoa que será vinculada ao seu perfil. A API mascara o e-mail na resposta.</p>
          <form onSubmit={searchCaregiver}>
            <div className="search-box">
              <input type="email" value={searchEmail} onChange={(event) => setSearchEmail(event.target.value)} placeholder="cuidador@exemplo.com" aria-label="E-mail do cuidador" required />
              <Button type="submit" loading={busy === 'search'}>Buscar</Button>
            </div>
          </form>
          {searchResult && (
            <div className="search-result">
              <div><b>{searchResult.nome}</b><span>{searchResult.emailMascarado}</span></div>
              <Button loading={busy === 'link'} onClick={linkCaregiver} icon={Link2}>Vincular ao meu perfil</Button>
              <button type="button" onClick={() => setSearchResult(null)} aria-label="Fechar resultado"><X size={17} /></button>
            </div>
          )}
        </article>

        <article className="network-action network-action--credentials">
          <span className="network-action__index">B</span>
          <ShieldCheck size={30} />
          <h2>Adicionar dependente</h2>
          <p>O paciente confirma a própria conta. Nenhuma senha é armazenada neste navegador.</p>
          <form className="form-grid" onSubmit={addDependent}>
            <Field label="E-mail do dependente" htmlFor="dependent-email" className="field--full" required>
              <input id="dependent-email" className="input" type="email" value={dependentCredentials.email} onChange={(event) => setDependentCredentials({ ...dependentCredentials, email: event.target.value })} required />
            </Field>
            <Field label="Senha" htmlFor="dependent-password" className="field--full" required>
              <input id="dependent-password" className="input" type="password" value={dependentCredentials.senha} onChange={(event) => setDependentCredentials({ ...dependentCredentials, senha: event.target.value })} required />
            </Field>
            <div className="form-actions field--full"><Button type="submit" loading={busy === 'dependent'} icon={Plus}>Adicionar à rede</Button></div>
          </form>
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
