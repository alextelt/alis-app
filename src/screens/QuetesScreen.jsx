import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { useSoireeActive } from '../useSoireeActive'
import { memeJourDeJeu, moinsDune_heure, LABELS_CATEGORIE, ORDRE_CATEGORIES, NIVEAUX_DIFFICULTE } from '../utils'
import SoireeEcran from '../components/SoireeEcran'
import './QuetesScreen.css'

export default function QuetesScreen() {
  const { user } = useAuth()
  const { soireeActive, nbParticipants, chargement: chargementSoiree } = useSoireeActive(user)
  const [quetes, setQuetes] = useState([])
  const [mesValidations, setMesValidations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [filtre, setFiltre] = useState('toutes')
  const [validationEnCours, setValidationEnCours] = useState(null)
  const [modaleProposerOuverte, setModaleProposerOuverte] = useState(false)
  const [soumissionEnCours, setSoumissionEnCours] = useState(false)
  const [soireeEcranOuvert, setSoireeEcranOuvert] = useState(false)
  const [nbEnAttenteVote, setNbEnAttenteVote] = useState(0)

  const chargerNbEnAttenteVote = useCallback(async () => {
    if (!soireeActive) {
      setNbEnAttenteVote(0)
      return
    }
    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('quetes_validations')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'en_attente')
      .eq('soiree_id', soireeActive.id)
      .gte('date_creation', uneHeureAvant)
    setNbEnAttenteVote(count ?? 0)
  }, [soireeActive])

  useEffect(() => {
    chargerNbEnAttenteVote()
    const interval = setInterval(chargerNbEnAttenteVote, 30000)
    return () => clearInterval(interval)
  }, [chargerNbEnAttenteVote])

  const charger = useCallback(async () => {
    setErreur(null)

    const [quetesRes, validationsRes] = await Promise.all([
      supabase
        .from('quetes')
        .select('*')
        .eq('statut_catalogue', 'validée')
        .order('titre'),
      supabase
        .from('quetes_validations')
        .select('*')
        .eq('joueur_id', user.id)
        .gte('date_creation', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

    if (quetesRes.error) setErreur(quetesRes.error.message)
    else setQuetes(quetesRes.data)

    if (validationsRes.error) setErreur(validationsRes.error.message)
    else setMesValidations(validationsRes.data)

    setChargement(false)
  }, [user.id])

  useEffect(() => {
    charger()
  }, [charger])

  // Détermine l'état d'une quête pour l'utilisateur courant
  function etatQuete(queteId) {
    const validee = mesValidations.find(
      (v) => v.quete_id === queteId && v.statut === 'validée' && memeJourDeJeu(v.date_creation)
    )
    if (validee) return { type: 'fait' }

    const enAttente = mesValidations.find(
      (v) =>
        v.quete_id === queteId &&
        v.statut === 'en_attente' &&
        moinsDune_heure(v.date_creation) &&
        v.soiree_id === soireeActive?.id
    )
    if (enAttente) return { type: 'en_attente' }

    return { type: 'disponible' }
  }

  async function validerQuete(quete) {
    if (!soireeActive) return
    setValidationEnCours(quete.id)
    const { error } = await supabase.from('quetes_validations').insert({
      quete_id: quete.id,
      joueur_id: user.id,
      statut: 'en_attente',
      soiree_id: soireeActive.id,
    })
    setValidationEnCours(null)
    if (error) {
      alert("Impossible de valider cette quête : " + error.message)
      return
    }
    charger()
  }

  async function proposerQuete({ titre, description, difficulte, categorie }) {
    setSoumissionEnCours(true)
    const { error } = await supabase.from('quetes').insert({
      titre,
      description,
      xp_recompense: 3,
      difficulte,
      categorie,
      statut_catalogue: 'proposée',
      proposee_par: user.id,
    })
    setSoumissionEnCours(false)
    if (error) {
      alert('Impossible de proposer cette quête : ' + error.message)
      return
    }
    alert('Ta quête a été soumise, elle apparaîtra dans le catalogue une fois validée par un admin.')
    setModaleProposerOuverte(false)
  }

  const quetesFiltrees = useMemo(() => {
    if (filtre === 'toutes') return quetes
    return quetes.filter((q) => q.categorie === filtre)
  }, [quetes, filtre])

  const quetesParCategorie = useMemo(() => {
    const groupes = {}
    for (const cat of ORDRE_CATEGORIES) groupes[cat] = []
    for (const q of quetesFiltrees) {
      if (!groupes[q.categorie]) groupes[q.categorie] = []
      groupes[q.categorie].push(q)
    }
    return groupes
  }, [quetesFiltrees])

  if (chargement) {
    return <div className="loading-screen">Chargement des quêtes...</div>
  }

  if (erreur) {
    return <div className="error-screen">Erreur : {erreur}</div>
  }

  return (
    <>
      <div className="soiree-banner-row">
        {!chargementSoiree && (
          soireeActive ? (
            <button
              className="soiree-banner active"
              onClick={() => setSoireeEcranOuvert(true)}
              type="button"
            >
              <span className="soiree-banner-dot" />
              Soirée en cours · {nbParticipants} participant{nbParticipants > 1 ? 's' : ''}
              {nbEnAttenteVote > 0 && <span className="soiree-banner-badge">{nbEnAttenteVote}</span>}
            </button>
          ) : (
            <div className="soiree-banner">
              <span>Aucune soirée en cours</span>
              <button
                className="soiree-banner-btn"
                onClick={() => setSoireeEcranOuvert(true)}
                type="button"
              >
                Créer une soirée
              </button>
            </div>
          )
        )}
      </div>

      <div className="propose-row">
        <button
          className="propose-btn"
          onClick={() => setModaleProposerOuverte(true)}
          type="button"
        >
          + Proposer une quête
        </button>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filtre === 'toutes' ? 'active' : ''}`}
          onClick={() => setFiltre('toutes')}
        >
          Toutes
        </button>
        {ORDRE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filtre === cat ? 'active' : ''}`}
            onClick={() => setFiltre(cat)}
          >
            {LABELS_CATEGORIE[cat]}
          </button>
        ))}
      </div>

      <div className="page-content">
        {quetesFiltrees.length === 0 && (
          <div className="empty-state">Aucune quête dans cette catégorie pour l'instant.</div>
        )}

        {ORDRE_CATEGORIES.map((cat) => {
          const liste = quetesParCategorie[cat]
          if (!liste || liste.length === 0) return null
          return (
            <div key={cat}>
              <div className="cat-title">{LABELS_CATEGORIE[cat]}</div>
              {liste.map((quete) => (
                <CarteQuete
                  key={quete.id}
                  quete={quete}
                  etat={etatQuete(quete.id)}
                  onValider={() => validerQuete(quete)}
                  validationEnCours={validationEnCours === quete.id}
                  soireeActive={soireeActive}
                />
              ))}
            </div>
          )
        })}
      </div>

      {modaleProposerOuverte && (
        <ModaleProposerQuete
          onFermer={() => setModaleProposerOuverte(false)}
          onSoumettre={proposerQuete}
          enCours={soumissionEnCours}
        />
      )}

      {soireeEcranOuvert && <SoireeEcran onFermer={() => setSoireeEcranOuvert(false)} />}
    </>
  )
}

