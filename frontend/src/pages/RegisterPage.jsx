import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../lib/format'
import { Button, ErrorNotice, Field } from '../components/ui'

const initialForm = {
  nome: '',
  idade: '',
  email: '',
  senha: '',
  historicoMedico: '',
  alergias: '',
  medicamentosEmUso: '',
  contatosEmergencia: '',
  observacoesMedicas: '',
  cpf: '',
  cnpj: '',
}

const TIPOS_CONTA = [
  { id: 'pessoa-fisica', label: 'Pessoa física (CPF)', hint: 'Paciente, familiar ou cuidador particular.' },
  { id: 'pessoa-juridica', label: 'Instituição (CNPJ)', hint: 'Clínica, hospital, home care, farmácia, fornecedor ou operadora.' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const { navigate } = useRouter()
  const { notify } = useToast()
  const [form, setForm] = useState(initialForm)
  const [tipoConta, setTipoConta] = useState('pessoa-fisica')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pessoaFisica = tipoConta === 'pessoa-fisica'
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const trocarTipo = (id) => {
    setTipoConta(id)
    setForm((current) => ({ ...current, cpf: id === 'pessoa-fisica' ? current.cpf : '', cnpj: id === 'pessoa-juridica' ? current.cnpj : '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, idade: form.idade ? Number(form.idade) : null })
      notify('Cadastro criado. Agora você já pode entrar.', 'success')
      navigate('/entrar')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="register-layout page-container">
      <div className="register-aside">
        <span className="eyebrow eyebrow--light">Comece simples</span>
        <h1>Uma conta para organizar o que importa.</h1>
        <p>Cadastre-se para acessar medicamentos, agenda, dependentes e relatórios em um só lugar.</p>
        <ol>
          <li><span>1</span><div><b>Crie seu perfil</b><small>Os dados essenciais ficam seguros.</small></div></li>
          <li><span>2</span><div><b>Conecte sua rotina</b><small>Adicione estoque e compromissos.</small></div></li>
          <li><span>3</span><div><b>Acompanhe o progresso</b><small>Veja seu painel ganhar forma.</small></div></li>
        </ol>
      </div>

      <div className="auth-card auth-card--register">
        <Link to="/entrar" className="back-link"><ArrowLeft size={16} /> Voltar para o login</Link>
        <span className="eyebrow">Nova conta</span>
        <h2>Crie seu cadastro.</h2>
        <p className="auth-card__lead">Escolha o tipo de conta: cada perfil envia um tipo diferente de imagem para a rede.</p>

        <ErrorNotice message={error} />
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field--full">
            <span className="field__label">Tipo de conta</span>
            <div className="segmented-control" role="group" aria-label="Tipo de conta">
              {TIPOS_CONTA.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  className={tipoConta === tipo.id ? 'active' : ''}
                  aria-pressed={tipoConta === tipo.id}
                  onClick={() => trocarTipo(tipo.id)}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
            <span className="field__hint">{TIPOS_CONTA.find((tipo) => tipo.id === tipoConta)?.hint}</span>
          </div>

          <Field label={pessoaFisica ? 'Nome completo' : 'Razão social / nome da unidade'} htmlFor="register-name" className="field--full" required>
            <input className="input" id="register-name" value={form.nome} onChange={(event) => setValue('nome', event.target.value)} placeholder={pessoaFisica ? 'Como podemos chamar você?' : 'Ex.: Eurofarma Brasil'} required />
          </Field>
          {pessoaFisica && (
            <Field label="Idade" htmlFor="register-age">
              <input className="input" id="register-age" type="number" min="0" max="130" value={form.idade} onChange={(event) => setValue('idade', event.target.value)} placeholder="Opcional" />
            </Field>
          )}
          <Field label="E-mail" htmlFor="register-email" required>
            <input className="input" id="register-email" type="email" maxLength="254" value={form.email} onChange={(event) => setValue('email', event.target.value)} placeholder="voce@exemplo.com" required />
          </Field>
          {pessoaFisica ? (
            <Field label="CPF" htmlFor="register-cpf" hint="Identifica pacientes, familiares e cuidadores.">
              <input className="input" id="register-cpf" value={form.cpf} onChange={(event) => setValue('cpf', event.target.value)} placeholder="000.000.000-00" />
            </Field>
          ) : (
            <Field label="CNPJ" htmlFor="register-cnpj" hint="Identifica clínicas, farmácias, fornecedores e operadoras.">
              <input className="input" id="register-cnpj" value={form.cnpj} onChange={(event) => setValue('cnpj', event.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
          )}
          <Field label="Senha" htmlFor="register-password" className="field--full" required>
            <div className="input-with-icon input-with-icon--action">
              <input className="input" id="register-password" type={showPassword ? 'text' : 'password'} minLength="8" maxLength="72" value={form.senha} onChange={(event) => setValue('senha', event.target.value)} placeholder="Mínimo de 8 caracteres" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {pessoaFisica ? (
            <>
              <Field label="Histórico médico" htmlFor="register-history" className="field--full">
                <textarea id="register-history" className="textarea" value={form.historicoMedico} onChange={(event) => setValue('historicoMedico', event.target.value)} placeholder="Condições, tratamentos anteriores ou 'Nenhum histórico informado'" />
              </Field>
              <Field label="Alergias" htmlFor="register-allergies">
                <textarea id="register-allergies" className="textarea" value={form.alergias} onChange={(event) => setValue('alergias', event.target.value)} placeholder="Medicamentos, alimentos ou outras alergias" />
              </Field>
              <Field label="Medicamentos em uso" htmlFor="register-medications" className="field--full">
                <textarea id="register-medications" className="textarea" value={form.medicamentosEmUso} onChange={(event) => setValue('medicamentosEmUso', event.target.value)} placeholder="Informe os medicamentos atuais" />
              </Field>
              <Field label="Contatos de emergência" htmlFor="register-emergency" className="field--full">
                <textarea id="register-emergency" className="textarea" value={form.contatosEmergencia} onChange={(event) => setValue('contatosEmergencia', event.target.value)} placeholder="Nome e telefone" />
              </Field>
              <Field label="Observações médicas" htmlFor="register-notes" className="field--full">
                <textarea id="register-notes" className="textarea" value={form.observacoesMedicas} onChange={(event) => setValue('observacoesMedicas', event.target.value)} placeholder="Informações relevantes para o seu cuidado" />
              </Field>
            </>
          ) : (
            <Field label="Observações" htmlFor="register-notes" className="field--full" hint="Serviços prestados, região de atuação e contatos de emergência.">
              <textarea id="register-notes" className="textarea" value={form.observacoesMedicas} onChange={(event) => setValue('observacoesMedicas', event.target.value)} />
            </Field>
          )}

          <div className="register-consent field--full">
            <Check size={18} />
            <span>
              {pessoaFisica
                ? 'Ao criar a conta, você concorda com o uso responsável das informações de saúde e envia apenas a própria foto de perfil.'
                : 'Ao criar a conta de CNPJ, você poderá enviar o logo/foto da unidade e as imagens dos medicamentos do seu portfólio.'}
            </span>
          </div>
          <div className="form-actions field--full">
            <Button type="submit" loading={loading} iconAfter={ArrowRight}>Finalizar cadastro</Button>
          </div>
        </form>

        <p className="auth-switch">Já possui cadastro? <Link to="/entrar">Entrar <ArrowRight size={15} /></Link></p>
      </div>
    </section>
  )
}
