import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const USER_KEY = 'dose-segura:patient'
const TOKEN_KEY = 'dose-segura:token'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [activePatientId, setActivePatientId] = useState(() => readStoredUser()?.id ?? null)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setActivePatientId(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener('dose-segura:unauthorized', onUnauthorized)
    return () => window.removeEventListener('dose-segura:unauthorized', onUnauthorized)
  }, [logout])

  const login = useCallback(async (email, senha) => {
    const result = await api.auth.login(email, senha)
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.paciente))
    setToken(result.token)
    setUser(result.paciente)
    setActivePatientId(result.paciente.id)
    return result.paciente
  }, [])

  const register = useCallback(async (data) => api.auth.cadastrar(data), [])

  const updateCurrentUser = useCallback(
    async (data) => {
      const updated = await api.auth.atualizar(user.id, data)
      const nextUser = { ...user, ...updated }
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
      return updated
    },
    [user],
  )

  const refreshCurrentUser = useCallback(async () => {
    if (!user?.id) return null
    const updated = await api.auth.obter(user.id)
    const nextUser = { ...user, ...updated }
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return updated
  }, [user])

  const value = useMemo(
    () => ({
      token,
      user,
      activePatientId,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      setUser,
      setActivePatientId,
      updateCurrentUser,
      refreshCurrentUser,
    }),
    [token, user, activePatientId, login, register, logout, updateCurrentUser, refreshCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return context
}
