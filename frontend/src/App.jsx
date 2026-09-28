import { useEffect } from 'react'
import Layout from './components/Layout'
import { LoadingState } from './components/ui'
import { useAuth } from './context/AuthContext'
import { useRouter } from './context/RouterContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MarketplacePage from './pages/MarketplacePage'
import MedicineDetailPage from './pages/MedicineDetailPage'
import DashboardPage from './pages/DashboardPage'
import AgendaPage from './pages/AgendaPage'
import StockPage from './pages/StockPage'
import NotificationsPage from './pages/NotificationsPage'
import ReportsPage from './pages/ReportsPage'
import CareNetworkPage from './pages/CareNetworkPage'
import CartPage from './pages/CartPage'
import ManagementPage from './pages/ManagementPage'
import NotFoundPage from './pages/NotFoundPage'

function Protected({ children }) {
  const { isAuthenticated } = useAuth()
  const { navigate, path } = useRouter()

  useEffect(() => {
    if (!isAuthenticated) navigate('/entrar', { replace: true })
  }, [isAuthenticated, navigate, path])

  if (!isAuthenticated) return <div className="page-container page-shell"><LoadingState label="Verificando sessão" /></div>
  return children
}

function AuthOnly({ children }) {
  const { isAuthenticated } = useAuth()
  const { navigate } = useRouter()

  useEffect(() => {
    if (isAuthenticated) navigate('/painel', { replace: true })
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return <div className="page-container page-shell"><LoadingState /></div>
  return children
}

function resolvePage(path) {
  if (path === '/') return <HomePage />
  if (path === '/entrar') return <AuthOnly><LoginPage /></AuthOnly>
  if (path === '/cadastro') return <AuthOnly><RegisterPage /></AuthOnly>
  if (path === '/marketplace') return <Protected><MarketplacePage /></Protected>
  if (/^\/medicamento\/\d+$/.test(path)) return <MedicineDetailPage />
  if (path === '/painel') return <Protected><DashboardPage /></Protected>
  if (path === '/agenda') return <Protected><AgendaPage /></Protected>
  if (path === '/estoque') return <Protected><StockPage /></Protected>
  if (path === '/notificacoes') return <Protected><NotificationsPage /></Protected>
  if (path === '/relatorios') return <Protected><ReportsPage /></Protected>
  if (path === '/rede') return <Protected><CareNetworkPage /></Protected>
  if (path === '/carrinho') return <Protected><CartPage /></Protected>
  if (path === '/gestao') return <Protected><ManagementPage /></Protected>
  return <NotFoundPage />
}

export default function App() {
  const { path } = useRouter()
  return <Layout>{resolvePage(path)}</Layout>
}
