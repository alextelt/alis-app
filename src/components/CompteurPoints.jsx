import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import './CompteurPoints.css'

const COULEURS_JOUEURS = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0', '#FF9800', '#009688', '#E91E63', '#3F51B5']
const NOMBRES_RAPIDES = [1, 2, 3, 4, 5, 6, 7]
const DELAI_CUMUL = 1600

export default function CompteurPoints({ onFermer }) {
  const { user } = useAuth()
  const [etape, setEtape] = useState('accueil')
  const [partiesSauvegardees, setPartiesSauvegardees] = useState([])
  const [chargementAccueil, setChargementAccueil] = useState(true)
  const [nombreJoueurs, setNombreJoueurs] = useState(4)
  const [nomPartie, setNomPartie] = useState('')
  const [joueurs, setJoueurs] = useState([])
  const [partieId, setPartieId] = useState(null)
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [cumulEnCours, setCumulEnCours] = useState({})
  const cumulRef = useRef({})
  const timersRef = useRef({})

  const chargerParties = useCallback(async () => {
    setChargementAccueil(true)
    const { data, error } = await supabase
      .from('parties_compteur')
      .select('*')
      .eq('profile_id', user.id)
      .order('date_maj', { ascending: false })
      .limit(3)

    if (!error) {
      setPartiesSauvegardees(data || [])
      if (!data || data.length === 0) setEtape('parametres')
    }
    setChargementAccueil(false)
  }, [user.id])

  useEffect(() => {
    chargerParties()
  }, [chargerParties])

  // Sauvegarde automatique de la partie en cours à chaque changement de score
  useEffect(() => {
    if (etape !== 'jeu' || !partieId) return
    supabase
      .from('parties_compteur')
      .update({ joueurs, date_maj: new Date().toISOString() })
      .eq('id', partieId)
      .then(({ error }) => {
        if (error) console.error('Erreur de sauvegarde de la partie :', error)
      })
  }, [joueurs, etape, partieId])

  // Nettoie tous les timers de cumul en attente au démontage du composant
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((id) => clearTimeout(id))
    }
  }, [])

  function incrementerNombre() {
    setNombreJoueurs((n) => Math.min(12, n + 1))
  }

  function nouvellePartieDepuisAccueil() {
    setNombreJoueurs(4)
    setNomPartie('')
    setJoueurs([])
    setPartieId(null)
    setEtape('parametres')
  }

  function validerParametres() {
    const nouveauxJoueurs = Array.from({ length: nombreJoueurs }, (_, i) => ({
      id: i,
      nom: `Joueur ${i + 1}`,
      couleur: COULEURS_JOUEURS[i % COULEURS_JOUEURS.length],
      score: 0,
      historique: [],
    }))
    setJoueurs(nouveauxJoueurs)
    setEtape('noms')
  }

  function renommerJoueur(id, nom) {
    setJoueurs((prev) => prev.map((j) => (j.id === id ? { ...j, nom } : j)))
  }

  async function commencerPartie() {
    setCreationEnCours(true)
    const { data, error } = await supabase
      .from('parties_compteur')
      .insert({ profile_id: user.id, nom_partie: nomPartie || null, joueurs })
      .select()
      .single()
    setCreationEnCours(false)

    if (error) {
      alert('Impossible de sauvegarder cette partie : ' + error.message)
      return
    }
    setPartieId(data.id)
    setEtape('jeu')
  }

  function ajouterAuCumul(joueurId, delta) {
    const total = (cumulRef.current[joueurId] || 0) + delta
    cumulRef.current[joueurId] = total
    setCumulEnCours((prev) => ({ ...prev, [joueurId]: total }))

    if (timersRef.current[joueurId]) {
      clearTimeout(timersRef.current[joueurId])
    }

    timersRef.current[joueurId] = setTimeout(() => {
      const montant = cumulRef.current[joueurId] || 0
      cumulRef.current[joueurId] = 0
      delete timersRef.current[joueurId]

      setCumulEnCours((prev) => ({ ...prev, [joueurId]: 0 }))

      if (montant !== 0) {
        setJoueurs((prev) =>
          prev.map((j) =>
            j.id === joueurId
              ? { ...j, score: j.score + montant, historique: [{ delta: montant, ts: Date.now() }, ...j.historique] }
              : j
          )
        )
      }
    }, DELAI_CUMUL)
  }

  function reprendrePartie(partie) {
    annulerCumulsEnAttente()
    setJoueurs(partie.joueurs || [])
    setPartieId(partie.id)
    setNomPartie(partie.nom_partie || '')
    setEtape('jeu')
  }

  async function supprimerPartie(id) {
    if (!confirm('Supprimer cette partie sauvegardée ?')) return
    const { error } = await supabase.from('parties_compteur').delete().eq('id', id)
    if (error) {
      alert('Impossible de supprimer cette partie : ' + error.message)
      return
    }
    setPartiesSauvegardees((prev) => prev.filter((p) => p.id !== id))
  }

  function annulerCumulsEnAttente() {
    Object.values(timersRef.current).forEach((id) => clearTimeout(id))
    timersRef.current = {}
    cumulRef.current = {}
    setCumulEnCours({})
  }

  function reinitialiserScores() {
    if (!confirm('Remettre tous les scores à 0 ?')) return
    annulerCumulsEnAttente()
    setJoueurs((prev) => prev.map((j) => ({ ...j, score: 0, historique: [] })))
  }

  function retourAccueil() {
    annulerCumulsEnAttente()
    setJoueurs([])
    setPartieId(null)
    setNomPartie('')
    setNombreJoueurs(4)
    setEtape('accueil')
    chargerParties()
  }

  return (
    <div className="cp-overlay">
      <button className="cp-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      {etape === 'accueil' && (
        <div className="cp-step">
          <h2 className="cp-title">Compteur de points</h2>

          {chargementAccueil ? (
            <div className="cp-loading">Chargement des parties...</div>
          ) : (
            <>
              {partiesSauvegardees.length === 0 ? (
                <div className="cp-empty">Aucune partie sauvegardée pour l'instant.</div>
              ) : (
                <div className="cp-parties-list">
                  {partiesSauvegardees.map((p) => (
                    <div key={p.id} className="cp-partie-card">
                      <div className="cp-partie-top">
                        <div className="cp-partie-nom">
                          {p.nom_partie || `Partie du ${formaterDate(p.date_creation)}`}
                        </div>
                        <button
                          className="cp-partie-delete"
                          onClick={() => supprimerPartie(p.id)}
                          type="button"
                        >
                          ✕ Supprimer
                        </button>
                      </div>
                      <div className="cp-partie-scores">
                        {(p.joueurs || []).map((j) => (
                          <span key={j.id} className="cp-partie-score-chip" style={{ background: j.couleur }}>
                            {j.nom} · {j.score}
                          </span>
                        ))}
                      </div>
                      <button className="cp-primary-btn" onClick={() => reprendrePartie(p)} type="button">
                        Reprendre
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="cp-secondary-btn" onClick={nouvellePartieDepuisAccueil} type="button">
                + Nouvelle partie
              </button>
            </>
          )}
        </div>
      )}

      {etape === 'parametres' && (
        <div className="cp-step">
          <h2 className="cp-title">Nouvelle partie</h2>

          <div className="cp-field-label">Nombre de participants</div>
          <div className="cp-nombre-grid">
            {NOMBRES_RAPIDES.map((n) => (
              <button
                key={n}
                className={`cp-nombre-btn ${nombreJoueurs === n ? 'active' : ''}`}
                onClick={() => setNombreJoueurs(n)}
                type="button"
              >
                {n}
              </button>
            ))}
            <button
              className={`cp-nombre-btn ${nombreJoueurs > 7 ? 'active' : ''}`}
              onClick={incrementerNombre}
              disabled={nombreJoueurs >= 12}
              type="button"
            >
              {nombreJoueurs > 7 ? nombreJoueurs : '+'}
            </button>
          </div>

          <div className="cp-field-label">Nom de la partie (optionnel)</div>
          <input
            type="text"
            className="cp-input"
            placeholder="Ex: Soirée jeux"
            value={nomPartie}
            onChange={(e) => setNomPartie(e.target.value)}
          />

          <button className="cp-primary-btn" onClick={validerParametres} type="button">
            Suivant
          </button>
        </div>
      )}

      {etape === 'noms' && (
        <div className="cp-step">
          <button className="cp-back-btn" onClick={() => setEtape('parametres')} type="button">
            ← Retour
          </button>

          <h2 className="cp-title">Les joueurs</h2>

          <div className="cp-noms-list">
            {joueurs.map((j) => (
              <div key={j.id} className="cp-nom-row">
                <span className="cp-nom-dot" style={{ background: j.couleur }} />
                <input
                  type="text"
                  className="cp-input cp-nom-input"
                  value={j.nom}
                  onChange={(e) => renommerJoueur(j.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="cp-primary-btn" onClick={commencerPartie} disabled={creationEnCours} type="button">
            {creationEnCours ? 'Création...' : 'Commencer la partie'}
          </button>
        </div>
      )}

      {etape === 'jeu' && (
        <div className="cp-step cp-step-jeu">
          <div className="cp-jeu-header">
            <div className="cp-jeu-header-btns">
              <button className="cp-jeu-header-btn" onClick={retourAccueil} type="button">
                Nouvelle partie
              </button>
              <button className="cp-jeu-header-btn cp-jeu-header-btn-danger" onClick={reinitialiserScores} type="button">
                Réinitialiser
              </button>
            </div>
            {nomPartie && <div className="cp-jeu-title">{nomPartie}</div>}
          </div>

          <div className="cp-scores-grid">
            {joueurs.map((j) => {
              const cumul = cumulEnCours[j.id] || 0
              return (
              <div key={j.id} className="cp-score-card" style={{ background: j.couleur }}>
                <div className="cp-score-name">{j.nom}</div>
                <div className="cp-score-buttons">
                  <button onClick={() => ajouterAuCumul(j.id, -10)} type="button">−10</button>
                  <button onClick={() => ajouterAuCumul(j.id, -5)} type="button">−5</button>
                  <button onClick={() => ajouterAuCumul(j.id, -1)} type="button">−1</button>
                </div>
                {cumul !== 0 && (
                  <div className="cp-cumul-pill">{cumul > 0 ? `+${cumul}` : cumul}</div>
                )}
                <div className="cp-score-value">{j.score}</div>
                <div className="cp-score-buttons">
                  <button onClick={() => ajouterAuCumul(j.id, 1)} type="button">+1</button>
                  <button onClick={() => ajouterAuCumul(j.id, 5)} type="button">+5</button>
                  <button onClick={() => ajouterAuCumul(j.id, 10)} type="button">+10</button>
                </div>
                <div className="cp-score-historique">
                  {j.historique.slice(0, 12).map((h) => (
                    <span key={h.ts} className="cp-historique-pill">
                      {h.delta > 0 ? `+${h.delta}` : h.delta}
                    </span>
                  ))}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formaterDate(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
