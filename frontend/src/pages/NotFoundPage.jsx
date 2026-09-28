import { ArrowLeft, Compass } from 'lucide-react'
import { LinkButton } from '../components/ui'

export default function NotFoundPage() {
  return (
    <section className="not-found page-container">
      <span><Compass size={44} /></span>
      <b>404</b>
      <h1>Esta página saiu da composição.</h1>
      <p>O endereço pode ter mudado ou não existe.</p>
      <LinkButton to="/" icon={ArrowLeft} iconAfter={false}>Voltar ao início</LinkButton>
    </section>
  )
}
