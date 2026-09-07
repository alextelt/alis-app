import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { calculerNiveau } from '../utils'
import './AlisScreen.css'

export default function AlisScreen() {
  const { user, profile } = useAuth()
  const [arcs, setArcs] = useState([])
  const [competences, setCompetences] = useState([])
  const [debloqueesIds, setDebloqueesIds] = useState(new Set())
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)

  const charger = useCallback(async () => {
    setErreur(null)
    const [arcsRes, compRes, pointsRes] = await Promise.all([
      supabase.from('arcs').select('*').order('ordre'),
      supabase.from('competences_aloxis').select('*').order('niveau'),
      supabase.from('profiles_competences').select('competence_id').eq('profile_id', user.id),
    ])

    if (arcsRes.error) setErreur(arcsRes.error.message)
    else setArcs(arcsRes.data)

    if (compRes.error) setErreur(compRes.error.message)
    else setCompetences(compRes.data)

    if (pointsRes.error) setErreur(pointsRes.error.message)
    else setDebloqueesIds(new Set(pointsRes.data.map((p) => p.competence_id)))

    setChargement(false)
  }, [user.id])

  useEffect(() => {
    charger()
  }, [charger])

  const { niveau } = calculerNiveau(profile.xp_total)

  const arcsAvecNiveaux = useMemo(() => {
    return arcs.map((arc) => ({
      ...arc,
      niveaux: competences
        .filter((c) => c.arc_id === arc.id)
        .sort((a, b) => a.niveau - b.niveau),
    }))
  }, [arcs, competences])

  const pointsDepenses = useMemo(
    () => competences.filter((c) => debloqueesIds.has(c.id)).reduce((s, c) => s + c.cout_points, 0),
    [competences, debloqueesIds]
  )
  const pointsDisponibles = (niveau - 1) - pointsDepenses

  async function debloquerCompetence(competence) {
    setActionEnCours(competence.id)
    const { error } = await supabase.from('profiles_competences').insert({
      profile_id: user.id,
      competence_id: competence.id,
      points_investis: competence.cout_points,
    })
    setActionEnCours(null)
    if (error) {
      alert('Impossible de débloquer ce niveau : ' + error.message)
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
          <span className="alis-count">{pointsDisponibles}</span>
          <span className="alis-count-label">points de compétence disponibles</span>
        </div>
      </div>

      <div className="page-content">
        {arcsAvecNiveaux.length === 0 && (
          <div className="empty-state">Aucun Arc défini pour l'instant.</div>
        )}

        {arcsAvecNiveaux.map((arc) => (
          <div key={arc.id} className="arc-section">
            <div className="arc-nom">{arc.nom}</div>
            {arc.description && <div className="arc-desc">{arc.description}</div>}

            <div className="arc-tree">
              {arc.niveaux.map((c, i) => {
                const debloquee = debloqueesIds.has(c.id)
                const precedentOk = i === 0 || debloqueesIds.has(arc.niveaux[i - 1].id)
                const verrouille = !debloquee && !precedentOk
                const peutDebloquer = !debloquee && precedentOk
                const assezDePoints = pointsDisponibles >= c.cout_points

                return (
                  <div
                    key={c.id}
                    className={`niveau-card ${debloquee ? 'debloquee' : ''} ${verrouille ? 'verrouille' : ''}`}
                  >
                    <div className="niveau-top">
                      <span className="niveau-label">Niveau {c.niveau}</span>
                      <span className="niveau-cout">{c.cout_points} pt{c.cout_points > 1 ? 's' : ''}</span>
                    </div>
                    <div className="niveau-nom">{c.nom}</div>
                    <div className="niveau-desc">{c.description}</div>

                    {verrouille ? (
                      <div className="niveau-verrouille-note">
                        <span className="niveau-lock">🔒</span>
                        Débloque d'abord le niveau précédent
                      </div>
                    ) : peutDebloquer ? (
                      <button
                        className="niveau-btn"
                        onClick={() => debloquerCompetence(c)}
                        disabled={!assezDePoints || actionEnCours === c.id}
                      >
                        {actionEnCours === c.id ? 'Déblocage...' : `Débloquer (${c.cout_points} pts)`}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
