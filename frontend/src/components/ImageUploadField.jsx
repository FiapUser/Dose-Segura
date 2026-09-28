import { useRef, useState } from 'react'
import { Camera, ImageUp, LoaderCircle, Trash2, Upload } from 'lucide-react'
import { imagensApi } from '../services/api'
import { errorMessage } from '../lib/format'
import { ilustracao } from '../lib/images'
import SmartImage from './SmartImage'

/**
 * Campo de upload de imagem (Cloudinary).
 *
 * Regra de permissão (validada também no backend):
 * - master admin: qualquer imagem da rede;
 * - conta de fornecedor (CNPJ): logo do fornecedor e fotos dos medicamentos;
 * - conta de farmácia (CNPJ): foto da unidade;
 * - paciente/cuidador (CPF): apenas a própria foto de perfil.
 */
export default function ImageUploadField({
  tipo,
  id,
  nome,
  valor,
  rotulo = 'Foto',
  dica = 'JPG, PNG ou WEBP com até 5 MB.',
  permitidos = ['PERFIL'],
  onUploaded,
  onRemoved,
}) {
  const inputRef = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState(valor || '')
  const podeEnviar = permitidos.includes(tipo)

  const selecionar = async (event) => {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5 MB.')
      return
    }
    setErro('')
    setEnviando(true)
    try {
      const resultado = await imagensApi.enviar({ tipo, id, nome, arquivo })
      setPreview(resultado.url)
      onUploaded?.(resultado)
    } catch (requestError) {
      setErro(errorMessage(requestError))
    } finally {
      setEnviando(false)
    }
  }

  const remover = async () => {
    if (!id) {
      setPreview('')
      onRemoved?.()
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await imagensApi.remover(tipo, id)
      setPreview('')
      onRemoved?.()
    } catch (requestError) {
      setErro(errorMessage(requestError))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="upload-field">
      <div className="upload-field__preview">
        <SmartImage
          src={preview || ilustracao(tipo === 'PERFIL' ? 'perfil' : tipo.toLowerCase(), rotulo)}
          tipo={tipo === 'PERFIL' ? 'perfil' : tipo.toLowerCase()}
          rotulo={rotulo}
          alt={rotulo}
          className="upload-field__image"
        />
        {enviando && (
          <span className="upload-field__overlay">
            <LoaderCircle className="spin" size={22} /> Enviando…
          </span>
        )}
      </div>

      <div className="upload-field__actions">
        <p className="upload-field__label">
          <Camera size={15} /> {rotulo}
        </p>
        {podeEnviar ? (
          <>
            <button type="button" className="store-button store-button--soft" onClick={() => inputRef.current?.click()} disabled={enviando}>
              <Upload size={16} /> {preview ? 'Trocar imagem' : 'Enviar imagem'}
            </button>
            {preview && (
              <button type="button" className="store-button store-button--danger" onClick={remover} disabled={enviando}>
                <Trash2 size={16} /> Remover
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={selecionar} hidden />
            <small className="upload-field__hint">{dica}</small>
          </>
        ) : (
          <p className="upload-field__blocked">
            <ImageUp size={15} /> O envio de imagens deste tipo não faz parte do seu perfil de conta.
          </p>
        )}
        {erro && <p className="upload-field__error">{erro}</p>}
      </div>
    </div>
  )
}
