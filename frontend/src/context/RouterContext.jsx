import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const RouterContext = createContext(null)

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(
    () => `${window.location.pathname || '/'}${window.location.search}${window.location.hash}`,
  )
  const url = new URL(location, window.location.origin)
  const path = url.pathname
  const search = url.search

  useEffect(() => {
    const onPopState = () => {
      setLocation(`${window.location.pathname || '/'}${window.location.search}${window.location.hash}`)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((nextPath, { replace = false } = {}) => {
    const nextUrl = new URL(nextPath, window.location.origin)
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
    if (replace) window.history.replaceState({}, '', nextLocation)
    else window.history.pushState({}, '', nextLocation)
    setLocation(nextLocation)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const value = useMemo(() => ({ path, search, location, navigate }), [path, search, location, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter precisa estar dentro de RouterProvider.')
  return context
}

export function Link({ to, children, className = '', onClick, ...props }) {
  const { navigate } = useRouter()

  const handleClick = (event) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
