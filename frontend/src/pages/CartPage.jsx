import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Lock, PackageOpen, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useRouter } from '../context/RouterContext'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { cartApi } from '../services/api'
import { errorMessage, formatCurrency } from '../lib/format'
import { parcelas, urlMedicamento } from '../lib/images'
import SmartImage from '../components/SmartImage'
import { Button, EmptyState, ErrorNotice, LoadingState, PageIntro, SectionTitle } from '../components/ui'

function itemMedicine(item) {
  return item.medicamento || item.produto || item
}

function itemTotal(item) {
  const medicine = itemMedicine(item)
  const unitPrice = Number(item.precoUnitario ?? item.preco ?? medicine.preco ?? 0)
  return Number(item.subtotal ?? item.total ?? unitPrice * Number(item.quantidade || 0))
}

const FRETE_GRATIS_A_PARTIR_DE = 99

export default function CartPage() {
  const { activePatientId } = useAuth()
  const { navigate } = useRouter()
  const { notify } = useToast()
  const { refresh } = useCart()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const loadCart = () => {
    setLoading(true)
    setError('')
    cartApi
      .obter(activePatientId)
      .then(setCart)
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false))
  }

  useEffect(loadCart, [activePatientId])

  const items = Array.isArray(cart?.itens) ? cart.itens : []
  const calculatedTotal = useMemo(() => items.reduce((sum, item) => sum + itemTotal(item), 0), [items])
  const total = Number(cart?.total ?? calculatedTotal)
  const faltaParaFrete = Math.max(0, FRETE_GRATIS_A_PARTIR_DE - total)
  const parcela = parcelas(total)

  const removeItem = async (item) => {
    setBusyId(item.id)
    try {
      const updated = await cartApi.remover(activePatientId, item.id)
      setCart(updated)
      await refresh()
      notify('Item removido do carrinho.', 'success')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const increaseItem = async (item) => {
    const medicine = itemMedicine(item)
    if (!medicine?.id) return
    setBusyId(item.id)
    try {
      const updated = await cartApi.adicionar(activePatientId, medicine.id, 1)
      setCart(updated)
      await refresh()
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const checkout = async () => {
    setCheckingOut(true)
    try {
      await cartApi.finalizar(activePatientId)
      notify('Pedido finalizado com sucesso.', 'success')
      setCart({ itens: [] })
      await refresh()
      navigate('/agenda')
    } catch (requestError) {
      notify(errorMessage(requestError), 'error')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="page-shell page-container cart-page">
      <PageIntro
        eyebrow="Sua seleção"
        title="Carrinho"
        description="Confira os itens do paciente selecionado antes de finalizar o pedido."
        action={<Link to="/marketplace" className="store-link">Continuar explorando <ArrowRight size={16} /></Link>}
      />
      <ErrorNotice message={error} onRetry={loadCart} />

      {loading ? (
        <LoadingState label="Carregando carrinho" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Seu carrinho está vazio"
          description="Explore o catálogo e escolha os medicamentos do próximo ciclo."
          action={<Link to="/marketplace" className="store-button store-button--primary"><span>Ver medicamentos</span><ArrowRight size={17} /></Link>}
        />
      ) : (
        <div className="cart-layout">
          <section className="cart-list">
            <SectionTitle title={`${items.length} ${items.length === 1 ? 'item' : 'itens'}`} eyebrow="Revise antes de continuar" />
            {items.map((item, index) => {
              const medicine = itemMedicine(item)
              return (
                <article className="cart-item" key={item.id || `${medicine.id}-${index}`}>
                  <div className="cart-item__art">
                    <SmartImage
                      src={urlMedicamento(medicine, { w: 220, h: 220 })}
                      tipo="medicamento"
                      rotulo={medicine?.nome}
                      alt={medicine?.nome || 'Medicamento'}
                    />
                  </div>
                  <div className="cart-item__info">
                    <span>{medicine?.dosagem || medicine?.fornecedor?.nomeFornecedor || 'Medicamento'}</span>
                    <h2>{medicine?.nome || item.nome || 'Medicamento'}</h2>
                    <strong>{formatCurrency(item.precoUnitario ?? medicine?.preco)}</strong>
                  </div>
                  <div className="cart-item__quantity">
                    <button type="button" onClick={() => removeItem(item)} disabled={busyId === item.id} aria-label={`Remover ${medicine?.nome}`}><Trash2 size={16} /></button>
                    <span>{item.quantidade}</span>
                    <button type="button" onClick={() => increaseItem(item)} disabled={busyId === item.id} aria-label={`Aumentar ${medicine?.nome}`}><Plus size={16} /></button>
                  </div>
                  <div className="cart-item__total">
                    <span>Subtotal</span>
                    <b>{formatCurrency(itemTotal(item))}</b>
                    <button type="button" onClick={() => removeItem(item)} disabled={busyId === item.id}><Trash2 size={16} /> Remover</button>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="cart-summary">
            <span className="cart-summary__index">Σ</span>
            <h2>Resumo do pedido</h2>
            <div className="cart-summary__line"><span>Itens</span><b>{items.length}</b></div>
            <div className="cart-summary__line"><span>Subtotal</span><b>{formatCurrency(total)}</b></div>
            <div className="cart-summary__line">
              <span>Frete</span>
              <b>{faltaParaFrete === 0 ? <span className="store-badge store-badge--green">Grátis</span> : `Faltam ${formatCurrency(faltaParaFrete)}`}</b>
            </div>
            {parcela && <div className="cart-summary__line"><span>Parcelamento</span><b>{parcela}x sem juros</b></div>}
            <div className="cart-summary__total"><span>Total estimado</span><strong>{formatCurrency(total)}</strong></div>
            <p>O frete e os valores finais são definidos pela farmácia responsável.</p>
            <Button onClick={checkout} loading={checkingOut} size="lg" iconAfter={ArrowRight}>Finalizar pedido</Button>
            <Link to="/marketplace"><PackageOpen size={17} /> Adicionar mais itens</Link>
            <div className="cart-summary__line" style={{ marginTop: 4 }}>
              <span className="store-badge store-badge--green"><ShieldCheck size={13} /> Compra segura</span>
              <span className="store-badge store-badge--blue"><Truck size={13} /> Entrega rastreada</span>
            </div>
            <p className="store-badge store-badge--neutral"><Lock size={13} /> Dados protegidos</p>
          </aside>
        </div>
      )}
    </div>
  )
}

