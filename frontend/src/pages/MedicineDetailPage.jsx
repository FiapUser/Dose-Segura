import { useEffect, useState } from 'react'
import { ArrowLeft, Boxes, Check, MapPin, Minus, PackageCheck, Pill, Plus, ShieldCheck, Store, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { cartApi, marketplaceApi, pharmacyApi } from '../services/api'
import { errorMessage, formatCurrency } from '../lib/format'
import { parcelas, urlFarmacia, urlMedicamento } from '../lib/images'
import SmartImage from '../components/SmartImage'
import { TrustBadge } from '../components/StoreRating'
import { Button, EmptyState, LoadingState, SectionTitle, StatusBadge } from '../components/ui'

const detailLabels = {
  dosagem: 'Dosagem',
  fabricante: 'Fabricante',
  principioAtivo: 'Princípio ativo',
  categoria: 'Categoria',
  descricao: 'Descrição',
  estoqueDisponivel: 'Estoque disponível',
  estoqueFabricante: 'Estoque do fabricante',
  descontoPorcentagem: 'Desconto',
}

export default function MedicineDetailPage() {
  const { path, navigate } = useRouter()
  const { isAuthenticated, activePatientId } = useAuth()
  const { notify } = useToast()
  const { refresh } = useCart()
  const medicineId = Number(path.split('/').filter(Boolean).pop())
  const [medicine, setMedicine] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [pharmacies, setPharmacies] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isFinite(medicineId)) {
      setError('Medicamento não encontrado.')
      setLoading(false)
      return undefined
    }
    let active = true
    setLoading(true)
    setError('')
    marketplaceApi
      .obterMedicamento(medicineId)
      .then(async (data) => {
        if (!active) return
        setMedicine(data)
        const supplierId = data?.fornecedor?.id || data?.fornecedorId
        if (!supplierId) return
        const [supplierResult, pharmacyResult] = await Promise.allSettled([
          marketplaceApi.obterFornecedor(supplierId),
          pharmacyApi.listarPorFornecedor(supplierId),
        ])
        if (active && supplierResult.status === 'fulfilled') setSupplier(supplierResult.value)
        if (active && pharmacyResult.status === 'fulfilled' && Array.isArray(pharmacyResult.value)) setPharmacies(pharmacyResult.value)
      })
      .catch((requestError) => active && setError(errorMessage(requestError)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [medicineId])

  const addToCart = async () => {
    if (!isAuthenticated) {
      notify('Entre na sua conta para comprar este medicamento.', 'info')
      navigate('/entrar')
      return
    }
    setAdding(true)
    try {
      await cartApi.adicionar(activePatientId, medicine.id, quantity)
      await refresh()
      notify(`${medicine.nome} adicionado ao carrinho.`, 'success')
      navigate('/carrinho')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="page-shell page-container product-loading"><LoadingState label="Buscando medicamento" /></div>
  if (error || !medicine) {
    return (
      <div className="page-shell page-container">
        <EmptyState icon={PackageCheck} title="Medicamento indisponível" description={error || 'O item solicitado não existe.'} action={<Link className="button button--primary button--md" to="/marketplace"><span>Voltar ao marketplace</span></Link>} />
      </div>
    )
  }

  const availableDetails = Object.entries(detailLabels)
    .filter(([key]) => medicine[key] !== undefined && medicine[key] !== null && medicine[key] !== '')
  const desconto = medicine.descontoSelecionado ? medicine.descontoPorcentagem : 0
  const parcela = parcelas(medicine.preco)
  const semEstoque = medicine.estoqueDisponivel === 0

  return (
    <div className="page-shell page-container product-page">
      <Link to="/marketplace" className="back-link"><ArrowLeft size={16} /> Voltar ao catálogo</Link>

      <section className="product-layout">
        <div className="product-visual">
          <SmartImage
            src={urlMedicamento(medicine, { w: 900, h: 700 })}
            tipo="medicamento"
            rotulo={medicine.nome}
            alt={medicine.nome}
          />
          <div className="product-visual__stamp"><ShieldCheck size={26} /><span>Origem<br />verificada</span></div>
        </div>

        <div className="product-info">
          <div className="product-info__tags">
            <StatusBadge tone="green">Medicamento</StatusBadge>
            {semEstoque ? <StatusBadge tone="red">Sem estoque</StatusBadge> : <StatusBadge tone="blue">Disponível</StatusBadge>}
            {desconto > 0 && <StatusBadge tone="yellow">-{Math.round(desconto)}%</StatusBadge>}
          </div>
          <span className="product-info__supplier">{supplier?.nomeFornecedor || medicine.fornecedor?.nomeFornecedor || 'Fornecedor da rede'}</span>
          <h1>{medicine.nome}</h1>
          <p className="product-info__description">
            {medicine.descricao || (medicine.dosagem ? `Dosagem: ${medicine.dosagem}.` : 'Consulte as informações completas do medicamento.')}
          </p>

          <div className="product-info__price">
            <strong className="price-tag__now">{formatCurrency(medicine.preco)}</strong>
            {desconto > 0 && medicine.precoOriginal != null && (
              <small className="price-tag__old">de {formatCurrency(medicine.precoOriginal)}</small>
            )}
            {parcela && <span className="price-tag__installments">em até {parcela}x de {formatCurrency(medicine.preco / parcela)} sem juros</span>}
          </div>

          <div className="product-card__tags">
            <TrustBadge tone="green" icon={Pill}>Receita médica</TrustBadge>
            <TrustBadge tone="blue" icon={Truck}>Entrega em domicílio</TrustBadge>
            <TrustBadge tone="blue" icon={Store}>{pharmacies.length || 1} farmácia(s) na rede</TrustBadge>
          </div>

          {availableDetails.length > 0 && (
            <dl className="product-specs">
              {availableDetails.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{String(medicine[key])}</dd></div>)}
            </dl>
          )}

          <div className="product-buy">
            <div className="quantity-control" aria-label="Quantidade">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade"><Minus size={17} /></button>
              <strong>{quantity}</strong>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Aumentar quantidade"><Plus size={17} /></button>
            </div>
            <Button onClick={addToCart} loading={adding} size="lg" icon={Boxes} iconAfter disabled={semEstoque}>
              {semEstoque ? 'Indisponível' : 'Adicionar ao carrinho'}
            </Button>
          </div>
          <p className="product-info__notice"><Check size={16} /> A compra e a dispensação são concluídas conforme as regras da rede.</p>
        </div>
      </section>

      {(supplier || pharmacies.length > 0) && (
        <section className="product-network">
          <SectionTitle eyebrow="Rede de atendimento" title="Onde encontrar" description="Fornecedor e farmácias retornados pela API." />
          <div className="product-network__grid">
            {supplier && (
              <article>
                <Store size={26} />
                <span>Fornecedor</span>
                <b>{supplier.nomeFornecedor}</b>
                <p>{supplier.telefone || 'Consulte o fornecedor'}</p>
              </article>
            )}
            {pharmacies.map((pharmacy) => (
              <article key={pharmacy.id}>
                <MapPin size={26} />
                <span>Farmácia</span>
                <b>{pharmacy.nomeUnidade}</b>
                <p>{pharmacy.endereco || 'Consulte o endereço'}</p>
                <p>
                  {pharmacy.tempoEntregaMinutos != null ? `Entrega em ${pharmacy.tempoEntregaMinutos} min` : 'Consulte o prazo'}
                </p>
                <img
                  src={urlFarmacia(pharmacy, { w: 320, h: 200 })}
                  alt={pharmacy.nomeUnidade}
                  style={{ borderRadius: 12, marginTop: 8 }}
                />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
