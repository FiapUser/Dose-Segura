import { BadgeCheck, Star, TrendingDown } from 'lucide-react'

/** Avaliação em estrelas, com support a media fracionária. */
export default function StarRating({ value = 0, reviews, size = 14, showValue = true }) {
  const nota = Number(value) || 0
  return (
    <span className="star-rating" title={`${nota.toFixed(1)} de 5`}>
      <span className="star-rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <Star
            key={estrela}
            size={size}
            className={estrela <= Math.round(nota) ? 'star star--on' : 'star'}
            fill={estrela <= Math.round(nota) ? 'currentColor' : 'none'}
          />
        ))}
      </span>
      {showValue && <b>{nota > 0 ? nota.toFixed(1).replace('.', ',') : '—'}</b>}
      {reviews != null && <small>({reviews})</small>}
    </span>
  )
}

/** selo verde/azul de confiança da rede. */
export function TrustBadge({ children, tone = 'green', icon: Icon = BadgeCheck }) {
  return (
    <span className={`store-badge store-badge--${tone}`}>
      {Icon && <Icon size={13} strokeWidth={2.4} />}
      {children}
    </span>
  )
}

/** fita de desconto no canto da foto do produto. */
export function DiscountRibbon({ percentual }) {
  const valor = Number(percentual)
  if (!Number.isFinite(valor) || valor <= 0) return null
  return (
    <span className="discount-ribbon">
      <TrendingDown size={13} strokeWidth={2.6} />
      -{Math.round(valor)}%
    </span>
  )
}
