import { useAuth } from '../AuthContext'
import './WaitingScreen.css'

export default function WaitingScreen() {
  const { profile, deconnexion } = useAuth()

  return (
    <div className="app">
      <div className="waiting-wrap">
        <div className="seal">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path>
          </svg>
        </div>

        <h1>Ta requête est déposée</h1>
        <p className="sub">
          Bienvenue, <strong>{profile?.pseudo}</strong>. Un membre du conseil doit approuver ton entrée dans la guilde avant que tu puisses voir les quêtes et voter.
        </p>

        <div className="status-panel">
          <div className="dot"></div>
          <div className="status-text">
            <div className="label">En attente d'approbation</div>
            <div className="detail">Un admin doit valider ton compte</div>
          </div>
        </div>

        <button className="logout" onClick={deconnexion}>Se déconnecter</button>
      </div>
    </div>
  )
}
