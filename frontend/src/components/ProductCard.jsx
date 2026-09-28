import { Pill, Plus, ShoppingCart } from 'lucide-react'
import { Link } from '../context/RouterContext'
import { formatCurrency } from '../lib/format'
import { parcelas, urlMedicamento } from '../lib/images'
import SmartImage from './SmartImage'
import { DiscountRibbon, TrustBadge } from './StoreRating'

/**
 * Card de produto no estilo loja virtual: foto, selos, preço com desconto,
 * parcelas, disponibilidade e botão de compra.
 */
export default function ProductCard({
  medicine,
  onAdd,
  categoria,
  destaque = false,
}) {
  if (!medicine) return null

  const desconto = medicine.descontoSelecionado ? medicine.descontoPorcentagem : 0
  const semEstoque = medicine.estoqueDisponivel === 0
  const parcela = parcelas(medicine.preco)
  const fornecedor = medicine.fornecedor?.nomeFornecedor || medicine.nomeFornecedor

  return (
    <article className={`product-card ${destaque ? 'product-card--destaque' : ''}`}>
      <Link to={`/medicamento/${medicine.id}`} className="product-card__media" aria-label={`Abrir ${medicine.nome}`}>
        <SmartImage
          src={urlMedicamento(medicine, { w: 520, h: 400 })}
          tipo="medicamento"
          rotulo={medicine.nome}
          alt={medicine.nome}
          className="product-card__image"
          loading="lazy"
        />
        <DiscountRibbon percentual={desconto} />
        {destaque && <span className="product-card__flag">Mais pedido</span>}
      </Link>

      <div className="product-card__body">
        <span className="product-card__brand">
          {fornecedor || 'Rede Dose Segura'}
          {medicine.fabricante ? ` · ${medicine.fabricante}` : ''}
        </span>
        <h3 className="product-card__title">
          <Link to={`/medicamento/${medicine.id}`}>{medicine.nome}</Link>
        </h3>
        <p className="product-card__meta">
          {medicine.dosagem || medicine.categoria || 'Medicamento de uso contínuo'}
          {medicine.principioAtivo ? ` · ${medicine.principioAtivo}` : ''}
        </p>

        <div className="product-card__tags">
          <TrustBadge tone="green" icon={Pill}>Receita médica</TrustBadge>
          {semEstoque ? (
            <TrustBadge tone="red">Sem estoque</TrustBadge>
          ) : medicine.estoqueDisponivel <= 20 ? (
            <TrustBadge tone="yellow">Últimas {medicine.estoqueDisponivel} unidades</TrustBadge>
          ) : (
            <TrustBadge tone="blue">Em estoque</TrustBadge>
          )}
        </div>

        <div className="product-card__price">
          {desconto > 0 && medicine.precoOriginal != null && (
            <span className="price-tag__old">{formatCurrency(medicine.precoOriginal)}</span>
          )}
          <strong className="price-tag__now">{formatCurrency(medicine.preco)}</strong>
          {parcela && <span className="price-tag__installments">ou {parcela}x de {formatCurrency(medicine.preco / parcela)} sem juros</span>}
        </div>

        <div className="product-card__actions">
          {onAdd ? (
            <button
              type="button"
              className="store-button store-button--primary"
              onClick={() => onAdd(medicine)}
              disabled={semEstoque}
            >
              <ShoppingCart size={17} />
              <span>{semEstoque ? 'Indisponível' : 'Adicionar'}</span>
            </button>
          ) : (
            <Link to={`/medicamento/${medicine.id}`} className="store-button store-button--primary">
              <Plus size={17} />
              <span>Ver detalhes</span>
            </Link>
          )}
        </div>
      </div>

      {categoria && <span className="product-card__category">{categoria}</span>}
    </article>
  )
}
