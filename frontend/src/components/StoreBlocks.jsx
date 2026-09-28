import { ArrowRight, HeartPulse, Percent, Pill, ShieldCheck, Stethoscope, Store, Truck, Wallet } from 'lucide-react'
import { Link } from '../context/RouterContext'

const SELOS = [
  { icon: Truck, title: 'Entrega em domicílio', text: 'Farmácias parceiras entregam no endereço do paciente' },
  { icon: ShieldCheck, title: 'Origem verificada', text: 'Todo item da rede tem fornecedor e lote rastreados' },
  { icon: Wallet, title: 'Pagamento facilitado', text: 'Parcelamento em até 10x sem juros' },
  { icon: Stethoscope, title: 'Acompanhamento clínico', text: 'Agenda, doses e adesão monitoradas' },
]

export function TrustBar() {
  return (
    <div className="trust-bar" aria-label="Diferenciais da Dose Segura">
      {SELOS.map(({ icon: Icon, title, text }) => (
        <div className="trust-bar__item" key={title}>
          <span className="trust-bar__icon"><Icon size={19} /></span>
          <div>
            <b>{title}</b>
            <small>{text}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', icon: HeartPulse },
  { id: 'Cardiovascular', label: 'Coração', icon: HeartPulse },
  { id: 'Metabólico', label: 'Diabetes', icon: Percent },
  { id: 'Digestivo', label: 'Digestivo', icon: Pill },
  { id: 'Endócrino', label: 'Hormônios', icon: Stethoscope },
  { id: 'Dor e febre', label: 'Dor e febre', icon: Pill },
  { id: 'Suplementos', label: 'Vitaminas', icon: Percent },
]

/** Trilho de categorias da loja, no estilo e-commerce. */
export function CategoryRail({ categorias, ativo, onChange, comTodas = true }) {
  const lista = comTodas ? CATEGORIAS : categorias
  return (
    <nav className="category-rail" aria-label="Categorias de medicamentos">
      {lista.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={ativo === id ? 'category-chip category-chip--active' : 'category-chip'}
          onClick={() => onChange?.(id)}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Banner promotional da vitrine. */
export function PromoBanner({ onCta, cta = 'Ver ofertas' }) {
  return (
    <section className="promo-banner">
      <div className="promo-banner__copy">
        <span className="promo-banner__tag"><Percent size={14} /> Oferta da rede</span>
        <h2>Até 30% off em medicamentos de uso contínuo</h2>
        <p>Compare preços entre farmácias parceiras, acompanhe o prazo de entrega e receba em casa.</p>
        <button type="button" className="store-button store-button--light" onClick={onCta}>
          {cta} <ArrowRight size={17} />
        </button>
      </div>
      <div className="promo-banner__art" aria-hidden="true">
        <span className="promo-banner__pill"><Pill size={54} /></span>
        <span className="promo-banner__cross"><Store size={54} /></span>
      </div>
    </section>
  )
}

/** Faixa de chamada para o app de cuidador / rede. */
export function CareBanner() {
  return (
    <section className="care-banner">
      <div>
        <span className="promo-banner__tag"><HeartPulse size={14} /> Cuidado conectado</span>
        <h2>Cuide de quem importa, de qualquer lugar</h2>
        <p>Alertas de dose, estoque sob controle e relatórios para a família e para a equipe de saúde.</p>
      </div>
      <div className="care-banner__actions">
        <Link to="/cadastro" className="store-button store-button--primary">Criar conta grátis</Link>
        <Link to="/entrar" className="store-button store-button--ghost">Já tenho conta</Link>
      </div>
    </section>
  )
}
