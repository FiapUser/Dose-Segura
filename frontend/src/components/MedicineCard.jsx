import ProductCard from './ProductCard'

/**
 * Componente legado: mantém a API antiga (usada por páginas anteriores) e
 * delega para o card de loja.
 */
export default function MedicineCard({ medicine, onAdd }) {
  return <ProductCard medicine={medicine} onAdd={onAdd} />
}
