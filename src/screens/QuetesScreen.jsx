import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { estAujourdhui, moinsDune_heure, LABELS_CATEGORIE, ORDRE_CATEGORIES, NIVEAUX_DIFFICULTE } from '../utils'
import './QuetesScreen.css'

export default function QuetesScreen() {
  const { user } = useAuth()
  const [quetes, setQuetes] = useState([])
  const [mesValidations, setMesValidations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [filtre, setFiltre] = useState('toutes')
  const [lancementEnCours, setLancementEnCours] = useState(null)

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
      (v) => v.quete_id === queteId && v.statut === 'validée' && estAujourdhui(v.date_creation)
    )
    if (validee) return { type: 'fait' }

    const enAttente = mesValidations.find(
      (v) => v.quete_id === queteId && v.statut === 'en_attente' && moinsDune_heure(v.date_creation)
    )
    if (enAttente) return { type: 'en_attente' }

    return { type: 'disponible' }
  }

  async function lancerQuete(quete) {
    setLancementEnCours(quete.id)
    const { error } = await supabase.from('quetes_validations').insert({
      quete_id: quete.id,
      joueur_id: user.id,
      statut: 'en_attente',
    })
    setLancementEnCours(null)
    if (error) {
      alert("Impossible de lancer cette quête : " + error.message)
      return
    }
    charger()
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
                  onLancer={() => lancerQuete(quete)}
                  lancementEnCours={lancementEnCours === quete.id}
                />
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function CarteQuete({ quete, etat, onLancer, lancementEnCours }) {
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
          <button className="quest-action lancer" onClick={onLancer} disabled={lancementEnCours}>
            {lancementEnCours ? 'Lancement...' : 'Lancer la quête'}
          </button>
        )}
      </div>
    </div>
  )
}
