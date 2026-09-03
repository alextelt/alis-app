import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import Avatar from '../components/Avatar'
import './AdminScreen.css'

export default function AdminScreen() {
  const [onglet, setOnglet] = useState('comptes')
  const [comptes, setComptes] = useState([])
  const [quetesProposees, setQuetesProposees] = useState([])
  const [xpAjuste, setXpAjuste] = useState({}) // { queteId: xp }
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)

  const charger = useCallback(async () => {
    setErreur(null)
    const [comptesRes, quetesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('statut_validation', 'en_attente')
        .order('date_creation'),
      supabase
        .from('quetes')
        .select('*, proposant:profiles!quetes_proposee_par_fkey(pseudo)')
        .eq('statut_catalogue', 'proposée')
        .order('date_creation'),
    ])

    if (comptesRes.error) setErreur(comptesRes.error.message)
    else setComptes(comptesRes.data)

    if (quetesRes.error) setErreur(quetesRes.error.message)
    else {
      setQuetesProposees(quetesRes.data)
      const xpInit = {}
      for (const q of quetesRes.data) xpInit[q.id] = q.xp_recompense
      setXpAjuste((prev) => ({ ...xpInit, ...prev }))
    }

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  async function traiterCompte(compteId, statut) {
    setActionEnCours(compteId)
    const { error } = await supabase
      .from('profiles')
      .update({ statut_validation: statut })
      .eq('id', compteId)
    setActionEnCours(null)
    if (error) {
      alert('Action impossible : ' + error.message)
      return
    }
    charger()
  }

  async function traiterQuete(quete, statut) {
    setActionEnCours(quete.id)
    const payload = { statut_catalogue: statut }
    if (statut === 'validée') payload.xp_recompense = xpAjuste[quete.id] ?? quete.xp_recompense

    const { error } = await supabase.from('quetes').update(payload).eq('id', quete.id)
    setActionEnCours(null)
    if (error) {
      alert('Action impossible : ' + error.message)
      return
    }
    charger()
  }

  function ajusterXp(queteId, delta) {
    setXpAjuste((prev) => ({
      ...prev,
      [queteId]: Math.max(1, (prev[queteId] ?? 1) + delta),
    }))
  }

  if (chargement) {
    return <div className="loading-screen">Chargement de l'administration...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  return (
    <div className="page-content">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${onglet === 'comptes' ? 'active' : ''}`}
          onClick={() => setOnglet('comptes')}
        >
          Comptes {comptes.length > 0 && <span className="admin-badge">{comptes.length}</span>}
        </button>
        <button
          className={`admin-tab ${onglet === 'quetes' ? 'active' : ''}`}
          onClick={() => setOnglet('quetes')}
        >
          Quêtes {quetesProposees.length > 0 && <span className="admin-badge">{quetesProposees.length}</span>}
        </button>
      </div>

      {onglet === 'comptes' && (
        <>
          {comptes.length === 0 && (
            <div className="empty-state">Aucun compte en attente d'approbation.</div>
          )}
          {comptes.map((compte) => (
            <div key={compte.id} className="admin-card">
              <div className="admin-card-top">
                <Avatar pseudo={compte.pseudo} avatarUrl={compte.avatar_url} size={32} />
                <div>
                  <div className="admin-card-name">{compte.pseudo}</div>
                </div>
              </div>
              <div className="admin-card-meta">Inscrit {formaterDate(compte.date_creation)}</div>
              <div className="admin-actions">
                <button
                  className="admin-btn reject"
                  onClick={() => traiterCompte(compte.id, 'rejeté')}
                  disabled={actionEnCours === compte.id}
                >
                  ✕ Rejeter
                </button>
                <button
                  className="admin-btn approve"
                  onClick={() => traiterCompte(compte.id, 'approuvé')}
                  disabled={actionEnCours === compte.id}
                >
                  ✓ Approuver
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {onglet === 'quetes' && (
        <>
          {quetesProposees.length === 0 && (
            <div className="empty-state">Aucune quête proposée en attente.</div>
          )}
          {quetesProposees.map((quete) => (
            <div key={quete.id} className="quest-review-card">
              <div className="quest-review-title">{quete.titre}</div>
              <div className="quest-review-desc">{quete.description}</div>
              <div className="quest-review-meta">
                Proposée par <strong>{quete.proposant?.pseudo ?? 'inconnu'}</strong>
              </div>
              <div className="xp-adjust">
                <label>XP proposé</label>
                <div className="xp-adjust-controls">
                  <button className="xp-adjust-btn" onClick={() => ajusterXp(quete.id, -1)} disabled={actionEnCours === quete.id}>−</button>
                  <span className="xp-adjust-value">{xpAjuste[quete.id] ?? quete.xp_recompense}</span>
                  <button className="xp-adjust-btn" onClick={() => ajusterXp(quete.id, 1)} disabled={actionEnCours === quete.id}>+</button>
                </div>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-btn reject"
                  onClick={() => traiterQuete(quete, 'rejetée')}
                  disabled={actionEnCours === quete.id}
                >
                  ✕ Rejeter
                </button>
                <button
                  className="admin-btn approve"
                  onClick={() => traiterQuete(quete, 'validée')}
                  disabled={actionEnCours === quete.id}
                >
                  ✓ Ajouter au catalogue
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function formaterDate(dateIso) {
  const d = new Date(dateIso)
  return 'le ' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
