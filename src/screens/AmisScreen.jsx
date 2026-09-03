import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { calculerNiveau } from '../utils'
import Avatar from '../components/Avatar'
import './AmisScreen.css'

export default function AmisScreen({ onRetour }) {
  const { user } = useAuth()
  const [demandesRecues, setDemandesRecues] = useState([])
  const [demandesEnvoyees, setDemandesEnvoyees] = useState([])
  const [amis, setAmis] = useState([])
  const [competencesParAmi, setCompetencesParAmi] = useState({})
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)

  const [pseudoRecherche, setPseudoRecherche] = useState('')
  const [rechercheEnCours, setRechercheEnCours] = useState(false)
  const [erreurRecherche, setErreurRecherche] = useState(null)
  const [resultatRecherche, setResultatRecherche] = useState(null)

  const charger = useCallback(async () => {
    setErreur(null)

    const [recuesRes, envoyeesRes, amisRes] = await Promise.all([
      supabase
        .from('amities')
        .select('id, date_creation, demandeur:profiles!amities_demandeur_id_fkey(id, pseudo, avatar_url)')
        .eq('destinataire_id', user.id)
        .eq('statut', 'en_attente')
        .order('date_creation', { ascending: false }),
      supabase
        .from('amities')
        .select('id, date_creation, destinataire:profiles!amities_destinataire_id_fkey(id, pseudo, avatar_url)')
        .eq('demandeur_id', user.id)
        .eq('statut', 'en_attente')
        .order('date_creation', { ascending: false }),
      supabase
        .from('amities')
        .select(`
          id, demandeur_id, destinataire_id,
          demandeur:profiles!amities_demandeur_id_fkey(id, pseudo, avatar_url, xp_total),
          destinataire:profiles!amities_destinataire_id_fkey(id, pseudo, avatar_url, xp_total)
        `)
        .eq('statut', 'acceptée')
        .or(`demandeur_id.eq.${user.id},destinataire_id.eq.${user.id}`),
    ])

    if (recuesRes.error) setErreur(recuesRes.error.message)
    else setDemandesRecues(recuesRes.data.map((d) => ({ id: d.id, autre: d.demandeur })))

    if (envoyeesRes.error) setErreur(envoyeesRes.error.message)
    else setDemandesEnvoyees(envoyeesRes.data.map((d) => ({ id: d.id, autre: d.destinataire })))

    if (amisRes.error) {
      setErreur(amisRes.error.message)
    } else {
      const listeAmis = amisRes.data.map((a) => ({
        id: a.id,
        autre: a.demandeur_id === user.id ? a.destinataire : a.demandeur,
      }))
      setAmis(listeAmis)

      const amiIds = listeAmis.map((a) => a.autre.id)
      if (amiIds.length > 0) {
        const { data: compData, error: compError } = await supabase
          .from('profiles_competences')
          .select('profile_id, points_investis, competence:competences_aloxis(*)')
          .in('profile_id', amiIds)
          .gt('points_investis', 0)

        if (!compError) {
          const parAmi = {}
          for (const c of compData) {
            if (!parAmi[c.profile_id]) parAmi[c.profile_id] = []
            parAmi[c.profile_id].push(c)
          }
          setCompetencesParAmi(parAmi)
        }
      } else {
        setCompetencesParAmi({})
      }
    }

    setChargement(false)
  }, [user.id])

  useEffect(() => {
    charger()
  }, [charger])

  function relationAvec(profilId) {
    if (amis.some((a) => a.autre.id === profilId)) return 'ami'
    if (demandesEnvoyees.some((d) => d.autre.id === profilId)) return 'envoyee'
    if (demandesRecues.some((d) => d.autre.id === profilId)) return 'recue'
    return 'aucune'
  }

  async function rechercher(e) {
    e.preventDefault()
    const pseudoTrim = pseudoRecherche.trim()
    if (!pseudoTrim) return

    setErreurRecherche(null)
    setResultatRecherche(null)
    setRechercheEnCours(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, pseudo, avatar_url')
      .eq('statut_validation', 'approuvé')
      .neq('id', user.id)
      .ilike('pseudo', pseudoTrim)
      .maybeSingle()
    setRechercheEnCours(false)

    if (error) {
      setErreurRecherche(error.message)
      return
    }
    if (!data) {
      setErreurRecherche('Aucun joueur trouvé avec ce pseudo.')
      return
    }
    setResultatRecherche(data)
  }

  async function envoyerDemande(destinataireId) {
    setActionEnCours(destinataireId)
    const { error } = await supabase.from('amities').insert({
      demandeur_id: user.id,
      destinataire_id: destinataireId,
      statut: 'en_attente',
    })
    setActionEnCours(null)
    if (error) {
      alert("Impossible d'envoyer la demande : " + error.message)
      return
    }
    setResultatRecherche(null)
    setPseudoRecherche('')
    charger()
  }

  async function accepterDemande(id) {
    setActionEnCours(id)
    const { error } = await supabase.from('amities').update({ statut: 'acceptée' }).eq('id', id)
    setActionEnCours(null)
    if (error) {
      alert('Impossible d\'accepter cette demande : ' + error.message)
      return
    }
    charger()
  }

  async function refuserDemande(id) {
    setActionEnCours(id)
    const { error } = await supabase.from('amities').delete().eq('id', id)
    setActionEnCours(null)
    if (error) {
      alert('Impossible de refuser cette demande : ' + error.message)
      return
    }
    charger()
  }

  async function annulerDemande(id) {
    setActionEnCours(id)
    const { error } = await supabase.from('amities').delete().eq('id', id)
    setActionEnCours(null)
    if (error) {
      alert("Impossible d'annuler cette demande : " + error.message)
      return
    }
    charger()
  }

  async function retirerAmi(id, pseudo) {
    if (!confirm(`Retirer ${pseudo} de tes amis ?`)) return
    setActionEnCours(id)
    const { error } = await supabase.from('amities').delete().eq('id', id)
    setActionEnCours(null)
    if (error) {
      alert('Impossible de retirer cet ami : ' + error.message)
      return
    }
    charger()
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
    return <div className="loading-screen">Chargement de tes amis...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  const relationRecherche = resultatRecherche ? relationAvec(resultatRecherche.id) : null

  return (
    <div className="page-content">
      <button className="retour-btn" onClick={onRetour} type="button">← Retour</button>

      <div className="section-title">Rechercher un joueur</div>
      <form className="ami-search-form" onSubmit={rechercher}>
        <input
          type="text"
          placeholder="Pseudo exact"
          value={pseudoRecherche}
          onChange={(e) => {
            setPseudoRecherche(e.target.value)
            setResultatRecherche(null)
            setErreurRecherche(null)
          }}
        />
        <button type="submit" disabled={rechercheEnCours || !pseudoRecherche.trim()}>
          {rechercheEnCours ? '...' : 'Chercher'}
        </button>
      </form>

      {erreurRecherche && <div className="ami-search-error">{erreurRecherche}</div>}

      {resultatRecherche && (
        <div className="ami-card">
          <div className="ami-card-top">
            <Avatar pseudo={resultatRecherche.pseudo} avatarUrl={resultatRecherche.avatar_url} size={36} />
            <div className="ami-card-name">{resultatRecherche.pseudo}</div>
          </div>
          {relationRecherche === 'aucune' && (
            <button
              className="ami-action-btn envoyer"
              onClick={() => envoyerDemande(resultatRecherche.id)}
              disabled={actionEnCours === resultatRecherche.id}
            >
              Envoyer une demande
            </button>
          )}
          {relationRecherche === 'envoyee' && <span className="ami-status">Demande déjà envoyée</span>}
          {relationRecherche === 'recue' && <span className="ami-status">Vous a envoyé une demande</span>}
          {relationRecherche === 'ami' && <span className="ami-status">Déjà ami·e</span>}
        </div>
      )}

      <div className="section-title">Demandes reçues</div>
      {demandesRecues.length === 0 && (
        <div className="empty-state">Aucune demande reçue.</div>
      )}
      {demandesRecues.length > 0 && (
        <div className="amis-list">
          {demandesRecues.map((d) => (
            <div key={d.id} className="ami-request-row">
              <Avatar pseudo={d.autre.pseudo} avatarUrl={d.autre.avatar_url} size={32} />
              <div className="ami-request-name">{d.autre.pseudo}</div>
              <div className="ami-request-actions">
                <button
                  className="ami-action-btn refuser"
                  onClick={() => refuserDemande(d.id)}
                  disabled={actionEnCours === d.id}
                >
                  Refuser
                </button>
                <button
                  className="ami-action-btn accepter"
                  onClick={() => accepterDemande(d.id)}
                  disabled={actionEnCours === d.id}
                >
                  Accepter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Demandes envoyées</div>
      {demandesEnvoyees.length === 0 && (
        <div className="empty-state">Aucune demande envoyée.</div>
      )}
      {demandesEnvoyees.length > 0 && (
        <div className="amis-list">
          {demandesEnvoyees.map((d) => (
            <div key={d.id} className="ami-request-row">
              <Avatar pseudo={d.autre.pseudo} avatarUrl={d.autre.avatar_url} size={32} />
              <div className="ami-request-name">{d.autre.pseudo}</div>
              <div className="ami-request-actions">
                <button
                  className="ami-action-btn annuler"
                  onClick={() => annulerDemande(d.id)}
                  disabled={actionEnCours === d.id}
                >
                  Annuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Mes amis</div>
      {amis.length === 0 && (
        <div className="empty-state">Tu n'as pas encore d'amis.</div>
      )}
      {amis.length > 0 && (
        <div className="amis-list">
          {amis.map((a) => {
            const { niveau } = calculerNiveau(a.autre.xp_total)
            const competences = competencesParAmi[a.autre.id] || []
            return (
              <div key={a.id} className="ami-friend-card">
                <div className="ami-friend-top">
                  <Avatar pseudo={a.autre.pseudo} avatarUrl={a.autre.avatar_url} size={40} />
                  <div className="ami-friend-info">
                    <div className="ami-friend-name">{a.autre.pseudo}</div>
                    <div className="ami-friend-level">Niveau {niveau}</div>
                  </div>
                  <button
                    className="ami-action-btn retirer"
                    onClick={() => retirerAmi(a.id, a.autre.pseudo)}
                    disabled={actionEnCours === a.id}
                  >
                    Retirer
                  </button>
                </div>
                {competences.length > 0 && (
                  <div className="ami-friend-competences">
                    {competences.map((c) => (
                      <div key={c.competence.id} className="ami-friend-competence">
                        <span className="ami-friend-competence-name">{c.competence.nom}</span>
                        <span className="ami-friend-competence-effect">{effetActuel(c.competence, c.points_investis)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
