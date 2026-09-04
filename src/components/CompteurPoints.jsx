import { useState } from 'react'
import './CompteurPoints.css'

const COULEURS_JOUEURS = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0', '#FF9800', '#009688', '#E91E63', '#3F51B5']
const NOMBRES_RAPIDES = [1, 2, 3, 4, 5, 6, 7]

export default function CompteurPoints({ onFermer }) {
  const [etape, setEtape] = useState('parametres')
  const [nombreJoueurs, setNombreJoueurs] = useState(4)
  const [nomPartie, setNomPartie] = useState('')
  const [joueurs, setJoueurs] = useState([])

  function incrementerNombre() {
    setNombreJoueurs((n) => Math.min(12, n + 1))
  }

  function validerParametres() {
    const nouveauxJoueurs = Array.from({ length: nombreJoueurs }, (_, i) => ({
      id: i,
      nom: `Joueur ${i + 1}`,
      couleur: COULEURS_JOUEURS[i % COULEURS_JOUEURS.length],
      score: 0,
    }))
    setJoueurs(nouveauxJoueurs)
    setEtape('noms')
  }

  function renommerJoueur(id, nom) {
    setJoueurs((prev) => prev.map((j) => (j.id === id ? { ...j, nom } : j)))
  }

  function ajusterScore(id, delta) {
    setJoueurs((prev) => prev.map((j) => (j.id === id ? { ...j, score: j.score + delta } : j)))
  }

  function nouvellePartie() {
    setJoueurs([])
    setNomPartie('')
    setNombreJoueurs(4)
    setEtape('parametres')
  }

  return (
    <div className="cp-overlay">
      <button className="cp-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      {etape === 'parametres' && (
        <div className="cp-step">
          <h2 className="cp-title">Nouvelle partie</h2>

          <div className="cp-field-label">Nombre de participants</div>
          <div className="cp-nombre-grid">
            {NOMBRES_RAPIDES.map((n) => (
              <button
                key={n}
                className={`cp-nombre-btn ${nombreJoueurs === n ? 'active' : ''}`}
                onClick={() => setNombreJoueurs(n)}
                type="button"
              >
                {n}
              </button>
            ))}
            <button
              className={`cp-nombre-btn ${nombreJoueurs > 7 ? 'active' : ''}`}
              onClick={incrementerNombre}
              disabled={nombreJoueurs >= 12}
              type="button"
            >
              {nombreJoueurs > 7 ? nombreJoueurs : '+'}
            </button>
          </div>

          <div className="cp-field-label">Nom de la partie (optionnel)</div>
          <input
            type="text"
            className="cp-input"
            placeholder="Ex: Soirée jeux"
            value={nomPartie}
            onChange={(e) => setNomPartie(e.target.value)}
          />

          <button className="cp-primary-btn" onClick={validerParametres} type="button">
            Suivant
          </button>
        </div>
      )}

      {etape === 'noms' && (
        <div className="cp-step">
          <button className="cp-back-btn" onClick={() => setEtape('parametres')} type="button">
            ← Retour
          </button>

          <h2 className="cp-title">Les joueurs</h2>

          <div className="cp-noms-list">
            {joueurs.map((j) => (
              <div key={j.id} className="cp-nom-row">
                <span className="cp-nom-dot" style={{ background: j.couleur }} />
                <input
                  type="text"
                  className="cp-input cp-nom-input"
                  value={j.nom}
                  onChange={(e) => renommerJoueur(j.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="cp-primary-btn" onClick={() => setEtape('jeu')} type="button">
            Commencer la partie
          </button>
        </div>
      )}

      {etape === 'jeu' && (
        <div className="cp-step cp-step-jeu">
          <div className="cp-jeu-header">
            <button className="cp-jeu-header-btn" onClick={nouvellePartie} type="button">
              Nouvelle partie
            </button>
            {nomPartie && <div className="cp-jeu-title">{nomPartie}</div>}
          </div>

          <div className="cp-scores-grid">
            {joueurs.map((j) => (
              <div key={j.id} className="cp-score-card" style={{ background: j.couleur }}>
                <div className="cp-score-name">{j.nom}</div>
                <div className="cp-score-buttons">
                  <button onClick={() => ajusterScore(j.id, -10)} type="button">−10</button>
                  <button onClick={() => ajusterScore(j.id, -5)} type="button">−5</button>
                  <button onClick={() => ajusterScore(j.id, -1)} type="button">−1</button>
                </div>
                <div className="cp-score-value">{j.score}</div>
                <div className="cp-score-buttons">
                  <button onClick={() => ajusterScore(j.id, 1)} type="button">+1</button>
                  <button onClick={() => ajusterScore(j.id, 5)} type="button">+5</button>
                  <button onClick={() => ajusterScore(j.id, 10)} type="button">+10</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
