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
      <div className="section-title">Choisir le premier joueur</div>
      <button className="tool-launch-card" onClick={() => setPickerOuvert(true)} type="button">
        <div className="tool-launch-card-title">👆 Choisir le premier joueur</div>
        <div className="tool-launch-card-desc">
          Chaque joueur pose un doigt sur l'écran, le sort désigne celui qui commence.
        </div>
      </button>

      <div className="section-title">Compteur de points</div>
      <button className="tool-launch-card" onClick={() => setCompteurOuvert(true)} type="button">
        <div className="tool-launch-card-title">🔢 Compteur de points</div>
        <div className="tool-launch-card-desc">
          Crée une partie, ajoute des joueurs et suis leurs scores en temps réel.
        </div>
      </button>

      <div className="section-title">Dessin rapide</div>
      <button className="tool-launch-card" onClick={() => setDessinOuvert(true)} type="button">
        <div className="tool-launch-card-title">✏️ Dessin rapide</div>
        <div className="tool-launch-card-desc">
          Un canvas plein écran pour griffonner un schéma ou une idée au doigt.
        </div>
      </button>

      <div className="section-title">Lanceur de dés</div>

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

      {pickerOuvert && <PremierJoueurPicker onFermer={() => setPickerOuvert(false)} />}
      {compteurOuvert && <CompteurPoints onFermer={() => setCompteurOuvert(false)} />}
      {dessinOuvert && <DessinRapide onFermer={() => setDessinOuvert(false)} />}
    </div>
  )
}
