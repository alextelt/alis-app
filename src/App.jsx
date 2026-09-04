import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScreen from './screens/LoginScreen'
import WaitingScreen from './screens/WaitingScreen'
import BottomNav from './components/BottomNav'
import Avatar from './components/Avatar'
import QuetesScreen from './screens/QuetesScreen'
import VotesScreen from './screens/VotesScreen'
import AlisScreen from './screens/AlisScreen'
import OutilsScreen from './screens/OutilsScreen'
import ProfilScreen from './screens/ProfilScreen'
import AdminScreen from './screens/AdminScreen'
import './theme.css'

function AppContent() {
  const { session, profile, profileLoading, estConnecte, estApprouve } = useAuth()
  const [ecranActif, setEcranActif] = useState('quetes')

  useEffect(() => {
    document.documentElement.dataset.daltonien = profile?.mode_daltonien ? 'true' : 'false'
  }, [profile?.mode_daltonien])

  // Session pas encore vérifiée (tout premier chargement)
  if (session === undefined) {
    return (
      <div className="app">
        <div className="loading-screen">Chargement...</div>
      </div>
    )
  }

  // Pas connecté -> écran de connexion/inscription
  if (!estConnecte) {
    return <LoginScreen />
  }

  // Connecté mais profil en cours de chargement
  if (profileLoading || profile === null) {
    return (
      <div className="app">
        <div className="loading-screen">Chargement du profil...</div>
      </div>
    )
  }

  // Connecté mais pas encore approuvé par un admin
  if (!estApprouve) {
    return <WaitingScreen />
  }

  // Connecté et approuvé -> appli principale
  const ecrans = {
    quetes: <QuetesScreen />,
    votes: <VotesScreen />,
    alis: <AlisScreen />,
    outils: <OutilsScreen />,
    profil: <ProfilScreen />,
    admin: <AdminScreen />,
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="app-name">Alis</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pseudo">{profile.pseudo}</div>
            <Avatar pseudo={profile.pseudo} avatarUrl={profile.avatar_url} size={26} />
          </div>
        </div>
      </header>

      {ecrans[ecranActif] ?? <QuetesScreen />}

      <BottomNav ecranActif={ecranActif} onChangerEcran={setEcranActif} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
