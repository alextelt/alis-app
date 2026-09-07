import { useAuth } from '../AuthContext'
import { useNotificationCounts } from '../useNotificationCounts'

const ONGLETS = [
  {
    id: 'quetes',
    label: 'Quêtes',
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />,
  },
  {
    id: 'alis',
    label: 'Alis',
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  },
  {
    id: 'outils',
    label: 'Outils',
    icon: <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>,
  },
  {
    id: 'profil',
    label: 'Profil',
    icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  },
]

const BADGES_PAR_ONGLET = {
  profil: 'demandesAmisEnAttente',
}

export default function BottomNav({ ecranActif, onChangerEcran }) {
  const { user, estAdmin } = useAuth()
  const { demandesAmisEnAttente, elementsAdminEnAttente } = useNotificationCounts(user, estAdmin)

  const compteurs = { demandesAmisEnAttente }

  return (
    <nav className="bottom-nav">
      {ONGLETS.map((onglet) => {
        const badge = BADGES_PAR_ONGLET[onglet.id] ? compteurs[BADGES_PAR_ONGLET[onglet.id]] : 0
        return (
          <button
            key={onglet.id}
            className={`nav-item ${ecranActif === onglet.id ? 'active' : ''}`}
            onClick={() => onChangerEcran(onglet.id)}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {onglet.icon}
            </svg>
            {onglet.label}
            {badge > 0 && <span className="nav-badge">{badge}</span>}
          </button>
        )
      })}

      {estAdmin && (
        <button
          className={`nav-item ${ecranActif === 'admin' ? 'active' : ''}`}
          onClick={() => onChangerEcran('admin')}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" />
          </svg>
          Admin
          {elementsAdminEnAttente > 0 && <span className="nav-badge">{elementsAdminEnAttente}</span>}
        </button>
      )}
    </nav>
  )
}
