import { useEffect, useState } from 'react'
import { ArrowRight, HeartPulse, Pill, Search, ShieldCheck, Sparkles, Store, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { marketplaceApi } from '../services/api'
import { errorMessage } from '../lib/format'
import { ArtBand, CornerMark, HeroArtwork } from '../components/Artwork'
import ProductCard from '../components/ProductCard'
import { CareBanner, PromoBanner, TrustBar } from '../components/StoreBlocks'
import { Button, ErrorNotice, LinkButton, LoadingState, SectionTitle } from '../components/ui'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { navigate } = useRouter()
  const { notify } = useToast()
  const [medicines, setMedicines] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!isAuthenticated) {
      setLoading(false)
      return () => {
        active = false
      }
    }
    marketplaceApi
      .listarMedicamentos()
      .then((data) => active && setMedicines(Array.isArray(data) ? data : []))
      .catch((requestError) => active && setError(errorMessage(requestError)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const submitSearch = (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      notify('Entre na sua conta para consultar o marketplace.', 'info')
      navigate('/entrar')
      return
    }
    const term = search.trim()
    if (!term) {
      navigate('/marketplace')
      return
    }

    setLoading(true)
    setError('')
    marketplaceApi
      .buscarMedicamentos(term)
      .then((data) => {
        setMedicines(Array.isArray(data) ? data : [])
        notify(`Resultados para “${term}”`, 'success')
      })
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false))
  }

  const destaques = medicines.slice(0, 3)

  return (
    <>
      <section className="home-hero page-container">
        <div className="home-hero__copy">
          <span className="hero-kicker"><i /> Farmácia digital + cuidado conectado</span>
          <h1>Seu tratamento em <em>ordem</em>, todos os dias.</h1>
          <p>
            Compre medicamentos da rede parceira, acompanhe doses, consultas e exames e saiba
            quantos dias de estoque ainda restam — antes de o remédio acabar.
          </p>
          <form className="hero-search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="home-search">Buscar medicamento</label>
            <Search size={21} />
            <input
              id="home-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Qual medicamento você procura?"
            />
            <Button type="submit" icon={ArrowRight} iconAfter>Buscar</Button>
          </form>
          <div className="hero-links">
            {isAuthenticated ? (
              <LinkButton to="/painel" variant="green">Abrir meu painel</LinkButton>
            ) : (
              <LinkButton to="/entrar" variant="green">Entrar na minha conta</LinkButton>
            )}
            <Link to="/marketplace">Explorar catálogo <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="home-hero__visual">
          <CornerMark number="01" />
          <HeroArtwork />
          <div className="hero-stamp" aria-label="Mais de três etapas cuidadas">
            <strong>3</strong>
            <span>etapas<br />cuidadas</span>
          </div>
        </div>
      </section>

      <div className="page-container">
        <TrustBar />
      </div>

      <ArtBand />

      <section className="page-container principles-section">
        <SectionTitle
          eyebrow="Um sistema, três movimentos"
          title="Informação clara para decisões mais seguras."
          description="Cada parte do serviço foi desenhada para ocupar um papel essencial na rotina."
        />
        <div className="principles-grid">
          <article className="principle-card principle-card--lime">
            <span className="principle-card__index">01</span>
            <HeartPulse size={32} />
            <h3>Acompanhe</h3>
            <p>Agenda, doses e progresso reunidos em um painel que fala a sua língua.</p>
          </article>
          <article className="principle-card principle-card--blue">
            <span className="principle-card__index">02</span>
            <ShieldCheck size={32} />
            <h3>Organize</h3>
            <p>Seu estoque e seus alertas ajudam a antecipar o que precisa de atenção.</p>
          </article>
          <article className="principle-card principle-card--yellow">
            <span className="principle-card__index">03</span>
            <Store size={32} />
            <h3>Compre</h3>
            <p>Marketplace, fornecedores e farmácias conectados com entrega em domicílio.</p>
          </article>
        </div>
      </section>

      <section className="catalog-preview">
        <div className="page-container">
          <SectionTitle
            eyebrow="Seleção da rede"
            title="Mais pedidos pelos cuidadores"
            description="Preços, prazo de entrega e disponibilidade exibidos pela rede Dose Segura."
            action={<Link to="/marketplace" className="text-link">Ver catálogo completo <ArrowRight size={17} /></Link>}
          />
          <ErrorNotice message={error} />
          {loading ? (
            <div className="product-grid"><LoadingState /><LoadingState /><LoadingState /></div>
          ) : destaques.length > 0 ? (
            <div className="product-grid">
              {destaques.map((medicine) => <ProductCard key={medicine.id} medicine={medicine} />)}
            </div>
          ) : (
            <div className="catalog-placeholder">
              <span><Sparkles size={26} /></span>
              <div><b>Catálogo em construção</b><p>Assim que a API estiver ativa, os medicamentos aparecem aqui automaticamente.</p></div>
              <Link to="/marketplace">Tentar novamente <ArrowRight size={17} /></Link>
            </div>
          )}
        </div>
      </section>

      <div className="page-container">
        <PromoBanner onCta={() => navigate(isAuthenticated ? '/marketplace' : '/entrar')} />
        <CareBanner />
      </div>

      <section className="page-container cta-banner">
        <div className="cta-banner__number"><Pill size={30} /></div>
        <div>
          <span className="eyebrow eyebrow--light">Comece pelo hoje</span>
          <h2>O cuidado também pode ser uma experiência simples.</h2>
        </div>
        <LinkButton to={isAuthenticated ? '/agenda' : '/cadastro'} variant="light">
          {isAuthenticated ? 'Organizar minha agenda' : 'Criar minha conta'}
        </LinkButton>
      </section>

      <div className="page-container" style={{ paddingBottom: 24 }}>
        <div className="care-banner" style={{ marginBottom: 0 }}>
          <div>
            <span className="promo-banner__tag"><Truck size={14} /> Entrega</span>
            <h2>Receba em casa, com rastreio</h2>
            <p>Farmácias parceiras entregam na porta do paciente e avisam quando o pedido sai para entrega.</p>
          </div>
        </div>
      </div>
    </>
  )
}
