import { Clock, PackageCheck, Truck } from 'lucide-react'

/**
 * Medidor de estoque: mostra quantos dias de tratamento ainda existem.
 * Usado no card do produto e no painel de saúde.
 */
export default function StockMeter({ dias, rotulo = 'dias de estoque', compacto = false }) {
  const total = Math.max(0, Number(dias) || 0)
  let tom = 'ok'
  let mensagem = `${total} ${rotulo}`
  if (total === 0) {
    tom = 'zerado'
    mensagem = 'Estoque zerado'
  } else if (total <= 5) {
    tom = 'critico'
    mensagem = `Acaba em ${total} ${rotulo}`
  } else if (total <= 15) {
    tom = 'atencao'
    mensagem = `Restam ${total} ${rotulo}`
  }

  const percentual = Math.max(4, Math.min(100, (total / 30) * 100))

  return (
    <div className={`stock-meter stock-meter--${tom} ${compacto ? 'stock-meter--compacto' : ''}`}>
      <div className="stock-meter__bar" role="img" aria-label={mensagem}>
        <span style={{ width: `${percentual}%` }} />
      </div>
      <span className="stock-meter__label">{mensagem}</span>
    </div>
  )
}

/** Fita de entrega/tempo no topo do card da farmácia. */
export function DeliveryStrip({ tempoMinutos, taxaEntrega }) {
  const taxa = Number(taxaEntrega)
  const freteGratis = Number.isFinite(taxa) && taxa === 0
  return (
    <div className="delivery-strip">
      <span className={freteGratis ? 'delivery-strip__item delivery-strip__item--free' : 'delivery-strip__item'}>
        <Truck size={15} />
        {freteGratis ? 'Frete grátis' : 'Entrega em domicílio'}
      </span>
      {tempoMinutos != null && (
        <span className="delivery-strip__item">
          <Clock size={15} />
          {tempoMinutos} min
        </span>
      )}
      <span className="delivery-strip__item">
        <PackageCheck size={15} />
        Receita válida
      </span>
    </div>
  )
}
