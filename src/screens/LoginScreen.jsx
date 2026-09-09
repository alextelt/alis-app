import { useState } from 'react'
import { useAuth } from '../AuthContext'
import './LoginScreen.css'

export default function LoginScreen() {
  const { connexion, inscription, demanderReinitialisation } = useAuth()
  const [onglet, setOnglet] = useState('connexion')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Champs connexion
  const [emailConnexion, setEmailConnexion] = useState('')
  const [mdpConnexion, setMdpConnexion] = useState('')

  // Champs inscription
  const [pseudo, setPseudo] = useState('')
  const [emailInscription, setEmailInscription] = useState('')
  const [mdpInscription, setMdpInscription] = useState('')

  // Mot de passe oublié
  const [modeOublie, setModeOublie] = useState(false)
  const [emailOubli, setEmailOubli] = useState('')
  const [chargementOubli, setChargementOubli] = useState(false)
  const [messageOubli, setMessageOubli] = useState(null)

  async function gererConnexion(e) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    const { error } = await connexion(emailConnexion, mdpConnexion)
    setChargement(false)
    if (error) {
      setErreur(traduireErreur(error.message))
    }
  }

  async function gererInscription(e) {
    e.preventDefault()
    setErreur(null)

    if (pseudo.trim().length < 2) {
      setErreur('Choisis un pseudo un peu plus long.')
      return
    }
    if (mdpInscription.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.')
      return
    }

    setChargement(true)
    const { error } = await inscription(emailInscription, mdpInscription, pseudo.trim())
    setChargement(false)
    if (error) {
      setErreur(traduireErreur(error.message))
    }
    // Si succès : le AuthContext détecte automatiquement la nouvelle session
    // et l'appli affichera l'écran "en attente d'approbation"
  }

  function ouvrirMotDePasseOublie() {
    setEmailOubli(emailConnexion)
    setMessageOubli(null)
    setModeOublie(true)
  }

  function retourConnexion() {
    setModeOublie(false)
    setMessageOubli(null)
  }

  async function gererDemandeReinitialisation(e) {
    e.preventDefault()
    setChargementOubli(true)
    await demanderReinitialisation(emailOubli)
    setChargementOubli(false)
    setMessageOubli("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.")
  }

  return (
    <div className="app">
      <div className="login-wrap">
        <div className="brand">
          <div className="glyph">A</div>
          <h1>Alis</h1>
          <p>Quêtes, XP et pouvoirs entre potes</p>
        </div>

        <div className="panel">
          {modeOublie ? (
            <form onSubmit={gererDemandeReinitialisation}>
              <h2 className="forgot-title">Mot de passe oublié</h2>

              {messageOubli ? (
                <div className="notice">{messageOubli}</div>
              ) : (
                <>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="toi@exemple.com"
                      value={emailOubli}
                      onChange={(e) => setEmailOubli(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit" disabled={chargementOubli}>
                    {chargementOubli ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                  </button>
                </>
              )}

              <button type="button" className="back-link" onClick={retourConnexion}>
                ← Retour à la connexion
              </button>
            </form>
          ) : (
            <>
              <div className="tabs">
                <button
                  className={`tab ${onglet === 'connexion' ? 'active' : ''}`}
                  onClick={() => { setOnglet('connexion'); setErreur(null) }}
                  type="button"
                >
                  Connexion
                </button>
                <button
                  className={`tab ${onglet === 'inscription' ? 'active' : ''}`}
                  onClick={() => { setOnglet('inscription'); setErreur(null) }}
                  type="button"
                >
                  Inscription
                </button>
              </div>

              {onglet === 'connexion' ? (
                <form onSubmit={gererConnexion}>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="toi@exemple.com"
                      value={emailConnexion}
                      onChange={(e) => setEmailConnexion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={mdpConnexion}
                      onChange={(e) => setMdpConnexion(e.target.value)}
                      required
                    />
                  </div>
                  {erreur && <div className="form-error">{erreur}</div>}
                  <button type="submit" className="submit" disabled={chargement}>
                    {chargement ? 'Connexion...' : 'Se connecter'}
                  </button>
                  <button type="button" className="forgot-link" onClick={ouvrirMotDePasseOublie}>
                    Mot de passe oublié ?
                  </button>
                </form>
              ) : (
            <form onSubmit={gererInscription}>
              <div className="field">
                <label>Pseudo</label>
                <input
                  type="text"
                  placeholder="Ton nom de joueur"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="toi@exemple.com"
                  value={emailInscription}
                  onChange={(e) => setEmailInscription(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={mdpInscription}
                  onChange={(e) => setMdpInscription(e.target.value)}
                  required
                />
                <div className="hint">6 caractères minimum</div>
              </div>
              {erreur && <div className="form-error">{erreur}</div>}
              <button type="submit" className="submit" disabled={chargement}>
                {chargement ? 'Création...' : 'Créer mon compte'}
              </button>

              <div className="notice">
                ⏳ Après inscription, un admin doit approuver ton compte avant que tu puisses accéder aux quêtes.
              </div>
            </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function traduireErreur(message) {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (message.includes('already registered')) return 'Un compte existe déjà avec cet email.'
  if (message.includes('Password should be')) return 'Mot de passe trop court (6 caractères minimum).'
  if (
    message.includes('profiles_pseudo_key') ||
    message.includes('duplicate key') ||
    message.includes('Database error saving new user')
  ) return 'Ce pseudo est déjà pris, choisis-en un autre.'
  return message
}
