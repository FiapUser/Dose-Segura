import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, MapPin, Package, Search, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { cartApi, marketplaceApi, pharmacyApi } from '../services/api'
import { errorMessage } from '../lib/format'
import ProductCard from '../components/ProductCard'
import { CategoryRail, PromoBanner } from '../components/StoreBlocks'
import { PharmacyCard, SupplierCard } from '../components/StoreCards'
import { Button, EmptyState, ErrorNotice, PageIntro, SectionTitle } from '../components/ui'

const abas = [
  { id: 'medicamentos', label: 'Medicamentos', icon: Package },
  { id: 'fornecedores', label: 'Fornecedores', icon: Building2 },
  { id: 'farmacias', label: 'Farmácias', icon: Store },
]

const ORDENS = [
  { id: 'relevancia', label: 'Mais relevantes' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'maior-desconto', label: 'Maior desconto' },
]

export default function MarketplacePage() {
  const { isAuthenticated, activePatientId } = useAuth()
  const { navigate, search } = useRouter()
  const { notify } = useToast()
  const { refresh } = useCart()
  const [aba, setAba] = useState('medicamentos')
  const [medicines, setMedicines] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [term, setTerm] = useState(() => new URLSearchParams(search).get('busca') || '')
  const [categoria, setCategoria] = useState('todos')
  const [ordem, setOrdem] = useState('relevancia')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMarketplace = (searchTerm = '') => {
    setLoading(true)
    setError('')
    const medicineRequest = searchTerm
      ? marketplaceApi.buscarMedicamentos(searchTerm)
      : marketplaceApi.listarMedicamentos()
    Promise.allSettled([medicineRequest, marketplaceApi.listarFornecedores(), pharmacyApi.listar()])
      .then(([medicineResult, supplierResult, pharmacyResult]) => {
        if (medicineResult.status === 'fulfilled') setMedicines(Array.isArray(medicineResult.value) ? medicineResult.value : [])
        else setError(errorMessage(medicineResult.reason))
        if (supplierResult.status === 'fulfilled') setSuppliers(Array.isArray(supplierResult.value) ? supplierResult.value : [])
        if (pharmacyResult.status === 'fulfilled') setPharmacies(Array.isArray(pharmacyResult.value) ? pharmacyResult.value : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const queryTerm = new URLSearchParams(search).get('busca') || ''
    setTerm(queryTerm)
    setCategoria('todos')
    loadMarketplace(queryTerm)
  }, [search])

  const counts = useMemo(
    () => ({ medicamentos: medicines.length, fornecedores: suppliers.length, farmacias: pharmacies.length }),
    [medicines.length, suppliers.length, pharmacies.length],
  )

  const categoriasDisponiveis = useMemo(
    () => [...new Set(medicines.map((item) => item.categoria).filter(Boolean))],
    [medicines],
  )

  const visiveis = useMemo(() => {
    const filtrados = categoria === 'todos'
      ? medicines
      : medicines.filter((item) => item.categoria === categoria)
    const ordenados = [...filtrados]
    if (ordem === 'menor-preco') ordenados.sort((a, b) => (a.preco || 0) - (b.preco || 0))
    if (ordem === 'maior-preco') ordenados.sort((a, b) => (b.preco || 0) - (a.preco || 0))
    if (ordem === 'maior-desconto') ordenados.sort((a, b) => (b.descontoPorcentagem || 0) - (a.descontoPorcentagem || 0))
    return ordenados
  }, [medicines, categoria, ordem])

  const handleSearch = (event) => {
    event.preventDefault()
    navigate(term.trim() ? `/marketplace?busca=${encodeURIComponent(term.trim())}` : '/marketplace')
  }

  const addMedicine = async (medicine) => {
    if (!isAuthenticated) {
      notify('Entre na sua conta para adicionar itens ao carrinho.', 'info')
      navigate('/entrar')
      return
    }
    try {
      await cartApi.adicionar(activePatientId, medicine.id, 1)
      await refresh()
      notify(`${medicine.nome} foi adicionado ao carrinho.`, 'success')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    }
  }

  return (
    <div className="page-shell page-container marketplace-page">
      <PageIntro
        eyebrow="Marketplace conectado"
        title="A farmácia da rede Dose Segura"
        description="Medicamentos, fornecedores e farmácias parceiras com entrega em domicílio."
        action={
          <form className="search-box market-search" onSubmit={handleSearch}>
            <Search size={19} />
            <input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar medicamento" />
            <Button type="submit">Buscar</Button>
          </form>
        }
      />

      <div className="market-tabs" role="tablist" aria-label="Categorias do marketplace">
        {abas.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'market-tab market-tab--active' : 'market-tab'} onClick={() => setAba(id)}>
            <Icon size={19} />
            <span>{label}</span>
            <b>{counts[id]}</b>
          </button>
        ))}
      </div>

      <ErrorNotice message={error} onRetry={() => loadMarketplace(term)} />

      {aba === 'medicamentos' && (
        <section aria-live="polite">
          <CategoryRail
            categorias={categoriasDisponiveis}
            ativo={categoria}
            onChange={(value) => {
              setCategoria(value)
              if (value !== 'todos' && value !== 'Cardiovascular' && !categoriasDisponiveis.includes(value)) {
                // A categoria existe apenas se veio da API; senão volta para "todos".
                setCategoria('todos')
              }
            }}
          />

          <div className="store-toolbar">
            <span className="store-toolbar__count">
              <b>{visiveis.length}</b> {visiveis.length === 1 ? 'medicamento encontrado' : 'medicamentos encontrados'}
              {term && <> para “{term}”</>}
            </span>
            <label className="store-sort">
              Ordenar por
              <select className="select" value={ordem} onChange={(event) => setOrdem(event.target.value)} aria-label="Ordenar medicamentos">
                {ORDENS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="product-grid"><div className="loading-state" /><div className="loading-state" /><div className="loading-state" /></div>
          ) : visiveis.length ? (
            <div className="product-grid">
              {visiveis.map((medicine, index) => (
                <ProductCard
                  key={medicine.id}
                  medicine={medicine}
                  onAdd={addMedicine}
                  categoria={medicine.categoria}
                  destaque={index === 0 && !term}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum medicamento por aqui"
              description="Tente outro termo, outra categoria ou confirme se a API está conectada."
              action={<Button onClick={() => navigate('/marketplace')}>Limpar busca</Button>}
            />
          )}

          <PromoBanner onCta={() => setAba('farmacias')} cta="Ver farmácias parceiras" />
        </section>
      )}

      {aba === 'fornecedores' && (
        <section aria-live="polite">
          <SectionTitle eyebrow="Parceiros" title="Quem fornece o cuidado" description="Fornecedores cadastrados no marketplace." />
          {suppliers.length ? (
            <div className="network-grid">
              {suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  medicines={medicines.filter((item) => String(item.fornecedor?.id) === String(supplier.id))}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Building2} title="Nenhum fornecedor cadastrado" description="Os fornecedores aparecerão aqui assim que forem registrados pela API." />
          )}
        </section>
      )}

      {aba === 'farmacias' && (
        <section aria-live="polite">
          <SectionTitle eyebrow="Proximidade" title="Farmácias da rede" description="Unidades conectadas a fornecedores da plataforma, com prazo de entrega." />
          {pharmacies.length ? (
            <div className="network-grid">
              {pharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  supplier={suppliers.find((item) => String(item.id) === String(pharmacy.fornecedor?.id))}
                  onSelect={() => navigate('/marketplace')}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Store} title="Nenhuma farmácia cadastrada" description="As farmácias aparecerão aqui assim que forem registradas pela API." />
          )}
          <div className="search-result">
            <MapPin size={16} /> Entrega em domicílio disponível para pacientes cadastrados.
            <ArrowRight size={16} />
          </div>
        </section>
      )}
    </div>
  )
}
