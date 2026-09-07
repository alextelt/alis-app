import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { useSoireeActive } from '../useSoireeActive'
import { minutesAvantExpiration } from '../utils'
import Avatar from './Avatar'
import './SoireeEcran.css'

export default function SoireeEcran({ onFermer }) {
  const { user, profile, estAdmin } = useAuth()
  const { soireeActive, participants, majorite, chargement, recharger } = useSoireeActive(user)

  const [ongletActif, setOngletActif] = useState('participants')

  const [amis, setAmis] = useState([])
  const [chargementAmis, setChargementAmis] = useState(true)
  const [selection, setSelection] = useState([])
  const [budgetAlis, setBudgetAlis] = useState(5)
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(false)
  const [participantDeplie, setParticipantDeplie] = useState(null)
  const [competencesParticipant, setCompetencesParticipant] = useState({})
  const [chargementCompetences, setChargementCompetences] = useState(false)
  const [budgetUtilise, setBudgetUtilise] = useState(0)
  const [actionEnCoursUsage, setActionEnCoursUsage] = useState(null)

  const [tentatives, setTentatives] = useState([])
  const [chargementVotes, setChargementVotes] = useState(true)
  const [erreurVotes, setErreurVotes] = useState(null)
  const [tentativePourVote, setTentativePourVote] = useState(null)
  const [actionEnCoursVote, setActionEnCoursVote] = useState(null)

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

  const chargerVotes = useCallback(async () => {
    if (!soireeActive) {
      setTentatives([])
      setChargementVotes(false)
      return
    }

    setErreurVotes(null)
    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('quetes_validations')
      .select(`
        id, quete_id, joueur_id, statut, date_creation,
        quete:quetes ( titre, description, xp_recompense ),
        joueur:profiles!quetes_validations_joueur_id_fkey ( pseudo, avatar_url ),
        votes ( votant_id, votant:profiles!votes_votant_id_fkey ( pseudo ) )
      `)
      .eq('statut', 'en_attente')
      .eq('soiree_id', soireeActive.id)
      .gte('date_creation', uneHeureAvant)
      .order('date_creation', { ascending: true })

    if (error) setErreurVotes(error.message)
    else setTentatives(data)

    setChargementVotes(false)
  }, [soireeActive])

  useEffect(() => {
    chargerVotes()
    const interval = setInterval(chargerVotes, 30000)
    return () => clearInterval(interval)
  }, [chargerVotes])

  const chargerBudget = useCallback(async () => {
    if (!soireeActive) {
      setBudgetUtilise(0)
      return
    }
    const { data, error } = await supabase
      .from('competence_utilisations')
      .select('competence:competences_aloxis(cout_points)')
      .eq('profile_id', user.id)
      .eq('soiree_id', soireeActive.id)

    if (!error) {
      const total = (data || []).reduce((s, u) => s + (u.competence?.cout_points || 0), 0)
      setBudgetUtilise(total)
    }
  }, [soireeActive, user.id])

  useEffect(() => {
    chargerBudget()
  }, [chargerBudget])

  function toggleSelection(amiId) {
    setSelection((prev) => (prev.includes(amiId) ? prev.filter((id) => id !== amiId) : [...prev, amiId]))
  }

  async function creerSoiree() {
    setErreur(null)
    setCreationEnCours(true)

    const budgetBorne = Math.min(30, Math.max(0, parseInt(budgetAlis, 10) || 0))

    const { data: soiree, error: erreurSoiree } = await supabase
      .from('soirees')
      .insert({ createur_id: user.id, statut: 'ouverte', budget_alis_points: budgetBorne })
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
        .select('competence:competences_aloxis(id, nom, niveau, cout_points, arc:arcs(id, nom))')
        .eq('profile_id', participant.profileId)

      if (!error) {
        setCompetencesParticipant((prev) => ({ ...prev, [participant.profileId]: data || [] }))
      }
      setChargementCompetences(false)
    }
  }

  function grouperParArc(liste) {
    const groupes = {}
    for (const item of liste) {
      const c = item.competence
      if (!c) continue
      const arcNom = c.arc?.nom || 'Autre'
      if (!groupes[arcNom]) groupes[arcNom] = []
      groupes[arcNom].push(c)
    }
    return groupes
  }

  async function utiliserCompetence(competence) {
    setActionEnCoursUsage(competence.id)
    const { error } = await supabase.from('competence_utilisations').insert({
      profile_id: user.id,
      competence_id: competence.id,
      soiree_id: soireeActive.id,
    })
    setActionEnCoursUsage(null)
    if (error) {
      alert("Impossible d'utiliser cette Alis : " + error.message)
      return
    }
    chargerBudget()
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

  async function confirmerVote(tentative) {
    setActionEnCoursVote(tentative.id)
    const { error } = await supabase.from('votes').insert({
      validation_id: tentative.id,
      votant_id: user.id,
    })
    setActionEnCoursVote(null)
    setTentativePourVote(null)
    if (error) {
      alert("Impossible d'enregistrer ton vote : " + error.message)
      return
    }
    chargerVotes()
  }

  async function retirerTentative(tentative) {
    if (!confirm(`Retirer ta tentative "${tentative.quete.titre}" ?`)) return
    setActionEnCoursVote(tentative.id)
    const { error } = await supabase.from('quetes_validations').delete().eq('id', tentative.id)
    setActionEnCoursVote(null)
    if (error) {
      alert('Impossible de retirer cette tentative : ' + error.message)
      return
    }
    chargerVotes()
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

            <div className="se-tabs">
              <button
                className={`se-tab ${ongletActif === 'participants' ? 'active' : ''}`}
                onClick={() => setOngletActif('participants')}
                type="button"
              >
                Participants
              </button>
              <button
                className={`se-tab ${ongletActif === 'votes' ? 'active' : ''}`}
                onClick={() => setOngletActif('votes')}
                type="button"
              >
                Quêtes à valider
                {tentatives.length > 0 && <span className="se-tab-badge">{tentatives.length}</span>}
              </button>
            </div>

            {ongletActif === 'participants' && (
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
                        {p.profileId === user.id && (
                          <div className="se-budget-row">
                            Budget restant :{' '}
                            <strong>
                              {Math.max(0, (soireeActive.budget_alis_points ?? 0) - budgetUtilise)}
                            </strong>{' '}
                            / {soireeActive.budget_alis_points ?? 0} pts
                          </div>
                        )}

                        {chargementCompetences && !competencesParticipant[p.profileId] ? (
                          <div className="se-competences-note">Chargement...</div>
                        ) : (competencesParticipant[p.profileId] || []).length === 0 ? (
                          <div className="se-competences-note">Aucune Alis débloquée.</div>
                        ) : (
                          Object.entries(grouperParArc(competencesParticipant[p.profileId])).map(
                            ([arcNom, comps]) => (
                              <div key={arcNom} className="se-competence-arc-group">
                                <div className="se-competence-arc-title">{arcNom}</div>
                                {comps.map((c) => {
                                  const estMoi = p.profileId === user.id
                                  const budgetRestant = (soireeActive.budget_alis_points ?? 0) - budgetUtilise
                                  const peutUtiliser = estMoi && c.cout_points <= budgetRestant

                                  return (
                                    <div key={c.id} className="se-competence-row">
                                      <span className="se-competence-name">
                                        {c.nom} <span className="se-competence-niveau">Niv. {c.niveau}</span>
                                      </span>
                                      {estMoi ? (
                                        <button
                                          className="se-use-btn"
                                          onClick={() => utiliserCompetence(c)}
                                          disabled={!peutUtiliser || actionEnCoursUsage === c.id}
                                        >
                                          {actionEnCoursUsage === c.id ? '...' : `Utiliser (${c.cout_points} pts)`}
                                        </button>
                                      ) : (
                                        <span className="se-competence-effect">{c.cout_points} pts</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {ongletActif === 'votes' && (
              <div className="se-votes-list">
                {chargementVotes ? (
                  <div className="se-competences-note">Chargement...</div>
                ) : erreurVotes ? (
                  <div className="se-erreur">{erreurVotes}</div>
                ) : tentatives.length === 0 ? (
                  <div className="empty-state">Aucune tentative en attente pour le moment.</div>
                ) : (
                  tentatives.map((t) => {
                    const estMoi = t.joueur_id === user.id
                    const dejaVote = t.votes.some((v) => v.votant_id === user.id)
                    const nbVotes = t.votes.length
                    const minutesRestantes = minutesAvantExpiration(t.date_creation)
                    const nomsVotants = t.votes.map((v) => v.votant.pseudo).join(', ')

                    return (
                      <div key={t.id} className={`vote-card ${estMoi ? 'mine' : ''}`}>
                        <div className="vote-top">
                          <div className="vote-who">
                            <Avatar
                              pseudo={estMoi ? profile.pseudo : t.joueur.pseudo}
                              avatarUrl={estMoi ? profile.avatar_url : t.joueur.avatar_url}
                              size={32}
                            />
                            <div>
                              <div className="vote-name">{estMoi ? 'Toi' : t.joueur.pseudo}</div>
                              <div className="vote-quest">{t.quete.titre}</div>
                            </div>
                          </div>
                          <div className="vote-xp">+{t.quete.xp_recompense} XP</div>
                        </div>

                        <div className="vote-desc">{t.quete.description}</div>

                        <div className="vote-progress-row">
                          <div className="vote-track">
                            <div
                              className="vote-fill"
                              style={{ width: `${Math.min(100, (nbVotes / majorite) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="vote-count">{nbVotes}/{majorite}</span>
                        </div>

                        <div className="vote-voters">
                          {nbVotes > 0 ? `Validé par ${nomsVotants}` : "Aucun vote pour l'instant"}
                        </div>

                        <div className="vote-bottom">
                          <span className={`vote-timer ${minutesRestantes <= 10 ? 'warn' : ''}`}>
                            Expire dans {minutesRestantes} min
                          </span>

                          {estMoi ? (
                            <button
                              className="vote-action-btn retirer"
                              onClick={() => retirerTentative(t)}
                              disabled={actionEnCoursVote === t.id}
                            >
                              ✕ Retirer ma quête
                            </button>
                          ) : dejaVote ? (
                            <button className="vote-action-btn deja-vote" disabled>Déjà voté</button>
                          ) : (
                            <button
                              className="vote-action-btn voter"
                              onClick={() => setTentativePourVote(t)}
                              disabled={actionEnCoursVote === t.id}
                            >
                              Voter pour cette quête
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

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

            <div className="se-field-label">Points d'Alis utilisables par joueur</div>
            <input
              type="number"
              className="se-input"
              min={0}
              max={30}
              value={budgetAlis}
              onChange={(e) => setBudgetAlis(e.target.value)}
            />

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

      {tentativePourVote && (
        <ModaleConfirmationVote
          tentative={tentativePourVote}
          majorite={majorite}
          onAnnuler={() => setTentativePourVote(null)}
          onConfirmer={() => confirmerVote(tentativePourVote)}
          enCours={actionEnCoursVote === tentativePourVote.id}
        />
      )}
    </div>
  )
}

function ModaleConfirmationVote({ tentative, majorite, onAnnuler, onConfirmer, enCours }) {
  const nbVotesApres = tentative.votes.length + 1

  return (
    <div className="overlay" onClick={onAnnuler}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
        </div>
        <h2>Confirmer la quête de <span className="who">{tentative.joueur.pseudo}</span> ?</h2>
        <p>
          Tu confirmes avoir vu {tentative.joueur.pseudo} réussir « {tentative.quete.titre} ».
          Ton vote compte pour {nbVotesApres}/{majorite}.
        </p>
        <div className="modal-actions">
          <button className="btn-annuler" onClick={onAnnuler} disabled={enCours}>Annuler</button>
          <button className="btn-confirmer" onClick={onConfirmer} disabled={enCours}>
            {enCours ? '...' : 'Je confirme'}
          </button>
        </div>
      </div>
    </div>
  )
}
