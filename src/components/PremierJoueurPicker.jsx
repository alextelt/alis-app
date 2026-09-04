import { useEffect, useRef, useState } from 'react'
import './PremierJoueurPicker.css'

const COULEURS_JOUEURS = ['#C9598A', '#4A8AA8', '#A9843F', '#7B4B9E', '#4A5D3A', '#598AC9', '#59C9A8', '#7A3131', '#3E7A9E', '#D4AF6A']

const DUREE_ATTENTE = 2500
const DUREE_SUSPENSE = 1200
const INTERVALLE_SUSPENSE = 100

function prochaineCouleur(touchesActuelles) {
  const utilisees = new Set(touchesActuelles.map((t) => t.couleur))
  const disponible = COULEURS_JOUEURS.find((c) => !utilisees.has(c))
  return disponible || COULEURS_JOUEURS[touchesActuelles.length % COULEURS_JOUEURS.length]
}

// Choisit du texte blanc ou noir selon la luminosité de la couleur de fond
function couleurTexteContrastee(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1A1410' : '#FFFFFF'
}

export default function PremierJoueurPicker({ onFermer }) {
  const [touches, setTouches] = useState([])
  const [phase, setPhase] = useState('attente')
  const [gagnantId, setGagnantId] = useState(null)
  const [indexSurbrillance, setIndexSurbrillance] = useState(0)
  const touchesRef = useRef([])
  useEffect(() => {
    touchesRef.current = touches
  }, [touches])

  function gererTouchStart(e) {
    if (phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = [
          ...suivant,
          { id: touch.identifier, x: touch.clientX, y: touch.clientY, couleur: prochaineCouleur(suivant) },
        ]
      }
      return suivant
    })
  }

  function gererTouchMove(e) {
    if (phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = suivant.map((t) => (t.id === touch.identifier ? { ...t, x: touch.clientX, y: touch.clientY } : t))
      }
      return suivant
    })
  }

  function gererTouchFin(e) {
    if (phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = suivant.filter((t) => t.id !== touch.identifier)
      }
      return suivant
    })
  }

  // Dès que 2 doigts ou plus sont posés, lance le compte à rebours avant le suspense
  useEffect(() => {
    if (phase !== 'attente' || touches.length < 2) return
    const timeout = setTimeout(() => setPhase('suspense'), DUREE_ATTENTE)
    return () => clearTimeout(timeout)
  }, [phase, touches.length])

  // Fait clignoter les doigts à tour de rôle puis tire le gagnant
  useEffect(() => {
    if (phase !== 'suspense') return
    setIndexSurbrillance(0)
    const interval = setInterval(() => {
      setIndexSurbrillance((i) => (i + 1) % touchesRef.current.length)
    }, INTERVALLE_SUSPENSE)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      const actuelles = touchesRef.current
      const gagnant = actuelles[Math.floor(Math.random() * actuelles.length)]
      setGagnantId(gagnant?.id ?? null)
      setPhase('resultat')
    }, DUREE_SUSPENSE)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase])

  function recommencer() {
    setTouches([])
    setGagnantId(null)
    setPhase('attente')
  }

  const gagnant = touches.find((t) => t.id === gagnantId)
  const couleurTexte = phase === 'resultat' && gagnant ? couleurTexteContrastee(gagnant.couleur) : null

  return (
    <div
      className="pj-overlay"
      style={phase === 'resultat' && gagnant ? { background: gagnant.couleur } : undefined}
      onTouchStart={gererTouchStart}
      onTouchMove={gererTouchMove}
      onTouchEnd={gererTouchFin}
      onTouchCancel={gererTouchFin}
    >
      <button
        className="pj-close-btn"
        onClick={onFermer}
        type="button"
        aria-label="Fermer"
        style={couleurTexte ? { color: couleurTexte, borderColor: couleurTexte } : undefined}
      >
        ✕
      </button>

      {touches.map((t, i) => {
        const estActif = phase === 'suspense' && i === indexSurbrillance
        const estGagnant = phase === 'resultat' && t.id === gagnantId
        const estPerdant = phase === 'resultat' && t.id !== gagnantId
        return (
          <div key={t.id} className="pj-dot-wrap" style={{ left: t.x, top: t.y }}>
            <div
              className={[
                'pj-dot',
                estActif ? 'pj-dot-actif' : '',
                estGagnant ? 'pj-dot-gagnant' : '',
                estPerdant ? 'pj-dot-perdant' : '',
              ].filter(Boolean).join(' ')}
              style={{ background: t.couleur }}
            />
          </div>
        )
      })}

      {phase === 'attente' && touches.length < 2 && (
        <div className="pj-message">Chaque joueur pose un doigt sur l'écran</div>
      )}

      {phase === 'attente' && touches.length >= 2 && (
        <div className="pj-countdown-wrap">
          <div className="pj-message">Ne bougez plus...</div>
          <div className="pj-countdown-bar">
            <div key={touches.length} className="pj-countdown-fill" />
          </div>
        </div>
      )}

      {phase === 'resultat' && (
        <div className="pj-result">
          <div className="pj-result-text" style={couleurTexte ? { color: couleurTexte } : undefined}>
            Premier joueur !
          </div>
          <button
            className="pj-restart-btn"
            onClick={recommencer}
            type="button"
            style={couleurTexte ? { color: couleurTexte, borderColor: couleurTexte } : undefined}
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
