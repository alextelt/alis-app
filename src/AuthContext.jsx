import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = pas encore chargé
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const chargerProfil = useCallback(async (userId) => {
    setProfileLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erreur chargement profil :', error)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) chargerProfil(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        chargerProfil(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [chargerProfil])

  const inscription = async (email, motDePasse, pseudo) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        data: { pseudo },
      },
    })
    return { data, error }
  }

  const connexion = async (email, motDePasse) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })
    return { data, error }
  }

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  const rafraichirProfil = useCallback(() => {
    if (session?.user) chargerProfil(session.user.id)
  }, [session, chargerProfil])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    profileLoading,
    estConnecte: !!session,
    estApprouve: profile?.statut_validation === 'approuvé',
    estAdmin: profile?.role === 'admin',
    inscription,
    connexion,
    deconnexion,
    rafraichirProfil,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
