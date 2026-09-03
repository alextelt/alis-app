import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { calculerNiveau, estAujourdhui } from '../utils'
import Avatar from '../components/Avatar'
import AvatarPicker from '../components/AvatarPicker'
import AmisScreen from './AmisScreen'
import './ProfilScreen.css'

export default function ProfilScreen() {
  const { user, profile, deconnexion, rafraichirProfil } = useAuth()
  const [nbQuetesReussies, setNbQuetesReussies] = useState(0)
  const [competencesDebloquees, setCompetencesDebloquees] = useState([])
  const [utilisationsRecentes, setUtilisationsRecentes] = useState([])
  const [historique, setHistorique] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)
  const [pickerOuvert, setPickerOuvert] = useState(false)
  const [avatarEnCours, setAvatarEnCours] = useState(false)
  const [vueAmis, setVueAmis] = useState(false)
  const [nbDemandesRecues, setNbDemandesRecues] = useState(0)

  const charger = useCallback(async () => {
    setErreur(null)

    const [validationsRes, pointsRes, utilRes] = await Promise.all([
      supabase
        .from('quetes_validations')
        .select('id, date_creation, quete:quetes(titre, xp_recompense)')
        .eq('joueur_id', user.id)
        .eq('statut', 'validée')
        .order('date_creation', { ascending: false }),
      supabase
        .from('profiles_competences')
        .select('points_investis, competence:competences_aloxis(*)')
        .eq('profile_id', user.id)
        .gt('points_investis', 0),
      supabase
        .from('competence_utilisations')
        .select('*')
        .eq('profile_id', user.id)
        .gte('date_utilisation', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

    if (validationsRes.error) setErreur(validationsRes.error.message)
    else {
      setNbQuetesReussies(validationsRes.data.length)
      setHistorique(validationsRes.data.slice(0, 5))
    }

    if (pointsRes.error) setErreur(pointsRes.error.message)
    else setCompetencesDebloquees(pointsRes.data)

    if (utilRes.error) setErreur(utilRes.error.message)
    else setUtilisationsRecentes(utilRes.data)

    setChargement(false)
  }, [user.id])

  useEffect(() => {
    charger()
  }, [charger])

  const chargerNbDemandes = useCallback(async () => {
    const { count } = await supabase
      .from('amities')
      .select('id', { count: 'exact', head: true })
      .eq('destinataire_id', user.id)
      .eq('statut', 'en_attente')
    setNbDemandesRecues(count ?? 0)
  }, [user.id])

  useEffect(() => {
    chargerNbDemandes()
  }, [chargerNbDemandes])

  const { niveau, xpDansNiveauActuel, xpPourProchainNiveau, progression } = calculerNiveau(profile.xp_total)
  const alisDepenses = competencesDebloquees.reduce((s, p) => s + p.points_investis, 0)
  const utiliseAujourdhui = useMemo(
    () => utilisationsRecentes.some((u) => estAujourdhui(u.date_utilisation)),
    [utilisationsRecentes]
  )

  async function activerCompetence(competenceId) {
    setActionEnCours(competenceId)
    const { error } = await supabase.from('competence_utilisations').insert({
      profile_id: user.id,
      competence_id: competenceId,
    })
    setActionEnCours(null)
    if (error) {
      alert("Impossible d'activer cette compétence : " + error.message)
      return
    }
    charger()
  }

  async function changerAvatar(code) {
    setAvatarEnCours(true)
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: code })
      .eq('id', user.id)
    setAvatarEnCours(false)
    if (error) {
      alert("Impossible de changer d'avatar : " + error.message)
      return
    }
    rafraichirProfil()
    setPickerOuvert(false)
  }

  function effetActuel(competence, points) {
    const paliers = Object.entries(competence.bareme || {})
      .map(([seuil, effet]) => ({ seuil: parseInt(seuil, 10), effet }))
      .sort((a, b) => a.seuil - b.seuil)
    const atteints = paliers.filter((p) => p.seuil <= points)
    const dernier = atteints[atteints.length - 1]
    return dernier ? `${dernier.effet} · palier à ${dernier.seuil} Alis` : ''
  }

  if (chargement) {
    return <div className="loading-screen">Chargement du profil...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  if (vueAmis) {
    return (
      <AmisScreen
        onRetour={() => {
          setVueAmis(false)
          chargerNbDemandes()
        }}
      />
    )
  }

  return (
    <div className="page-content">
      <div className="profile-hero">
        <button
          className="avatar-edit-trigger"
          onClick={() => setPickerOuvert(true)}
          aria-label="Changer d'avatar"
        >
          <Avatar pseudo={profile.pseudo} avatarUrl={profile.avatar_url} size={60} />
          <div className="avatar-edit-badge">✎</div>
        </button>
        <div className="profile-name">{profile.pseudo}</div>
        <div className="profile-level">Niveau {niveau}</div>
        <div className="xp-bar-track" style={{ marginTop: 14 }}>
          <div className="xp-bar-fill" style={{ width: `${Math.min(100, progression * 100)}%` }}></div>
        </div>
        <div className="profile-xp-detail">
          {xpDansNiveauActuel} / {xpPourProchainNiveau} XP avant le niveau {niveau + 1}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-num">{nbQuetesReussies}</div>
          <div className="stat-label">quêtes réussies</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{alisDepenses}</div>
          <div className="stat-label">Alis dépensés</div>
        </div>
      </div>

      {competencesDebloquees.length > 0 && (
        <>
          <div className="section-title">Alis débloqués</div>
          <div className="unlocked-list">
            {competencesDebloquees.map((p) => (
              <div key={p.competence.id} className="unlocked-row">
                <div>
                  <div className="unlocked-name">{p.competence.nom}</div>
                  <div className="unlocked-effect">{effetActuel(p.competence, p.points_investis)}</div>
                </div>
                <button
                  className="unlock-use-btn"
                  onClick={() => activerCompetence(p.competence.id)}
                  disabled={utiliseAujourdhui || actionEnCours === p.competence.id}
                >
                  {utiliseAujourdhui ? 'Indispo.' : 'Utiliser'}
                </button>
              </div>
            ))}
          </div>
          <div className="unlocked-note">
            Une seule Alis utilisable par jour, toutes compétences confondues.
          </div>
        </>
      )}

      <div className="section-title">Historique récent</div>
      {historique.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 0' }}>Aucune quête réussie pour l'instant.</div>
      ) : (
        <div className="history-list">
          {historique.map((h) => (
            <div key={h.id} className="history-row">
              <div className="history-icon">✓</div>
              <div className="history-text">
                <div className="history-quest">{h.quete.titre}</div>
                <div className="history-date">{formaterDate(h.date_creation)}</div>
              </div>
              <div className="history-xp">+{h.quete.xp_recompense} XP</div>
            </div>
          ))}
        </div>
      )}

      <button className="amis-btn" onClick={() => setVueAmis(true)} type="button">
        Mes amis
        {nbDemandesRecues > 0 && <span className="amis-badge">{nbDemandesRecues}</span>}
      </button>

      <button className="logout-btn" onClick={deconnexion}>Se déconnecter</button>

      {pickerOuvert && (
        <AvatarPicker
          avatarActuel={profile.avatar_url}
          onChoisir={changerAvatar}
          onFermer={() => setPickerOuvert(false)}
          enCours={avatarEnCours}
        />
      )}
    </div>
  )
}

function formaterDate(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
