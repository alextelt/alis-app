import { useState } from 'react'
import { AVATAR_CREATURES, AVATAR_COLORS, AVATAR_BADGES, parserAvatar } from '../utils'

export default function AvatarPicker({ avatarActuel, onChoisir, onFermer, enCours }) {
  const avatarParse = parserAvatar(avatarActuel)
  const [creature, setCreature] = useState(avatarParse?.creature || AVATAR_CREATURES[0])
  const [bg, setBg] = useState(avatarParse?.bg || AVATAR_COLORS[0])
  const [badge, setBadge] = useState(avatarParse?.badge || null)

  function valider() {
    onChoisir(`${creature}|${bg}|${badge || ''}`)
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="modal avatar-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Choisis ton avatar</h2>

        <div className="avatar-preview-wrap">
          <div className="avatar-preview-badge-wrap">
            <div className="avatar-preview" style={{ background: bg }}>
              {creature}
            </div>
            {badge && <div className="avatar-preview-badge">{badge}</div>}
          </div>
        </div>

        <div className="avatar-section-title">Créature</div>
        <div className="avatar-grid">
          {AVATAR_CREATURES.map((c) => (
            <button
              key={c}
              className={`avatar-choice ${creature === c ? 'selected' : ''}`}
              style={{ background: bg }}
              onClick={() => setCreature(c)}
              disabled={enCours}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="avatar-section-title">Couleur</div>
        <div className="avatar-color-row">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              className={`avatar-color-choice ${bg === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setBg(c)}
              disabled={enCours}
              type="button"
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>

        <div className="avatar-section-title">Badge (optionnel)</div>
        <div className="avatar-grid">
          {AVATAR_BADGES.map((b) => (
            <button
              key={b ?? 'aucun'}
              className={`avatar-choice ${badge === b ? 'selected' : ''} ${b === null ? 'avatar-choice-none' : ''}`}
              onClick={() => setBadge(b)}
              disabled={enCours}
              type="button"
            >
              {b === null ? 'Aucun' : b}
            </button>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-annuler" onClick={onFermer} disabled={enCours} type="button">
            Annuler
          </button>
          <button className="btn-confirmer" onClick={valider} disabled={enCours} type="button">
            {enCours ? '...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
