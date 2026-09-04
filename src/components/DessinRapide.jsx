import { useEffect, useRef, useState } from 'react'
import './DessinRapide.css'

const COULEURS = ['#000000', '#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA']
const TAILLE_DEFAUT = { feutre: 10, crayon: 4 }

export default function DessinRapide({ onFermer }) {
  const canvasRef = useRef(null)
  const toolbarRef = useRef(null)
  const enTrainDeDessinerRef = useRef(false)
  const dernierPointRef = useRef({ x: 0, y: 0 })

  const [outil, setOutil] = useState('feutre')
  const [taille, setTaille] = useState(TAILLE_DEFAUT.feutre)
  const [couleur, setCouleur] = useState(COULEURS[0])
  const [modeTexte, setModeTexte] = useState(false)
  const [saisieTexte, setSaisieTexte] = useState(null)

  // Redimensionne le canvas au montage pour occuper tout l'espace sous la barre d'outils
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
  }, [])

  function choisirOutil(nom) {
    setOutil(nom)
    setTaille(TAILLE_DEFAUT[nom])
  }

  function positionDepuisEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function gererPointerDown(e) {
    const { x, y } = positionDepuisEvent(e)

    if (modeTexte) {
      setSaisieTexte({ x, y, valeur: '' })
      setModeTexte(false)
      return
    }

    const canvas = canvasRef.current
    canvas.setPointerCapture(e.pointerId)
    enTrainDeDessinerRef.current = true
    dernierPointRef.current = { x, y }

    // Marque un point dès le tap, pour qu'un simple clic sans mouvement laisse une trace
    const ctx = canvas.getContext('2d')
    ctx.globalAlpha = outil === 'crayon' ? 0.7 : 1
    ctx.fillStyle = couleur
    ctx.beginPath()
    ctx.arc(x, y, taille / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function gererPointerMove(e) {
    if (!enTrainDeDessinerRef.current) return
    const { x, y } = positionDepuisEvent(e)
    const ctx = canvasRef.current.getContext('2d')

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = couleur
    ctx.lineWidth = taille
    ctx.globalAlpha = outil === 'crayon' ? 0.7 : 1

    ctx.beginPath()
    ctx.moveTo(dernierPointRef.current.x, dernierPointRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    dernierPointRef.current = { x, y }
  }

  function gererPointerFin(e) {
    enTrainDeDessinerRef.current = false
    const canvas = canvasRef.current
    if (canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }
  }

  function validerTexte() {
    if (saisieTexte && saisieTexte.valeur.trim()) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.globalAlpha = 1
      ctx.fillStyle = couleur
      ctx.font = `${taille * 2.5}px 'Inter', sans-serif`
      ctx.textBaseline = 'middle'
      ctx.fillText(saisieTexte.valeur, saisieTexte.x, saisieTexte.y)
    }
    setSaisieTexte(null)
  }

  function effacerTout() {
    if (!confirm('Effacer tout le dessin ?')) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="dr-overlay">
      <div className="dr-toolbar" ref={toolbarRef}>
        <div className="dr-toolbar-row">
          <div className="dr-outil-group">
            <button
              className={`dr-outil-btn ${outil === 'feutre' ? 'active' : ''}`}
              onClick={() => choisirOutil('feutre')}
              type="button"
            >
              Feutre
            </button>
            <button
              className={`dr-outil-btn ${outil === 'crayon' ? 'active' : ''}`}
              onClick={() => choisirOutil('crayon')}
              type="button"
            >
              Crayon
            </button>
          </div>

          <button
            className={`dr-outil-btn ${modeTexte ? 'active' : ''}`}
            onClick={() => setModeTexte((m) => !m)}
            type="button"
            aria-label="Ajouter du texte"
          >
            T
          </button>

          <button className="dr-clear-btn" onClick={effacerTout} type="button">
            Effacer tout
          </button>

          <button className="dr-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="dr-toolbar-row">
          <div className="dr-taille-wrap">
            <input
              type="range"
              min={2}
              max={40}
              value={taille}
              onChange={(e) => setTaille(Number(e.target.value))}
              className="dr-taille-slider"
            />
            <span
              className="dr-taille-apercu"
              style={{ width: taille, height: taille, background: couleur }}
            />
          </div>

          <div className="dr-palette">
            {COULEURS.map((c) => (
              <button
                key={c}
                className={`dr-couleur-choice ${couleur === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setCouleur(c)}
                type="button"
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="dr-canvas-wrap">
        <canvas
          ref={canvasRef}
          className={`dr-canvas ${modeTexte ? 'dr-canvas-texte' : ''}`}
          onPointerDown={gererPointerDown}
          onPointerMove={gererPointerMove}
          onPointerUp={gererPointerFin}
          onPointerCancel={gererPointerFin}
        />

        {saisieTexte && (
          <input
            type="text"
            className="dr-text-input"
            style={{ left: saisieTexte.x, top: saisieTexte.y, color: couleur, fontSize: taille * 1.3 }}
            autoFocus
            value={saisieTexte.valeur}
            onChange={(e) => setSaisieTexte((s) => ({ ...s, valeur: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') validerTexte()
            }}
            onBlur={validerTexte}
          />
        )}
      </div>
    </div>
  )
}
