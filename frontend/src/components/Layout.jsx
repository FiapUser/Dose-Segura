import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  PackageOpen,
  Pill,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { Link, useRouter } from '../context/RouterContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { DoseLogo } from './Artwork'
import CareContextBar from './CareContextBar'
import { initials } from '../lib/format'
import { urlPerfil } from '../lib/images'
import SmartImage from './SmartImage'

const mainLinks = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/marketplace', label: 'Loja', icon: ShoppingBag, protected: true },
  { to: '/painel', label: 'Meu painel', icon: ClipboardPlus, protected: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, protected: true },
  { to: '/estoque', label: 'Estoque', icon: Pill, protected: true },
  { to: '/rede', label: 'Minha rede', icon: Users, protected: true },
  { to: '/gestao', label: 'Gestão', icon: Store, protected: true },
]

const footerLinks = [
  { to: '/painel', label: 'Painel de saúde' },
  { to: '/estoque', label: 'Meu estoque' },
  { to: '/agenda', label: 'Agenda de medicamentos' },
  { to: '/notificacoes', label: 'Notificações' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/carrinho', label: 'Carrinho' },
]

export function Header() {
  const { path, navigate, search } = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [busca, setBusca] = useState(() => new URLSearchParams(search).get('busca') || '')

  useEffect(() => setMenuOpen(false), [path])

  const visibleLinks = mainLinks.filter((item) => !item.protected || isAuthenticated)
  const handleLogout = () => {
    logout()
    navigate('/entrar')
  }

  const submitSearch = (event) => {
    event.preventDefault()
    const termo = busca.trim()
    if (!termo) {
      navigate('/marketplace')
      return
    }
    if (!isAuthenticated) {
      navigate('/entrar')
      return
    }
    navigate(`/marketplace?busca=${encodeURIComponent(termo)}`)
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="topbar__inner">
          <span><Truck size={14} /> Frete grátis acima de R$ 99 · Entrega em todo o Brasil</span>
          <span className="topbar__partner"><HeartPulse size={14} /> Dose Segura em parceria com a Eurofarma</span>
        </div>
      </div>

      <div className="site-header__main">
        <div className="site-header__inner">
          <Link to="/" className="brand-link" aria-label="Dose Segura — página inicial">
            <DoseLogo />
          </Link>

          <form className="header-search" onSubmit={submitSearch} role="search">
            <Search size={19} className="header-search__icon" />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar medicamento, farmácia ou fornecedor"
              aria-label="Buscar no catálogo"
            />
            <button type="submit" className="store-button store-button--primary header-search__button">
              Buscar
            </button>
          </form>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <Link to="/notificacoes" className="icon-button icon-button--light header-alert" aria-label="Notificações">
                  <Bell size={20} />
                </Link>
                <Link to="/carrinho" className="cart-button" aria-label={`Carrinho com ${count} itens`}>
                  <ShoppingCart size={21} />
                  <span>Carrinho</span>
                  {count > 0 && <b className="cart-button__count">{count}</b>}
                </Link>
                <Link to="/rede" className="user-chip" title={user?.nome || 'Paciente'}>
                  <span className="user-chip__avatar">
                    {user?.fotoPerfil ? (
                      <SmartImage src={urlPerfil(user, { w: 96, h: 96 })} tipo="perfil" rotulo={user?.nome} alt={user?.nome} />
                    ) : (
                      initials(user?.nome)
                    )}
                  </span>
                  <div>
                    <b>{user?.nome?.split(' ')[0] || 'Paciente'}</b>
                    <small>{user?.masterAdmin ? 'Master admin' : 'Conta ativa'}</small>
                  </div>
                </Link>
                <button type="button" className="icon-button icon-button--light desktop-logout" onClick={handleLogout} aria-label="Sair da conta">
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <>
                <Link to="/entrar" className="header-text-link">Entrar</Link>
                <Link to="/cadastro" className="store-button store-button--primary header-cta">Criar conta</Link>
              </>
            )}
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <nav className="category-nav" aria-label="Navegação principal">
        <div className="category-nav__inner">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={path === to ? 'category-nav__link category-nav__link--active' : 'category-nav__link'}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
          {isAuthenticated && (
            <Link to="/relatorios" className="category-nav__link category-nav__link--right">
              Relatórios
            </Link>
          )}
        </div>
      </nav>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={path === to ? 'mobile-nav__link mobile-nav__link--active' : 'mobile-nav__link'}>
              <Icon size={19} />
              <span>{label}</span>
              <ChevronRight size={18} />
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/carrinho" className="mobile-nav__link"><ShoppingBag size={19} /><span>Carrinho ({count})</span><ChevronRight size={18} /></Link>
              <Link to="/notificacoes" className="mobile-nav__link"><Bell size={19} /><span>Notificações</span><ChevronRight size={18} /></Link>
              <button type="button" className="mobile-nav__link mobile-nav__logout" onClick={handleLogout}>
                <LogOut size={19} /><span>Sair da conta</span><ChevronRight size={18} />
              </button>
            </>
          ) : (
            <Link to="/entrar" className="mobile-nav__link"><LogOut size={19} /><span>Entrar</span><ChevronRight size={18} /></Link>
          )}
        </nav>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <DoseLogo inverted />
          <p>Medicamentos, farmácias e fornecedores em uma experiência conectada — com a agenda e o estoque do seu tratamento sempre em dia.</p>
          <span className="site-footer__partner"><HeartPulse size={16} /> Parceria Eurofarma</span>
        </div>
        <div className="site-footer__links">
          <span className="footer-label">Minha conta</span>
          {footerLinks.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </div>
        <div className="site-footer__note">
          <PackageOpen size={30} />
          <b>Compra segura</b>
          <span>Farmácias verificadas, rastreio de pedidos e suporte a cuidadores.</span>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Dose Segura</span>
        <span>"A dose certa, na hora certa, para quem mais importa."</span>
      </div>
    </footer>
  )
}

export default function Layout({ children, className = '' }) {
  const { isAuthenticated } = useAuth()
  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Header />
      {isAuthenticated && <CareContextBar />}
      <main id="conteudo" className={`site-main ${className}`}>{children}</main>
      <Footer />
    </div>
  )
}
