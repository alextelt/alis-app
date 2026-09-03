import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { minutesAvantExpiration } from '../utils'
import Avatar from '../components/Avatar'
import './VotesScreen.css'

export default function VotesScreen() {
  const { user, profile } = useAuth()
  const [tentatives, setTentatives] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [tentativePourVote, setTentativePourVote] = useState(null) // ouvre la modale
  const [actionEnCours, setActionEnCours] = useState(null) // id en cours de traitement

  const charger = useCallback(async () => {
    setErreur(null)
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
      .gte('date_creation', uneHeureAvant)
      .order('date_creation', { ascending: true })

    if (error) setErreur(error.message)
    else setTentatives(data)

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
    // Rafraîchit automatiquement toutes les 30s (pour les votes des autres, l'expiration...)
    const interval = setInterval(charger, 30000)
    return () => clearInterval(interval)
  }, [charger])

  async function confirmerVote(tentative) {
    setActionEnCours(tentative.id)
    const { error } = await supabase.from('votes').insert({
      validation_id: tentative.id,
      votant_id: user.id,
    })
    setActionEnCours(null)
    setTentativePourVote(null)
    if (error) {
      alert('Impossible d\'enregistrer ton vote : ' + error.message)
      return
    }
    charger()
  }

  async function retirerTentative(tentative) {
    if (!confirm(`Retirer ta tentative "${tentative.quete.titre}" ?`)) return
    setActionEnCours(tentative.id)
    const { error } = await supabase.from('quetes_validations').delete().eq('id', tentative.id)
    setActionEnCours(null)
    if (error) {
      alert('Impossible de retirer cette tentative : ' + error.message)
      return
    }
    charger()
  }

  if (chargement) {
    return <div className="loading-screen">Chargement des votes...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  return (
    <>
      <div style={{ padding: '0 18px' }}>
        <div className="votes-subtitle">Tentatives en attente de validation</div>
      </div>

      <div className="page-content">
        {tentatives.length === 0 && (
          <div className="empty-state">Aucune tentative en attente pour le moment.</div>
        )}

        {tentatives.map((t) => {
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
                  <div className="vote-fill" style={{ width: `${Math.min(100, (nbVotes / 3) * 100)}%` }}></div>
                </div>
                <span className="vote-count">{nbVotes}/3</span>
              </div>

              <div className="vote-voters">
                {nbVotes > 0 ? `Validé par ${nomsVotants}` : 'Aucun vote pour l\'instant'}
              </div>

              <div className="vote-bottom">
                <span className={`vote-timer ${minutesRestantes <= 10 ? 'warn' : ''}`}>
                  Expire dans {minutesRestantes} min
                </span>

                {estMoi ? (
                  <button
                    className="vote-action-btn retirer"
                    onClick={() => retirerTentative(t)}
                    disabled={actionEnCours === t.id}
                  >
                    Retirer ma quête
                  </button>
                ) : dejaVote ? (
                  <button className="vote-action-btn deja-vote" disabled>Déjà voté</button>
                ) : (
                  <button
                    className="vote-action-btn voter"
                    onClick={() => setTentativePourVote(t)}
                    disabled={actionEnCours === t.id}
                  >
                    Voter pour cette quête
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {tentativePourVote && (
        <ModaleConfirmationVote
          tentative={tentativePourVote}
          onAnnuler={() => setTentativePourVote(null)}
          onConfirmer={() => confirmerVote(tentativePourVote)}
          enCours={actionEnCours === tentativePourVote.id}
        />
      )}
    </>
  )
}

function ModaleConfirmationVote({ tentative, onAnnuler, onConfirmer, enCours }) {
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
          Ton vote compte pour {nbVotesApres}/3.
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
