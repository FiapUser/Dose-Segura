import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { useRouter } from './RouterContext'
import { cartApi } from '../services/api'

/** Contador do carrinho exibido no cabeçalho da loja. */
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated, activePatientId } = useAuth()
  const { path } = useRouter()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !activePatientId) {
      setCount(0)
      return
    }
    try {
      const cart = await cartApi.obter(activePatientId)
      const itens = Array.isArray(cart?.itens) ? cart.itens : []
      setCount(itens.reduce((total, item) => total + Number(item.quantidade || 0), 0))
    } catch {
      setCount(0)
    }
  }, [activePatientId, isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh, path])

  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext) || { count: 0, refresh: () => {} }
}
