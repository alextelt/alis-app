import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { LABELS_CATEGORIE, ORDRE_CATEGORIES, NIVEAUX_DIFFICULTE } from '../utils'
import './AdminScreen.css'

const XP_PAR_DIFFICULTE = { facile: 300, moyen: 500, difficile: 1000 }

export default function AdminScreen() {
  const { user } = useAuth()
  const [quetesProposees, setQuetesProposees] = useState([])
  const [quetesCatalogue, setQuetesCatalogue] = useState([])
  const [xpAjuste, setXpAjuste] = useState({}) // { queteId: xp }
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [actionEnCours, setActionEnCours] = useState(null)
  const [queteEnEdition, setQueteEnEdition] = useState(null)
  const [nouvelleQueteOuverte, setNouvelleQueteOuverte] = useState(false)
  const [soumissionEnCours, setSoumissionEnCours] = useState(false)

  const charger = useCallback(async () => {
    setErreur(null)
    const [proposeesRes, catalogueRes] = await Promise.all([
      supabase
        .from('quetes')
        .select('*, proposant:profiles!quetes_proposee_par_fkey(pseudo)')
        .eq('statut_catalogue', 'proposée')
        .order('date_creation'),
      supabase
        .from('quetes')
        .select('*')
        .eq('statut_catalogue', 'validée')
        .order('titre'),
    ])

    if (proposeesRes.error) setErreur(proposeesRes.error.message)
    else {
      setQuetesProposees(proposeesRes.data)
      const xpInit = {}
      for (const q of proposeesRes.data) xpInit[q.id] = q.xp_recompense
      setXpAjuste((prev) => ({ ...xpInit, ...prev }))
    }

    if (catalogueRes.error) setErreur(catalogueRes.error.message)
    else setQuetesCatalogue(catalogueRes.data)

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

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

  async function archiverQuete(quete) {
    if (!confirm(
      "Archiver cette quête ? Elle ne sera plus proposable, mais l'historique des joueurs qui l'ont déjà réalisée est conservé."
    )) return
    setActionEnCours(quete.id)
    const { error } = await supabase
      .from('quetes')
      .update({ statut_catalogue: 'archivée' })
      .eq('id', quete.id)
    setActionEnCours(null)
    if (error) {
      alert('Action impossible : ' + error.message)
      return
    }
    charger()
  }

  async function enregistrerModification(payload) {
    setSoumissionEnCours(true)
    const { error } = await supabase.from('quetes').update(payload).eq('id', queteEnEdition.id)
    setSoumissionEnCours(false)
    if (error) {
      alert('Impossible de modifier cette quête : ' + error.message)
      return
    }
    setQueteEnEdition(null)
    charger()
  }

  async function creerQuete(payload) {
    setSoumissionEnCours(true)
    const { error } = await supabase.from('quetes').insert({
      ...payload,
      statut_catalogue: 'validée',
      proposee_par: user.id,
    })
    setSoumissionEnCours(false)
    if (error) {
      alert('Impossible de créer cette quête : ' + error.message)
      return
    }
    setNouvelleQueteOuverte(false)
    charger()
  }

  if (chargement) {
    return <div className="loading-screen">Chargement de l'administration...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  return (
    <div className="page-content">
      <div className="section-title">Quêtes proposées</div>
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

      <div className="section-title admin-catalogue-title">Catalogue actuel</div>
      <button className="admin-new-btn" onClick={() => setNouvelleQueteOuverte(true)} type="button">
        + Nouvelle quête
      </button>

      {quetesCatalogue.length === 0 && (
        <div className="empty-state">Aucune quête dans le catalogue.</div>
      )}
      {quetesCatalogue.map((quete) => (
        <div key={quete.id} className="quest-review-card">
          <div className="quest-review-title">{quete.titre}</div>
          <div className="quest-review-desc">{quete.description}</div>
          <div className="quest-review-meta">
            {LABELS_CATEGORIE[quete.categorie] ?? quete.categorie} · {quete.difficulte} · {quete.xp_recompense} XP
          </div>
          <div className="admin-actions">
            <button
              className="admin-btn reject"
              onClick={() => archiverQuete(quete)}
              disabled={actionEnCours === quete.id}
              type="button"
            >
              Archiver
            </button>
            <button
              className="admin-btn edit"
              onClick={() => setQueteEnEdition(quete)}
              disabled={actionEnCours === quete.id}
              type="button"
            >
              Modifier
            </button>
          </div>
        </div>
      ))}

      {queteEnEdition && (
        <ModaleQuete
          titreModale="Modifier la quête"
          initial={queteEnEdition}
          onFermer={() => setQueteEnEdition(null)}
          onSoumettre={enregistrerModification}
          enCours={soumissionEnCours}
        />
      )}

      {nouvelleQueteOuverte && (
        <ModaleQuete
          titreModale="Nouvelle quête"
          onFermer={() => setNouvelleQueteOuverte(false)}
          onSoumettre={creerQuete}
          enCours={soumissionEnCours}
        />
      )}
    </div>
  )
}

function ModaleQuete({ titreModale, initial, onFermer, onSoumettre, enCours }) {
  const [titre, setTitre] = useState(initial?.titre ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [difficulte, setDifficulte] = useState(initial?.difficulte ?? 'facile')
  const [categorie, setCategorie] = useState(initial?.categorie ?? ORDRE_CATEGORIES[0])
  const [xp, setXp] = useState(initial?.xp_recompense ?? XP_PAR_DIFFICULTE.facile)
  const [xpModifieManuellement, setXpModifieManuellement] = useState(!!initial)

  function gererChangementDifficulte(d) {
    setDifficulte(d)
    if (!xpModifieManuellement) setXp(XP_PAR_DIFFICULTE[d])
  }

  function gererChangementXp(valeur) {
    setXpModifieManuellement(true)
    setXp(valeur)
  }

  function gererSoumission(e) {
    e.preventDefault()
    onSoumettre({
      titre: titre.trim(),
      description: description.trim(),
      difficulte,
      categorie,
      xp_recompense: Math.max(1, parseInt(xp, 10) || 1),
    })
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titreModale}</h2>
        <form onSubmit={gererSoumission}>
          <div className="field">
            <label>Titre</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="field">
            <label>Difficulté</label>
            <select value={difficulte} onChange={(e) => gererChangementDifficulte(e.target.value)}>
              {Object.keys(NIVEAUX_DIFFICULTE).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              {ORDRE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{LABELS_CATEGORIE[cat]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>XP</label>
            <input
              type="number"
              min={1}
              value={xp}
              onChange={(e) => gererChangementXp(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer} disabled={enCours}>
              Annuler
            </button>
            <button type="submit" className="btn-confirmer" disabled={enCours}>
              {enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
