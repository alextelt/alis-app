import { useEffect, useRef, useState } from 'react'
import './EquipesPicker.css'

const COULEURS_EQUIPES = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0']
const COULEUR_NEUTRE = 'var(--gold-bright)'
const NOMBRES_EQUIPES = [2, 3, 4]

const DUREE_ATTENTE = 1000
const DUREE_SUSPENSE = 800
const INTERVALLE_SUSPENSE = 100

export default function EquipesPicker({ onFermer }) {
  const [etape, setEtape] = useState('parametres')
  const [nbEquipes, setNbEquipes] = useState(2)
  const [touches, setTouches] = useState([])
  const [phase, setPhase] = useState('attente')
  const [indexSurbrillance, setIndexSurbrillance] = useState(0)
  const touchesRef = useRef([])

  useEffect(() => {
    touchesRef.current = touches
  }, [touches])

  function gererTouchStart(e) {
    if (etape !== 'jeu' || phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = [
          ...suivant,
          { id: touch.identifier, x: touch.clientX, y: touch.clientY, equipeIndex: null },
        ]
      }
      return suivant
    })
  }

  function gererTouchMove(e) {
    if (etape !== 'jeu' || phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = suivant.map((t) => (t.id === touch.identifier ? { ...t, x: touch.clientX, y: touch.clientY } : t))
      }
      return suivant
    })
  }

  function gererTouchFin(e) {
    if (etape !== 'jeu' || phase !== 'attente') return
    setTouches((prev) => {
      let suivant = prev
      for (const touch of e.changedTouches) {
        suivant = suivant.filter((t) => t.id !== touch.identifier)
      }
      return suivant
    })
  }

  // Dès que le nombre de doigts requis est posé, lance le compte à rebours avant le suspense
  useEffect(() => {
    if (etape !== 'jeu' || phase !== 'attente' || touches.length < nbEquipes) return
    const timeout = setTimeout(() => setPhase('suspense'), DUREE_ATTENTE)
    return () => clearTimeout(timeout)
  }, [etape, phase, touches.length, nbEquipes])

  // Fait clignoter les doigts à tour de rôle puis répartit les équipes
  useEffect(() => {
    if (phase !== 'suspense') return
    setIndexSurbrillance(0)
    const interval = setInterval(() => {
      setIndexSurbrillance((i) => (i + 1) % touchesRef.current.length)
    }, INTERVALLE_SUSPENSE)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      const melangees = [...touchesRef.current].sort(() => Math.random() - 0.5)
      const equipeParId = {}
      melangees.forEach((t, i) => {
        equipeParId[t.id] = i % nbEquipes
      })
      setTouches((prev) => prev.map((t) => ({ ...t, equipeIndex: equipeParId[t.id] ?? null })))
      setPhase('resultat')
    }, DUREE_SUSPENSE)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase, nbEquipes])

  function commencerJeu() {
    setTouches([])
    setPhase('attente')
    setEtape('jeu')
  }

  function recommencer() {
    setTouches([])
    setPhase('attente')
  }

  const doigtsManquants = nbEquipes - touches.length

  return (
    <div
      className="eq-overlay"
      onTouchStart={gererTouchStart}
      onTouchMove={gererTouchMove}
      onTouchEnd={gererTouchFin}
      onTouchCancel={gererTouchFin}
    >
      <button className="eq-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      {etape === 'parametres' && (
        <div className="eq-parametres">
          <h2 className="eq-parametres-title">Combien d'équipes ?</h2>
          <div className="eq-nb-row">
            {NOMBRES_EQUIPES.map((n) => (
              <button
                key={n}
                className={`eq-nb-btn ${nbEquipes === n ? 'active' : ''}`}
                onClick={() => setNbEquipes(n)}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
          <button className="eq-primary-btn" onClick={commencerJeu} type="button">
            Suivant
          </button>
        </div>
      )}

      {etape === 'jeu' && (
        <>
          {phase === 'resultat' && (
            <div className="eq-legende">
              {Array.from({ length: nbEquipes }, (_, i) => (
                <div key={i} className="eq-legende-item">
                  <span
                    className="eq-legende-dot"
                    style={{ background: COULEURS_EQUIPES[i % COULEURS_EQUIPES.length] }}
                  />
                  Équipe {i + 1}
                </div>
              ))}
            </div>
          )}

          {touches.map((t, i) => {
            const estEnAttentePulse = phase === 'attente' && touches.length >= nbEquipes
            const estActif = phase === 'suspense' && i === indexSurbrillance
            const couleur =
              phase === 'resultat' && t.equipeIndex !== null
                ? COULEURS_EQUIPES[t.equipeIndex % COULEURS_EQUIPES.length]
                : COULEUR_NEUTRE

            return (
              <div key={t.id} className="eq-dot-wrap" style={{ left: t.x, top: t.y }}>
                <div
                  className={[
                    'eq-dot',
                    estEnAttentePulse ? 'eq-dot-attente' : '',
                    estActif ? 'eq-dot-actif' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ background: couleur }}
                />
              </div>
            )
          })}

          {phase === 'attente' && touches.length < nbEquipes && (
            <div className="eq-message">
              Encore {doigtsManquants} doigt{doigtsManquants > 1 ? 's' : ''} nécessaire
              {doigtsManquants > 1 ? 's' : ''}
            </div>
          )}

          {phase === 'attente' && touches.length >= nbEquipes && (
            <div className="eq-message">Ne bougez plus...</div>
          )}

          {phase === 'resultat' && (
            <div className="eq-result">
              <button className="eq-restart-btn" onClick={recommencer} type="button">
                Recommencer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
