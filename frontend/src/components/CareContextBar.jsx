import { useEffect, useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Link } from '../context/RouterContext'

export default function CareContextBar() {
  const { user, activePatientId, setActivePatientId } = useAuth()
  const [dependents, setDependents] = useState([])

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    authApi
      .listarDependentes(user.id)
      .then((items) => {
        if (active && Array.isArray(items)) setDependents(items)
      })
      .catch(() => {
        if (active) setDependents([])
      })
    return () => {
      active = false
    }
  }, [user?.id])

  if (!user?.id) return null

  const selected = [user, ...dependents].find((item) => String(item.id) === String(activePatientId)) || user

  return (
    <div className="care-context">
      <div className="page-container care-context__inner">
        <div className="care-context__label">
          <Users size={16} />
          <span>Visualizando dados de</span>
        </div>
        <label className="care-context__select">
          <span className="sr-only">Selecionar paciente</span>
          <select value={selected?.id || ''} onChange={(event) => setActivePatientId(Number(event.target.value))}>
            <option value={user.id}>{user.nome} (minha conta)</option>
            {dependents.map((patient) => <option key={patient.id} value={patient.id}>{patient.nome}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>
        {dependents.length > 0 && <Link to="/rede" className="care-context__link">Gerenciar rede</Link>}
      </div>
    </div>
  )
}
