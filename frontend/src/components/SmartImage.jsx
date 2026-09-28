import { useEffect, useState } from 'react'
import { ilustracao } from '../lib/images'

/**
 * Imagem inteligente: usa a foto enviada ao Cloudinary e, se ela falhar (404,
 * arquivo removido ou ainda não enviada), cai na ilustração gerada pela API.
 */
export default function SmartImage({
  src,
  alt = '',
  tipo = 'medicamento',
  rotulo = '',
  className = '',
  width,
  height,
  loading = 'lazy',
  ...props
}) {
  const inicial = src || ilustracao(tipo, rotulo || alt)
  const [atual, setAtual] = useState(inicial)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setAtual(src || ilustracao(tipo, rotulo || alt))
    setFalhou(false)
  }, [src, tipo, rotulo, alt])

  return (
    <img
      src={atual}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      onError={() => {
        if (!falhou) {
          setFalhou(true)
          setAtual(ilustracao(tipo, rotulo || alt))
        }
      }}
      {...props}
    />
  )
}
