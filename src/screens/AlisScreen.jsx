import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { calculerNiveau, estAujourdhui } from '../utils'
import './AlisScreen.css'

export default function AlisScreen() {
  const { user, profile, rafraichirProfil } = useAuth()
  const [competences, setCompetences] = useState([])
  const [mesPoints, setMesPoints] = useState([]) // profiles_competences
  const [mesUtilisations, setMesUtilisations] = useState([]) // competence_utilisations
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)

  const charger = useCallback(async () => {
    setErreur(null)
    const [compRes, pointsRes, utilRes] = await Promise.all([
      supabase.from('competences_aloxis').select('*').order('nom'),
      supabase.from('profiles_competences').select('*').eq('profile_id', user.id),
      supabase
        .from('competence_utilisations')
        .select('*')
        .eq('profile_id', user.id)
        .gte('date_utilisation', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

    if (compRes.error) setErreur(compRes.error.message)
    else setCompetences(compRes.data)

    if (pointsRes.error) setErreur(pointsRes.error.message)
    else setMesPoints(pointsRes.data)

    if (utilRes.error) setErreur(utilRes.error.message)
    else setMesUtilisations(utilRes.data)

    setChargement(false)
  }, [user.id])

  useEffect(() => {
    charger()
  }, [charger])

  const { niveau } = calculerNiveau(profile.xp_total)
  const pointsTotalGagnes = niveau - 1
  const pointsDejaDepenses = mesPoints.reduce((somme, p) => somme + p.points_investis, 0)
  const alisDisponibles = pointsTotalGagnes - pointsDejaDepenses

  const utiliseAujourdhui = useMemo(
    () => mesUtilisations.some((u) => estAujourdhui(u.date_utilisation)),
    [mesUtilisations]
  )

  function pointsInvestisDans(competenceId) {
    const p = mesPoints.find((p) => p.competence_id === competenceId)
    return p ? p.points_investis : 0
  }

  async function depenserAlis(competence) {
    if (alisDisponibles <= 0) return
    setActionEnCours(competence.id)

    const existant = mesPoints.find((p) => p.competence_id === competence.id)

    let error
    if (existant) {
      ;({ error } = await supabase
        .from('profiles_competences')
        .update({ points_investis: existant.points_investis + 1 })
        .eq('profile_id', user.id)
        .eq('competence_id', competence.id))
    } else {
      ;({ error } = await supabase
        .from('profiles_competences')
        .insert({ profile_id: user.id, competence_id: competence.id, points_investis: 1 }))
    }

    setActionEnCours(null)
    if (error) {
      alert("Impossible de dépenser un Alis : " + error.message)
      return
    }
    charger()
  }

  async function activerCompetence(competence) {
    setActionEnCours(competence.id)
    const { error } = await supabase.from('competence_utilisations').insert({
      profile_id: user.id,
      competence_id: competence.id,
    })
    setActionEnCours(null)
    if (error) {
      alert("Impossible d'activer cette compétence : " + error.message)
      return
    }
    charger()
  }

  if (chargement) {
    return <div className="loading-screen">Chargement des Alis...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  return (
    <>
      <div style={{ padding: '0 18px' }}>
        <div>
          <span className="alis-count">{alisDisponibles}</span>
          <span className="alis-count-label">Alis disponibles</span>
        </div>
        <div className="today-status">
          <div className={`today-dot ${utiliseAujourdhui ? 'used' : ''}`}></div>
          {utiliseAujourdhui
            ? 'Tu as déjà activé une compétence aujourd\'hui'
            : 'Aucune compétence utilisée aujourd\'hui — tu peux en activer une'}
        </div>
      </div>

      <div className="page-content">
        {competences.length === 0 && (
          <div className="empty-state">Aucune Alis définie pour l'instant.</div>
        )}

        {competences.map((competence) => {
          const points = pointsInvestisDans(competence.id)
          const paliers = Object.entries(competence.bareme || {})
            .map(([seuil, effet]) => ({ seuil: parseInt(seuil, 10), effet }))
            .sort((a, b) => a.seuil - b.seuil)

          const debloquee = points > 0

          return (
            <div key={competence.id} className={`ali-card ${debloquee ? '' : 'locked'}`}>
              <div className="ali-top">
                <div className="ali-name">{competence.nom}</div>
                <div className="ali-points">{points} Alis dépensé{points > 1 ? 's' : ''}</div>
              </div>
              <div className="ali-desc">{competence.description}</div>

              <div className="ali-bareme">
                {paliers.map((p) => {
                  const estAtteint = points >= p.seuil
                  const estLeDernierAtteint =
                    estAtteint && !paliers.some((autre) => autre.seuil > p.seuil && autre.seuil <= points)
                  return (
                    <div
                      key={p.seuil}
                      className={`bareme-step ${estAtteint ? 'done' : ''} ${estLeDernierAtteint ? 'current' : ''}`}
                    >
                      <span className="step-pts">{p.seuil} Alis</span>
                      <span className="step-effect">{p.effet}</span>
                    </div>
                  )
                })}
              </div>

              <div className="ali-actions">
                <button
                  className="ali-btn investir"
                  onClick={() => depenserAlis(competence)}
                  disabled={alisDisponibles <= 0 || actionEnCours === competence.id}
                >
                  + Dépenser des Alis
                </button>
                <button
                  className="ali-btn activer"
                  onClick={() => activerCompetence(competence)}
                  disabled={!debloquee || utiliseAujourdhui || actionEnCours === competence.id}
                >
                  {!debloquee
                    ? 'Aucun Alis dépensé'
                    : utiliseAujourdhui
                    ? 'Déjà utilisé aujourd\'hui'
                    : 'Activer aujourd\'hui'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
