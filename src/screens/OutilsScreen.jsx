import { useState } from 'react'
import './OutilsScreen.css'

const TYPES_DE = [4, 6, 8, 10, 12, 20]

export default function OutilsScreen() {
  const [nbDes, setNbDes] = useState(1)
  const [typeDe, setTypeDe] = useState(6)
  const [resultats, setResultats] = useState([])
  const [enAnimation, setEnAnimation] = useState(false)

  function ajusterNbDes(delta) {
    setNbDes((n) => Math.min(6, Math.max(1, n + delta)))
  }

  function lancer() {
    setEnAnimation(true)
    setTimeout(() => {
      const nouveaux = Array.from({ length: nbDes }, () => 1 + Math.floor(Math.random() * typeDe))
      setResultats(nouveaux)
      setEnAnimation(false)
    }, 350)
  }

  const compteAffiche = enAnimation ? nbDes : resultats.length
  const total = resultats.reduce((s, v) => s + v, 0)

  return (
    <div className="page-content">
      <div className="section-title">Lanceur de dés</div>

      <div className="dice-panel">
        <div className="dice-setting-block">
          <div className="dice-setting-label">Nombre de dés</div>
          <div className="dice-stepper">
            <button
              className="dice-stepper-btn"
              onClick={() => ajusterNbDes(-1)}
              disabled={nbDes <= 1}
              type="button"
            >
              −
            </button>
            <span className="dice-stepper-value">{nbDes}</span>
            <button
              className="dice-stepper-btn"
              onClick={() => ajusterNbDes(1)}
              disabled={nbDes >= 6}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div className="dice-setting-block">
          <div className="dice-setting-label">Type de dé</div>
          <div className="dice-type-row">
            {TYPES_DE.map((t) => (
              <button
                key={t}
                className={`dice-type-btn ${typeDe === t ? 'active' : ''}`}
                onClick={() => setTypeDe(t)}
                type="button"
              >
                d{t}
              </button>
            ))}
          </div>
        </div>

        <button className="dice-launch-btn" onClick={lancer} disabled={enAnimation} type="button">
          {enAnimation ? 'Lancement...' : 'Lancer'}
        </button>
      </div>

      {compteAffiche > 0 && (
        <>
          <div className="dice-results">
            {Array.from({ length: compteAffiche }).map((_, i) => (
              <div key={i} className={`dice-result-card ${enAnimation ? 'rolling' : ''}`}>
                {enAnimation ? '🎲' : resultats[i]}
              </div>
            ))}
          </div>

          {!enAnimation && resultats.length > 1 && (
            <div className="dice-total">Total : <span>{total}</span></div>
          )}
        </>
      )}
    </div>
  )
}