function ModaleProposerQuete({ onFermer, onSoumettre, enCours }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [difficulte, setDifficulte] = useState('facile')
  const [categorie, setCategorie] = useState(ORDRE_CATEGORIES[0])

  function gererSoumission(e) {
    e.preventDefault()
    onSoumettre({
      titre: titre.trim(),
      description: description.trim(),
      difficulte,
      categorie,
    })
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="modal propose-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Proposer une quête</h2>
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
            <select value={difficulte} onChange={(e) => setDifficulte(e.target.value)}>
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
          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer} disabled={enCours}>
              Annuler
            </button>
            <button type="submit" className="btn-confirmer" disabled={enCours}>
              {enCours ? 'Envoi...' : 'Proposer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CarteQuete({ quete, etat, onValider, validationEnCours, soireeActive }) {
  const nbPoints = NIVEAUX_DIFFICULTE[quete.difficulte] || 0

  return (
    <div className="quest-card" style={{ marginBottom: 10, opacity: etat.type === 'fait' ? 0.6 : 1 }}>
      <div className="quest-top">
        <div className="quest-title">{quete.titre}</div>
        <div className="quest-xp">+{quete.xp_recompense} XP</div>
      </div>
      <div className="quest-desc">{quete.description}</div>
      <div className="quest-footer">
        <div className="difficulty">
          <div className="dots">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`dot ${n <= nbPoints ? 'on' : ''}`}></div>
            ))}
          </div>
          {quete.difficulte}
        </div>

        {etat.type === 'fait' && (
          <button className="quest-action fait" disabled>Déjà faite aujourd'hui</button>
        )}
        {etat.type === 'en_attente' && (
          <button className="quest-action attente" disabled>En attente de vote</button>
        )}
        {etat.type === 'disponible' && (
          <button
            className={`quest-action lancer ${!soireeActive ? 'sans-soiree' : ''}`}
            onClick={onValider}
            disabled={validationEnCours || !soireeActive}
          >
            {!soireeActive
              ? 'Rejoins une soirée pour valider une quête'
              : validationEnCours
                ? 'Validation...'
                : 'Valider une quête'}
          </button>
        )}
      </div>
    </div>
  )
}
