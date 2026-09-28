export function formatCurrency(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function onlyFilled(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

export function errorMessage(error) {
  return error?.message || 'Não foi possível concluir a ação.'
}

/** Só os dígitos: "61.774.267/0001-00" vira "61774267000100". */
export function somenteDigitos(valor) {
  return (valor || '').replace(/\D/g, '')
}
