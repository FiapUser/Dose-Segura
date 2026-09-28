import { Activity, Cross, HeartPulse, Pill, Stethoscope, Syringe, Truck } from 'lucide-react'
import { urlMedicamento } from '../lib/images'
import SmartImage from './SmartImage'

/**
 * Escudo de proteção: watch + check. Usado como favicon e impresso nos materiais.
 * (Versão inline para poder cambiar a cor no rodapé escuro.)
 */
export function EscudoDoseSegura({ tamanho = 40, monocromatico = false, className = '' }) {
  const id = `escudo-${monocromatico ? 'claro' : 'marca'}`
  return (
    <svg
      className={`escudo ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Dose Segura"
    >
      <defs>
        <linearGradient id={`${id}-escudo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={monocromatico ? '#ffffff' : '#3fa9f5'} />
          <stop offset="55%" stopColor={monocromatico ? '#d8e8fb' : '#1b7fd4'} />
          <stop offset="100%" stopColor={monocromatico ? '#9dc4f0' : '#0b4ed8'} />
        </linearGradient>
        <linearGradient id={`${id}-verde`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ec27a" />
          <stop offset="100%" stopColor="#0e9f4a" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 8 12v20c0 13 10 24 24 28 14-4 24-15 24-28V12L32 4z"
        fill={monocromatico ? '#ffffff' : '#9fd8ff'}
      />
      <path
        d="M32 8 12 14.6V32c0 11.3 8.6 20.8 20 24.2 11.4-3.4 20-12.9 20-24.2V14.6L32 8z"
        fill={`url(#${id}-escudo)`}
      />
      <circle cx="30.5" cy="27.5" r="14.5" fill="#ffffff" />
      <g stroke="#123a63" strokeLinecap="round">
        <line x1="30.5" y1="27.5" x2="30.5" y2="17.5" strokeWidth="3.2" />
        <line x1="30.5" y1="27.5" x2="37.5" y2="30.5" strokeWidth="3.2" />
      </g>
      <circle cx="30.5" cy="27.5" r="2" fill="#123a63" />
      <g fill="#9fc4e4">
        <circle cx="30.5" cy="14.6" r="1.15" />
        <circle cx="30.5" cy="40.4" r="1.15" />
        <circle cx="17.6" cy="27.5" r="1.15" />
        <circle cx="43.4" cy="27.5" r="1.15" />
      </g>
      <circle cx="46" cy="44" r="14" fill={`url(#${id}-verde)`} />
      <path
        d="M39 44.5l4.8 4.8 9.2-9.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Marca Dose Segura: escudo + nome. */
export function DoseLogo({ compact = false, inverted = false }) {
  return (
    <span className={`dose-logo ${compact ? 'dose-logo--compact' : ''} ${inverted ? 'dose-logo--inverted' : ''}`}>
      <EscudoDoseSegura tamanho={compact ? 34 : 42} monocromatico={inverted} />
      <span className="dose-logo__text">
        <b>Dose</b>
        <b className="dose-logo__text-accent">Segura</b>
      </span>
    </span>
  )
}

/** Imagem de medicamento: foto do Cloudinary ou ilustração gerada pela API. */
export function MedicationArt({ medicine, size = 'md' }) {
  const dimensoes = size === 'lg' ? { w: 720, h: 560 } : size === 'sm' ? { w: 200, h: 160 } : { w: 520, h: 400 }
  return (
    <SmartImage
      src={urlMedicamento(medicine, dimensoes)}
      tipo="medicamento"
      rotulo={medicine?.nome}
      alt={medicine?.nome || 'Medicamento'}
      className={`med-art med-art--${size}`}
    />
  )
}

export function HeroArtwork() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="hero-art__glow" />
      <div className="hero-art__card hero-art__card--one">
        <span className="hero-art__icon"><Pill size={44} /></span>
        <b>Losartana 50mg</b>
        <i />
        <i />
        <span className="hero-art__pill-tag">8:00 · 20:00</span>
      </div>
      <div className="hero-art__card hero-art__card--two">
        <span className="hero-art__icon hero-art__icon--green"><HeartPulse size={26} /></span>
        <b>Adesão 96%</b>
        <small>Tratamento em dia</small>
      </div>
      <span className="hero-art__cross hero-art__cross--one"><Cross size={62} /></span>
      <span className="hero-art__cross hero-art__cross--two"><Cross size={30} /></span>
      <span className="hero-art__float hero-art__float--pill"><Pill size={30} /></span>
      <span className="hero-art__float hero-art__float--truck"><Truck size={28} /></span>
    </div>
  )
}

export function ArtBand() {
  return (
    <div className="art-band" aria-hidden="true">
      <span>DOSE CERTA</span><i /><span>HORA CERTA</span><i /><span>CUIDADO SEGURO</span><i /><span>QUALIDADE DE VIDA</span>
    </div>
  )
}

export function CornerMark({ number }) {
  return <span className="corner-mark">{number}</span>
}

export const SYMBOLOS_SAUDE = { Pill, Cross, Stethoscope, Syringe, Activity, HeartPulse }
