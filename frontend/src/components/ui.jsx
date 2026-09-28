import { useEffect } from 'react'
import { ArrowRight, LoaderCircle, X } from 'lucide-react'
import { Link } from '../context/RouterContext'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconAfter = false,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  const TrailingIcon = iconAfter === true ? Icon : iconAfter
  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" size={18} /> : Icon && !TrailingIcon ? <Icon size={18} /> : null}
      <span>{children}</span>
      {TrailingIcon && !loading ? <TrailingIcon size={18} /> : null}
    </button>
  )
}

export function LinkButton({ to, children, variant = 'primary', className = '', icon: Icon = ArrowRight }) {
  return (
    <Link to={to} className={`button button--${variant} button--md ${className}`}>
      <span>{children}</span>
      <Icon size={18} />
    </Link>
  )
}

export function Field({ label, htmlFor, hint, error, required = false, children, className = '' }) {
  return (
    <label className={`field ${className}`} htmlFor={htmlFor}>
      <span className="field__label">
        {label} {required && <b aria-hidden="true">*</b>}
      </span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  )
}

export function PageIntro({ eyebrow, title, description, action, children }) {
  return (
    <header className="page-intro">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {action && <div className="page-intro__action">{action}</div>}
    </header>
  )
}

export function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__shape" aria-hidden="true">
        {Icon && <Icon size={30} />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function LoadingState({ label = 'Carregando informação...' }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-state__block" />
      <span className="loading-state__line" />
      <span className="loading-state__line loading-state__line--short" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function ErrorNotice({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="notice notice--error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, eyebrow, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button icon-button--dark" type="button" onClick={onClose} aria-label="Fechar janela">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  )
}
