import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './ReinitialiserMdpScreen.css'

export default function ReinitialiserMdpScreen() {
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmationMdp, setConfirmationMdp] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [succes, setSucces] = useState(false)

  async function gererValidation(e) {
    e.preventDefault()
    setErreur(null)

    if (nouveauMdp.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    if (nouveauMdp !== confirmationMdp) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setChargement(true)
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp })
    setChargement(false)

    if (error) {
      setErreur(error.message)
      return
    }

    setSucces(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }

  return (
    <div className="app">
      <div className="login-wrap">
        <div className="brand">
          <div className="glyph">A</div>
          <h1>Alis</h1>
          <p>Choisis un nouveau mot de passe</p>
        </div>

        <div className="panel">
          {succes ? (
            <div className="notice">
              ✅ Mot de passe mis à jour. Redirection en cours...
            </div>
          ) : (
            <form onSubmit={gererValidation}>
              <div className="field">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={nouveauMdp}
                  onChange={(e) => setNouveauMdp(e.target.value)}
                  required
                />
                <div className="hint">6 caractères minimum</div>
              </div>
              <div className="field">
                <label>Confirmation</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmationMdp}
                  onChange={(e) => setConfirmationMdp(e.target.value)}
                  required
                />
              </div>
              {erreur && <div className="form-error">{erreur}</div>}
              <button type="submit" className="submit" disabled={chargement}>
                {chargement ? 'Validation...' : 'Valider'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
