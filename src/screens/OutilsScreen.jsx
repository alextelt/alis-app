import { useState } from 'react'
import PremierJoueurPicker from '../components/PremierJoueurPicker'
import CompteurPoints from '../components/CompteurPoints'
import DessinRapide from '../components/DessinRapide'
import './OutilsScreen.css'

const FACES_RAPIDES = [4, 6, 8, 10, 12, 20]

export default function OutilsScreen() {
  const [groupesDes, setGroupesDes] = useState([])
  const [facesPersonnalise, setFacesPersonnalise] = useState('')
  const [resultats, setResultats] = useState([])
  const [enAnimation, setEnAnimation] = useState(false)
  const [pickerOuvert, setPickerOuvert] = useState(false)
  const [compteurOuvert, setCompteurOuvert] = useState(false)
  const [dessinOuvert, setDessinOuvert] = useState(false)
  const [desOuvert, setDesOuvert] = useState(false)

  function ajouterGroupe(faces, quantite = 1) {
    setResultats([])
    setGroupesDes((groupes) => {
      const existant = groupes.find((g) => g.faces === faces)
      if (existant) {
        return groupes.map((g) => (g.faces === faces ? { ...g, nombre: g.nombre + quantite } : g))
      }
      return [...groupes, { id: faces, faces, nombre: quantite }]
    })
  }

  function ajouterPersonnalise() {
    const faces = Math.min(1000, Math.max(2, parseInt(facesPersonnalise, 10) || 0))
    if (!faces || faces < 2) return
    ajouterGroupe(faces)
    setFacesPersonnalise('')
  }

  function ajusterNombre(faces, delta) {
    setResultats([])
    setGroupesDes((groupes) =>
      groupes
        .map((g) => (g.faces === faces ? { ...g, nombre: g.nombre + delta } : g))
        .filter((g) => g.nombre > 0)
    )
  }

  function retirerGroupe(faces) {
    setResultats([])
    setGroupesDes((groupes) => groupes.filter((g) => g.faces !== faces))
  }

  function lancer() {
    if (groupesDes.length === 0) return
    setEnAnimation(true)
    setTimeout(() => {
      const nouveaux = groupesDes.map((g) => ({
        faces: g.faces,
        valeurs: Array.from({ length: g.nombre }, () => Math.floor(Math.random() * g.faces) + 1),
      }))
      setResultats(nouveaux)
      setEnAnimation(false)
    }, 350)
  }

  const totalGeneral = resultats.reduce(
    (s, g) => s + g.valeurs.reduce((a, b) => a + b, 0),
    0
  )

  return (
    <div className="page-content">
      <div className="section-title">Outils</div>
      <div className="tool-grid">
        <button
          className={`tool-grid-btn ${desOuvert ? 'active' : ''}`}
          onClick={() => setDesOuvert((v) => !v)}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tool-grid-icon">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          <span className="tool-grid-label">Lanceur de dés</span>
        </button>

        <button className="tool-grid-btn" onClick={() => setPickerOuvert(true)} type="button">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tool-grid-icon">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          <span className="tool-grid-label">Premier joueur</span>
        </button>

        <button className="tool-grid-btn" onClick={() => setCompteurOuvert(true)} type="button">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tool-grid-icon">
            <line x1="7" y1="7" x2="7" y2="13" />
            <line x1="4" y1="10" x2="10" y2="10" />
            <line x1="14" y1="14" x2="20" y2="14" />
          </svg>
          <span className="tool-grid-label">Compteur de points</span>
        </button>

        <button className="tool-grid-btn" onClick={() => setDessinOuvert(true)} type="button">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tool-grid-icon">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="tool-grid-label">Dessin rapide</span>
        </button>
      </div>

      {desOuvert && (
        <>
          <div className="dice-setting-label">Ajouter des dés</div>
          <div className="dice-quick-row">
            {FACES_RAPIDES.map((f) => (
              <button key={f} className="dice-type-btn" onClick={() => ajouterGroupe(f)} type="button">
                d{f}
              </button>
            ))}
          </div>
          <div className="dice-custom-row">
            <input
              type="number"
              min={2}
              max={1000}
              placeholder="Dé personnalisé (ex: 72)"
              value={facesPersonnalise}
              onChange={(e) => setFacesPersonnalise(e.target.value)}
            />
            <button
              className="dice-custom-add-btn"
              onClick={ajouterPersonnalise}
              disabled={!facesPersonnalise}
              type="button"
            >
              Ajouter
            </button>
          </div>

          <div className="section-title">Dés à lancer</div>
          {groupesDes.length === 0 ? (
            <div className="empty-state">Ajoute des dés ci-dessus pour commencer.</div>
          ) : (
            <div className="dice-groups-list">
              {groupesDes.map((g) => (
                <div key={g.faces} className="dice-group-card">
                  <div className="dice-group-label">d{g.faces}</div>
                  <div className="dice-group-controls">
                    <button
                      className="dice-stepper-btn"
                      onClick={() => ajusterNombre(g.faces, -1)}
                      type="button"
                    >
                      −
                    </button>
                    <span className="dice-stepper-value">{g.nombre}</span>
                    <button
                      className="dice-stepper-btn"
                      onClick={() => ajusterNombre(g.faces, 1)}
                      type="button"
                    >
                      +
                    </button>
                    <button
                      className="dice-group-remove"
                      onClick={() => retirerGroupe(g.faces)}
                      type="button"
                      aria-label={`Retirer les d${g.faces}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="dice-launch-btn"
            onClick={lancer}
            disabled={enAnimation || groupesDes.length === 0}
            type="button"
          >
            {enAnimation ? 'Lancement...' : 'Lancer'}
          </button>

          {(enAnimation || resultats.length > 0) && (
            <div className="dice-results">
              {(enAnimation ? groupesDes : resultats).map((g) => (
                <div key={g.faces} className={`dice-result-card ${enAnimation ? 'rolling' : ''}`}>
                  <div className="dice-result-type">d{g.faces}</div>
                  <div className="dice-result-values">
                    {enAnimation ? '🎲' : g.valeurs.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!enAnimation && resultats.length > 0 && (
            <div className="dice-total">Total : <span>{totalGeneral}</span></div>
          )}
        </>
      )}

      {pickerOuvert && <PremierJoueurPicker onFermer={() => setPickerOuvert(false)} />}
      {compteurOuvert && <CompteurPoints onFermer={() => setCompteurOuvert(false)} />}
      {dessinOuvert && <DessinRapide onFermer={() => setDessinOuvert(false)} />}
    </div>
  )
}
