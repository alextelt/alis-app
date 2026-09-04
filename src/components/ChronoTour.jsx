import { useEffect, useState } from 'react'
import './ChronoTour.css'

const COULEURS_JOUEURS = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0', '#FF9800', '#009688', '#E91E63', '#3F51B5']
const NOMBRES_RAPIDES = [1, 2, 3, 4, 5, 6, 7]
const TEMPS_RAPIDES = [
  { label: '1 min', valeur: 60 },
  { label: '3 min', valeur: 180 },
  { label: '5 min', valeur: 300 },
  { label: '10 min', valeur: 600 },
]

export default function ChronoTour({ onFermer }) {
  const [etape, setEtape] = useState('parametres')
  const [mode, setMode] = useState('compte_a_rebours')
  const [nombreJoueurs, setNombreJoueurs] = useState(2)
  const [tempsInitialSecondes, setTempsInitialSecondes] = useState(300)
  const [joueurs, setJoueurs] = useState([])
  const [joueurActifIndex, setJoueurActifIndex] = useState(0)
  const [enPause, setEnPause] = useState(false)

  // Fait tourner le temps du joueur actif toutes les 100ms
  useEffect(() => {
    if (etape !== 'jeu' || enPause) return
    const interval = setInterval(() => {
      setJoueurs((prev) =>
        prev.map((j, i) => {
          if (i !== joueurActifIndex) return j
          if (mode === 'compte_a_rebours') {
            return { ...j, tempsRestant: Math.max(0, j.tempsRestant - 0.1) }
          }
          return { ...j, tempsEcoule: j.tempsEcoule + 0.1 }
        })
      )
    }, 100)
    return () => clearInterval(interval)
  }, [etape, enPause, joueurActifIndex, mode])

  function incrementerNombre() {
    setNombreJoueurs((n) => Math.min(8, n + 1))
  }

  function validerParametres() {
    const nouveauxJoueurs = Array.from({ length: nombreJoueurs }, (_, i) => ({
      id: i,
      nom: `Joueur ${i + 1}`,
      couleur: COULEURS_JOUEURS[i % COULEURS_JOUEURS.length],
      nombreTours: 0,
      ...(mode === 'compte_a_rebours' ? { tempsRestant: tempsInitialSecondes } : { tempsEcoule: 0 }),
    }))
    setJoueurs(nouveauxJoueurs)
    setEtape('noms')
  }

  function renommerJoueur(id, nom) {
    setJoueurs((prev) => prev.map((j) => (j.id === id ? { ...j, nom } : j)))
  }

  function commencer() {
    setJoueurActifIndex(0)
    setEnPause(false)
    setEtape('jeu')
  }

  function passerAuSuivant() {
    setJoueurs((prev) =>
      prev.map((j, i) => (i === joueurActifIndex ? { ...j, nombreTours: j.nombreTours + 1 } : j))
    )
    setJoueurActifIndex((i) => (i + 1) % joueurs.length)
  }

  function reinitialiser() {
    if (!confirm('Réinitialiser tous les temps ?')) return
    setJoueurs((prev) =>
      prev.map((j) => ({
        ...j,
        nombreTours: 0,
        ...(mode === 'compte_a_rebours' ? { tempsRestant: tempsInitialSecondes } : { tempsEcoule: 0 }),
      }))
    )
    setJoueurActifIndex(0)
    setEnPause(false)
  }

  function tempsDe(j) {
    return mode === 'compte_a_rebours' ? j.tempsRestant : j.tempsEcoule
  }

  function moyenneParTour(j) {
    if (j.nombreTours === 0) return null
    const consomme = mode === 'compte_a_rebours' ? tempsInitialSecondes - j.tempsRestant : j.tempsEcoule
    return consomme / j.nombreTours
  }

  const joueurActif = joueurs[joueurActifIndex]
  const expire = mode === 'compte_a_rebours' && joueurActif && joueurActif.tempsRestant <= 0

  return (
    <div className="ct-overlay">
      <button className="ct-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      {etape === 'parametres' && (
        <div className="ct-step">
          <h2 className="ct-title">Chrono de tour</h2>

          <div className="ct-field-label">Mode</div>
          <div className="ct-mode-row">
            <button
              className={`ct-mode-btn ${mode === 'compte_a_rebours' ? 'active' : ''}`}
              onClick={() => setMode('compte_a_rebours')}
              type="button"
            >
              Compte à rebours
            </button>
            <button
              className={`ct-mode-btn ${mode === 'chrono' ? 'active' : ''}`}
              onClick={() => setMode('chrono')}
              type="button"
            >
              Chrono
            </button>
          </div>

          {mode === 'compte_a_rebours' && (
            <>
              <div className="ct-field-label">Temps par joueur</div>
              <div className="ct-temps-row">
                {TEMPS_RAPIDES.map((t) => (
                  <button
                    key={t.valeur}
                    className={`ct-temps-btn ${tempsInitialSecondes === t.valeur ? 'active' : ''}`}
                    onClick={() => setTempsInitialSecondes(t.valeur)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="ct-field-label">Nombre de joueurs</div>
          <div className="ct-nombre-grid">
            {NOMBRES_RAPIDES.map((n) => (
              <button
                key={n}
                className={`ct-nombre-btn ${nombreJoueurs === n ? 'active' : ''}`}
                onClick={() => setNombreJoueurs(n)}
                type="button"
              >
                {n}
              </button>
            ))}
            <button
              className={`ct-nombre-btn ${nombreJoueurs > 7 ? 'active' : ''}`}
              onClick={incrementerNombre}
              disabled={nombreJoueurs >= 8}
              type="button"
            >
              {nombreJoueurs > 7 ? nombreJoueurs : '+'}
            </button>
          </div>

          <button className="ct-primary-btn" onClick={validerParametres} type="button">
            Suivant
          </button>
        </div>
      )}

      {etape === 'noms' && (
        <div className="ct-step">
          <button className="ct-back-btn" onClick={() => setEtape('parametres')} type="button">
            ← Retour
          </button>

          <h2 className="ct-title">Les joueurs</h2>

          <div className="ct-noms-list">
            {joueurs.map((j) => (
              <div key={j.id} className="ct-nom-row">
                <span className="ct-nom-dot" style={{ background: j.couleur }} />
                <input
                  type="text"
                  className="ct-input"
                  value={j.nom}
                  onChange={(e) => renommerJoueur(j.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="ct-primary-btn" onClick={commencer} type="button">
            Commencer
          </button>
        </div>
      )}

      {etape === 'jeu' && joueurActif && (
        <div className="ct-step-jeu">
          <div className="ct-jeu-header">
            <button className="ct-jeu-header-btn" onClick={() => setEnPause((p) => !p)} type="button">
              {enPause ? '▶ Reprendre' : '⏸ Pause'}
            </button>
            <button className="ct-jeu-header-btn ct-jeu-header-btn-danger" onClick={reinitialiser} type="button">
              Réinitialiser
            </button>
          </div>

          <div
            className={`ct-zone ${expire ? 'ct-zone-expire' : ''}`}
            style={{ background: joueurActif.couleur, '--zone-color': joueurActif.couleur }}
            onClick={passerAuSuivant}
            role="button"
            tabIndex={0}
          >
            <div className="ct-zone-name">{joueurActif.nom}</div>
            <div className="ct-zone-time">{formaterTemps(tempsDe(joueurActif))}</div>
            <div className="ct-zone-hint">Touche l'écran pour passer au joueur suivant</div>
          </div>

          <div className="ct-others-list">
            {joueurs.map((j, i) => {
              if (i === joueurActifIndex) return null
              const moyenne = moyenneParTour(j)
              return (
                <div key={j.id} className="ct-other-row">
                  <span className="ct-other-dot" style={{ background: j.couleur }} />
                  <span className="ct-other-name">{j.nom}</span>
                  <span className="ct-other-time">{formaterTemps(tempsDe(j))}</span>
                  <span className="ct-other-moyenne">
                    {moyenne !== null ? `${formaterTemps(moyenne)}/tour` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formaterTemps(secondes) {
  const total = Math.max(0, Math.round(secondes))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
