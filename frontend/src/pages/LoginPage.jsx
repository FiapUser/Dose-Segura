import { useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../lib/format'
import { Button, ErrorNotice, Field } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const { navigate } = useRouter()
  const { notify } = useToast()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const patient = await login(form.email, form.senha)
      notify(`Bem-vindo, ${patient.nome?.split(' ')[0] || 'paciente'}!`, 'success')
      navigate('/painel')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-layout page-container">
      <div className="auth-composition" aria-hidden="true">
        <span className="auth-composition__square" />
        <span className="auth-composition__circle" />
        <div className="auth-composition__card">
          <LockKeyhole size={42} />
          <b>Seu cuidado,<br />no seu ritmo.</b>
        </div>
        <span className="auth-composition__line" />
      </div>

      <div className="auth-card">
        <span className="eyebrow">Bem-vindo de volta</span>
        <h1>Entre na sua rotina de cuidado.</h1>
        <p className="auth-card__lead">Use o e-mail e a senha cadastrados para acessar seus dados.</p>

        <ErrorNotice message={error} />
        <form onSubmit={handleSubmit} className="auth-form">
          <Field label="E-mail" htmlFor="login-email" required>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                className="input"
                id="login-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
          </Field>
          <Field label="Senha" htmlFor="login-password" required>
            <div className="input-with-icon input-with-icon--action">
              <LockKeyhole size={18} />
              <input
                className="input"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.senha}
                onChange={(event) => setForm({ ...form, senha: event.target.value })}
                placeholder="Sua senha"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Button type="submit" loading={loading} iconAfter={ArrowRight} size="lg">Entrar com segurança</Button>
        </form>

        <div className="auth-benefits">
          <span><Check size={16} /> Agenda organizada</span>
          <span><Check size={16} /> Estoque monitorado</span>
          <span><Check size={16} /> Dados protegidos</span>
        </div>

        <p className="auth-switch">Ainda não tem uma conta? <Link to="/cadastro">Criar cadastro <ArrowRight size={15} /></Link></p>
      </div>
    </section>
  )
}
