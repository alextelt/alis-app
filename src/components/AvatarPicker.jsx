import { AVATARS } from '../utils'

export default function AvatarPicker({ avatarActuel, onChoisir, onFermer, enCours }) {
  return (
    <div className="overlay" onClick={onFermer}>
      <div className="modal avatar-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Choisis ton avatar</h2>
        <div className="avatar-grid">
          {AVATARS.map((av, i) => {
            const code = `${av.emoji}|${av.bg}`
            const selectionne = avatarActuel === code
            return (
              <button
                key={i}
                className={`avatar-choice ${selectionne ? 'selected' : ''}`}
                style={{ background: av.bg }}
                onClick={() => onChoisir(code)}
                disabled={enCours}
              >
                {av.emoji}
              </button>
            )
          })}
        </div>
        <button className="btn-annuler" style={{ width: '100%', marginTop: 16 }} onClick={onFermer}>
          Fermer
        </button>
      </div>
    </div>
  )
}
