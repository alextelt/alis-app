import { useState } from 'react'
import LanceurDes from '../components/LanceurDes'
import PremierJoueurPicker from '../components/PremierJoueurPicker'
import CompteurPoints from '../components/CompteurPoints'
import DessinRapide from '../components/DessinRapide'
import ChronoTour from '../components/ChronoTour'
import './OutilsScreen.css'

export default function OutilsScreen() {
  const [desOuvert, setDesOuvert] = useState(false)
  const [pickerOuvert, setPickerOuvert] = useState(false)
  const [compteurOuvert, setCompteurOuvert] = useState(false)
  const [dessinOuvert, setDessinOuvert] = useState(false)
  const [chronoOuvert, setChronoOuvert] = useState(false)

  return (
    <>
      <div className="page-content">
        <div className="section-title">Outils</div>
        <div className="tool-grid">
          <button className="tool-grid-btn" onClick={() => setDesOuvert(true)} type="button">
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

          <button className="tool-grid-btn" onClick={() => setChronoOuvert(true)} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tool-grid-icon">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span className="tool-grid-label">Chrono de tour</span>
          </button>
        </div>
      </div>

      {desOuvert && <LanceurDes onFermer={() => setDesOuvert(false)} />}
      {pickerOuvert && <PremierJoueurPicker onFermer={() => setPickerOuvert(false)} />}
      {compteurOuvert && <CompteurPoints onFermer={() => setCompteurOuvert(false)} />}
      {dessinOuvert && <DessinRapide onFermer={() => setDessinOuvert(false)} />}
      {chronoOuvert && <ChronoTour onFermer={() => setChronoOuvert(false)} />}
    </>
  )
}
