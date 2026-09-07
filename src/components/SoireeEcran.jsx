import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { useSoireeActive } from '../useSoireeActive'
import Avatar from './Avatar'
import './SoireeEcran.css'

export default function SoireeEcran({ onFermer }) {
  const { user, estAdmin } = useAuth()
  const { soireeActive, participants, chargement, recharger } = useSoireeActive(user)

  const [amis, setAmis] = useState([])
  const [chargementAmis, setChargementAmis] = useState(true)
  const [selection, setSelection] = useState([])
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(false)
  const [participantDeplie, setParticipantDeplie] = useState(null)
  const [competencesParticipant, setCompetencesParticipant] = useState({})
  const [chargementCompetences, setChargementCompetences] = useState(false)

  const chargerAmis = useCallback(async () => {
    setChargementAmis(true)
    const { data, error } = await supabase
      .from('amities')
      .select(`
        id, demandeur_id, destinataire_id,
        demandeur:profiles!amities_demandeur_id_fkey(id, pseudo, avatar_url),
        destinataire:profiles!amities_destinataire_id_fkey(id, pseudo, avatar_url)
      `)
      .eq('statut', 'acceptée')
      .or(`demandeur_id.eq.${user.id},destinataire_id.eq.${user.id}`)

    if (!error) {
      const liste = (data || []).map((a) => (a.demandeur_id === user.id ? a.destinataire : a.demandeur))
      setAmis(liste)
    }
    setChargementAmis(false)
  }, [user.id])

  useEffect(() => {
    if (!chargement && !soireeActive) chargerAmis()
  }, [chargement, soireeActive, chargerAmis])

  function toggleSelection(amiId) {
    setSelection((prev) => (prev.includes(amiId) ? prev.filter((id) => id !== amiId) : [...prev, amiId]))
  }

  async function creerSoiree() {
    setErreur(null)
    setCreationEnCours(true)

    const { data: soiree, error: erreurSoiree } = await supabase
      .from('soirees')
      .insert({ createur_id: user.id, statut: 'ouverte' })
      .select()
      .single()

    if (erreurSoiree) {
      setCreationEnCours(false)
      setErreur(erreurSoiree.message)
      return
    }

    const lignes = [user.id, ...selection].map((profileId) => ({
      soiree_id: soiree.id,
      profile_id: profileId,
    }))
    const { error: erreurParticipants } = await supabase.from('soiree_participants').insert(lignes)
    setCreationEnCours(false)

    if (erreurParticipants) {
      setErreur(erreurParticipants.message)
      return
    }

    recharger()
  }

  async function toggleParticipant(participant) {
    if (participantDeplie === participant.profileId) {
      setParticipantDeplie(null)
      return
    }
    setParticipantDeplie(participant.profileId)

    if (!competencesParticipant[participant.profileId]) {
      setChargementCompetences(true)
      const { data, error } = await supabase
        .from('profiles_competences')
        .select('points_investis, competence:competences_aloxis(*)')
        .eq('profile_id', participant.profileId)
        .gt('points_investis', 0)

      if (!error) {
        setCompetencesParticipant((prev) => ({ ...prev, [participant.profileId]: data || [] }))
      }
      setChargementCompetences(false)
    }
  }

  function effetActuel(competence, points) {
    const paliers = Object.entries(competence.bareme || {})
      .map(([seuil, effet]) => ({ seuil: parseInt(seuil, 10), effet }))
      .sort((a, b) => a.seuil - b.seuil)
    const atteints = paliers.filter((p) => p.seuil <= points)
    const dernier = atteints[atteints.length - 1]
    return dernier ? `${dernier.effet} · palier à ${dernier.seuil} Alis` : ''
  }

  async function terminerSoiree() {
    if (!confirm('Terminer cette soirée ?')) return
    setActionEnCours(true)
    const { error } = await supabase
      .from('soirees')
      .update({ statut: 'fermee', date_fermeture: new Date().toISOString() })
      .eq('id', soireeActive.id)
    setActionEnCours(false)
    if (error) {
      alert('Impossible de terminer la soirée : ' + error.message)
      return
    }
    recharger()
  }

  async function quitterSoiree() {
    const moi = participants.find((p) => p.profileId === user.id)
    if (!moi) return
    if (!confirm('Quitter cette soirée ?')) return
    setActionEnCours(true)
    const { error } = await supabase.from('soiree_participants').delete().eq('id', moi.id)
    setActionEnCours(false)
    if (error) {
      alert('Impossible de quitter la soirée : ' + error.message)
      return
    }
    recharger()
  }

  const peutTerminer = soireeActive && (soireeActive.createur_id === user.id || estAdmin)

  return (
    <div className="se-overlay">
      <button className="se-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      <div className="se-content">
        {chargement ? (
          <div className="loading-screen">Chargement de la soirée...</div>
        ) : soireeActive ? (
          <>
            <h2 className="se-title">Soirée en cours</h2>
            <div className="se-subtitle">
              {participants.length} participant{participants.length > 1 ? 's' : ''}
            </div>

            <div className="se-participants-list">
              {participants.map((p) => (
                <div key={p.id} className="se-participant-card">
                  <button className="se-participant-row" onClick={() => toggleParticipant(p)} type="button">
                    <Avatar pseudo={p.pseudo} avatarUrl={p.avatarUrl} size={38} />
                    <span className="se-participant-name">{p.pseudo}</span>
                    <span className="se-participant-chevron">
                      {participantDeplie === p.profileId ? '▲' : '▼'}
                    </span>
                  </button>

                  {participantDeplie === p.profileId && (
                    <div className="se-participant-competences">
                      {chargementCompetences && !competencesParticipant[p.profileId] ? (
                        <div className="se-competences-note">Chargement...</div>
                      ) : (competencesParticipant[p.profileId] || []).length === 0 ? (
                        <div className="se-competences-note">Aucune Alis débloquée.</div>
                      ) : (
                        competencesParticipant[p.profileId].map((c) => (
                          <div key={c.competence.id} className="se-competence-row">
                            <span className="se-competence-name">{c.competence.nom}</span>
                            <span className="se-competence-effect">
                              {effetActuel(c.competence, c.points_investis)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {peutTerminer ? (
              <button className="se-danger-btn" onClick={terminerSoiree} disabled={actionEnCours} type="button">
                Terminer la soirée
              </button>
            ) : (
              <button className="se-danger-btn" onClick={quitterSoiree} disabled={actionEnCours} type="button">
                Quitter la soirée
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="se-title">Créer une soirée</h2>
            <div className="se-subtitle">
              Sélectionne au moins 2 amis présents (toi + eux = 3 minimum).
            </div>

            {chargementAmis ? (
              <div className="se-competences-note">Chargement de tes amis...</div>
            ) : amis.length === 0 ? (
              <div className="empty-state">
                Tu n'as pas encore d'amis. Ajoute-en depuis ton profil pour créer une soirée.
              </div>
            ) : (
              <div className="se-amis-list">
                {amis.map((a) => (
                  <label key={a.id} className="se-ami-row">
                    <input
                      type="checkbox"
                      checked={selection.includes(a.id)}
                      onChange={() => toggleSelection(a.id)}
                    />
                    <Avatar pseudo={a.pseudo} avatarUrl={a.avatar_url} size={34} />
                    <span className="se-ami-name">{a.pseudo}</span>
                  </label>
                ))}
              </div>
            )}

            {erreur && <div className="se-erreur">{erreur}</div>}

            <button
              className="se-primary-btn"
              onClick={creerSoiree}
              disabled={selection.length < 2 || creationEnCours}
              type="button"
            >
              {creationEnCours ? 'Création...' : 'Créer la soirée'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
