import { ArrowRight, Building2, MapPin, Phone, Store } from 'lucide-react'
import { urlFarmacia, urlFornecedor } from '../lib/images'
import SmartImage from './SmartImage'
import StarRating, { TrustBadge } from './StoreRating'
import { DeliveryStrip } from './StockMeter'

/** Cartão de farmácia: foto da unidade, endereço, prazo e contato. */
export function PharmacyCard({ pharmacy, supplier, onSelect }) {
  return (
    <article className="store-card store-card--pharmacy">
      <div className="store-card__media">
        <SmartImage
          src={urlFarmacia(pharmacy, { w: 560, h: 340 })}
          tipo="farmacia"
          rotulo={pharmacy.nomeUnidade}
          alt={pharmacy.nomeUnidade}
          className="store-card__image"
        />
        <TrustBadge tone="green" icon={Store}>Farmácia parceira</TrustBadge>
      </div>
      <div className="store-card__body">
        <h3>{pharmacy.nomeUnidade}</h3>
        {supplier?.nomeFornecedor && (
          <span className="store-card__brand">Distribuído por {supplier.nomeFornecedor}</span>
        )}
        <DeliveryStrip
          tempoMinutos={pharmacy.tempoEntregaMinutos}
          taxaEntrega={pharmacy.taxaEntrega}
        />
        <ul className="store-card__list">
          {pharmacy.endereco && (
            <li><MapPin size={15} /><span>{typeof pharmacy.endereco === 'string' ? pharmacy.endereco : pharmacy.endereco.logradouro}</span></li>
          )}
          {pharmacy.telefone && (
            <li><Phone size={15} /><span>{pharmacy.telefone}</span></li>
          )}
        </ul>
        <div className="store-card__footer">
          <TrustBadge tone="blue" icon={MapPin}>CNPJ {pharmacy.cnpj || '—'}</TrustBadge>
          {onSelect && (
            <button type="button" className="store-link" onClick={() => onSelect(pharmacy)}>
              Comprar aqui <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/** Cartão de fornecedor: logo, avaliação e descrição. */
export function SupplierCard({ supplier, medicines = [], onSelect }) {
  return (
    <article className="store-card store-card--supplier">
      <div className="store-card__media store-card__media--logo">
        <SmartImage
          src={urlFornecedor(supplier, { w: 320, h: 320 })}
          tipo="fornecedor"
          rotulo={supplier.nomeFornecedor}
          alt={supplier.nomeFornecedor}
          className="store-card__logo"
        />
        <TrustBadge tone="blue" icon={Building2}>Fornecedor</TrustBadge>
      </div>
      <div className="store-card__body">
        <h3>{supplier.nomeFornecedor}</h3>
        <StarRating value={supplier.avaliacao || 0} />
        {supplier.descricao && <p className="store-card__text">{supplier.descricao}</p>}
        <div className="store-card__footer">
          <TrustBadge tone="green">{medicines.length} medicamentos</TrustBadge>
          {onSelect && (
            <button type="button" className="store-link" onClick={() => onSelect(supplier)}>
              Ver catálogo <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
