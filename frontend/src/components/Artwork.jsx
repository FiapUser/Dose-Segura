import { Activity, Cross, HeartPulse, Pill, Plus, Stethoscope, Syringe, Truck } from 'lucide-react'
import { urlMedicamento } from '../lib/images'
import SmartImage from './SmartImage'

/** Marca Dose Segura: cápsula com cruz de saúde. */
export function DoseLogo({ compact = false, inverted = false }) {
  return (
    <span className={`dose-logo ${compact ? 'dose-logo--compact' : ''} ${inverted ? 'dose-logo--inverted' : ''}`}>
      <span className="dose-logo__mark" aria-hidden="true">
        <span className="dose-logo__capsule"><i /></span>
        <span className="dose-logo__cross"><Plus size={11} strokeWidth={3.4} /></span>
      </span>
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
