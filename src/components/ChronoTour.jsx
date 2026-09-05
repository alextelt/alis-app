import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import './ChronoTour.css'

const COULEURS_JOUEURS = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0', '#FF9800', '#009688', '#E91E63', '#3F51B5']
const NOMBRES_RAPIDES = [1, 2, 3, 4, 5, 6, 7]
const TEMPS_RAPIDES = [
  { label: '1 min', valeur: 60 },
  { label: '3 min', valeur: 180 },
  { label: '5 min', valeur: 300 },
  { label: '10 min', valeur: 600 },
]
const DELAI_SAUVEGARDE = 2000

export default function ChronoTour({ onFermer }) {
  const { user } = useAuth()
  const [etape, setEtape] = useState('accueil')
  const [partiesSauvegardees, setPartiesSauvegardees] = useState([])
  const [chargementAccueil, setChargementAccueil] = useState(true)
  const [mode, setMode] = useState('compte_a_rebours')
  const [nombreJoueurs, setNombreJoueurs] = useState(2)
  const [tempsInitialSecondes, setTempsInitialSecondes] = useState(300)
  const [nomPartie, setNomPartie] = useState('')
  const [joueurs, setJoueurs] = useState([])
  const [partieId, setPartieId] = useState(null)
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [joueurActifIndex, setJoueurActifIndex] = useState(0)
  const [enPause, setEnPause] = useState(false)

  const chargerParties = useCallback(async () => {
    setChargementAccueil(true)
    const { data, error } = await supabase
      .from('parties_chrono')
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

  // Fait tourner le temps du joueur actif toutes les 100ms
  useEffect(() => {
    if (etape !== 'jeu' || enPause) return
    const interval = setInterval(() => {
      setJoueurs((prev) =>
        prev.map((j, i) => {
          if (i !== joueurActifIndex) return j
          if (mode === 'compte_a_rebours') {
            return { ...j, tempsRestant: Math.max(0, j.tempsRestant - 0.1) }
          }
          return { ...j, tempsEcoule: j.tempsEcoule + 0.1 }
        })
      )
    }, 100)
    return () => clearInterval(interval)
  }, [etape, enPause, joueurActifIndex, mode])

  // Sauvegarde différée de la partie en cours : le chrono tique toutes les 100ms,
  // on ne sauvegarde donc qu'une fois la valeur stable pendant 2s (pause, changement de joueur figé...)
  useEffect(() => {
    if (etape !== 'jeu' || !partieId) return
    const timeout = setTimeout(() => {
      supabase
        .from('parties_chrono')
        .update({ joueurs, date_maj: new Date().toISOString() })
        .eq('id', partieId)
        .then(({ error }) => {
          if (error) console.error('Erreur de sauvegarde de la partie :', error)
        })
    }, DELAI_SAUVEGARDE)
    return () => clearTimeout(timeout)
  }, [joueurs, etape, partieId])

  function incrementerNombre() {
    setNombreJoueurs((n) => Math.min(8, n + 1))
  }

  function nouvellePartieDepuisAccueil() {
    setMode('compte_a_rebours')
    setNombreJoueurs(2)
    setTempsInitialSecondes(300)
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
      nombreTours: 0,
      ...(mode === 'compte_a_rebours' ? { tempsRestant: tempsInitialSecondes } : { tempsEcoule: 0 }),
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
      .from('parties_chrono')
      .insert({
        profile_id: user.id,
        nom_partie: nomPartie || null,
        mode,
        temps_initial_secondes: tempsInitialSecondes,
        joueurs,
      })
      .select()
      .single()
    setCreationEnCours(false)

    if (error) {
      alert('Impossible de sauvegarder cette partie : ' + error.message)
      return
    }
    setPartieId(data.id)
    setJoueurActifIndex(0)
    setEnPause(false)
    setEtape('jeu')
  }

  function passerAuSuivant() {
    setJoueurs((prev) =>
      prev.map((j, i) => (i === joueurActifIndex ? { ...j, nombreTours: j.nombreTours + 1 } : j))
    )
    setJoueurActifIndex((i) => (i + 1) % joueurs.length)
  }

  function reinitialiser() {
    if (!confirm('Réinitialiser tous les temps ?')) return
    setJoueurs((prev) =>
      prev.map((j) => ({
        ...j,
        nombreTours: 0,
        ...(mode === 'compte_a_rebours' ? { tempsRestant: tempsInitialSecondes } : { tempsEcoule: 0 }),
      }))
    )
    setJoueurActifIndex(0)
    setEnPause(false)
  }

  function reprendrePartie(partie) {
    setJoueurs(partie.joueurs || [])
    setMode(partie.mode)
    setTempsInitialSecondes(partie.temps_initial_secondes)
    setPartieId(partie.id)
    setNomPartie(partie.nom_partie || '')
    setJoueurActifIndex(0)
    setEnPause(true)
    setEtape('jeu')
  }

  async function supprimerPartie(id) {
    if (!confirm('Supprimer cette partie sauvegardée ?')) return
    const { error } = await supabase.from('parties_chrono').delete().eq('id', id)
    if (error) {
      alert('Impossible de supprimer cette partie : ' + error.message)
      return
    }
    setPartiesSauvegardees((prev) => prev.filter((p) => p.id !== id))
  }

  function retourAccueil() {
    setJoueurs([])
    setPartieId(null)
    setNomPartie('')
    setEtape('accueil')
    chargerParties()
  }

  function tempsDe(j) {
    return mode === 'compte_a_rebours' ? j.tempsRestant : j.tempsEcoule
  }

  function moyenneParTour(j) {
    if (j.nombreTours === 0) return null
    const consomme = mode === 'compte_a_rebours' ? tempsInitialSecondes - j.tempsRestant : j.tempsEcoule
    return consomme / j.nombreTours
  }

  const joueurActif = joueurs[joueurActifIndex]
  const expire = mode === 'compte_a_rebours' && joueurActif && joueurActif.tempsRestant <= 0

  return (
    <div className="ct-overlay">
      <button className="ct-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      {etape === 'accueil' && (
        <div className="ct-step">
          <h2 className="ct-title">Chrono de tour</h2>

          {chargementAccueil ? (
            <div className="ct-loading">Chargement des parties...</div>
          ) : (
            <>
              {partiesSauvegardees.length === 0 ? (
                <div className="ct-empty">Aucune partie sauvegardée pour l'instant.</div>
              ) : (
                <div className="ct-parties-list">
                  {partiesSauvegardees.map((p) => (
                    <div key={p.id} className="ct-partie-card">
                      <div className="ct-partie-top">
                        <div className="ct-partie-nom">
                          {p.nom_partie || `Partie du ${formaterDate(p.date_creation)}`}
                        </div>
                        <button
                          className="ct-partie-delete"
                          onClick={() => supprimerPartie(p.id)}
                          type="button"
                        >
                          ✕ Supprimer
                        </button>
                      </div>
                      <div className="ct-partie-mode">
                        {p.mode === 'compte_a_rebours' ? 'Compte à rebours' : 'Chrono'}
                      </div>
                      <div className="ct-partie-joueurs">
                        {(p.joueurs || []).map((j) => j.nom).join(', ')}
                      </div>
                      <button className="ct-primary-btn" onClick={() => reprendrePartie(p)} type="button">
                        Reprendre
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="ct-secondary-btn" onClick={nouvellePartieDepuisAccueil} type="button">
                + Nouvelle partie
              </button>
            </>
          )}
        </div>
      )}

      {etape === 'parametres' && (
        <div className="ct-step">
          <h2 className="ct-title">Chrono de tour</h2>

          <div className="ct-field-label">Mode</div>
          <div className="ct-mode-row">
            <button
              className={`ct-mode-btn ${mode === 'compte_a_rebours' ? 'active' : ''}`}
              onClick={() => setMode('compte_a_rebours')}
              type="button"
            >
              Compte à rebours
            </button>
            <button
              className={`ct-mode-btn ${mode === 'chrono' ? 'active' : ''}`}
              onClick={() => setMode('chrono')}
              type="button"
            >
              Chrono
            </button>
          </div>

          {mode === 'compte_a_rebours' && (
            <>
              <div className="ct-field-label">Temps par joueur</div>
              <div className="ct-temps-row">
                {TEMPS_RAPIDES.map((t) => (
                  <button
                    key={t.valeur}
                    className={`ct-temps-btn ${tempsInitialSecondes === t.valeur ? 'active' : ''}`}
                    onClick={() => setTempsInitialSecondes(t.valeur)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="ct-field-label">Nombre de joueurs</div>
          <div className="ct-nombre-grid">
            {NOMBRES_RAPIDES.map((n) => (
              <button
                key={n}
                className={`ct-nombre-btn ${nombreJoueurs === n ? 'active' : ''}`}
                onClick={() => setNombreJoueurs(n)}
                type="button"
              >
                {n}
              </button>
            ))}
            <button
              className={`ct-nombre-btn ${nombreJoueurs > 7 ? 'active' : ''}`}
              onClick={incrementerNombre}
              disabled={nombreJoueurs >= 8}
              type="button"
            >
              {nombreJoueurs > 7 ? nombreJoueurs : '+'}
            </button>
          </div>

          <div className="ct-field-label">Nom de la partie (optionnel)</div>
          <input
            type="text"
            className="ct-input"
            placeholder="Ex: Soirée jeux de société"
            value={nomPartie}
            onChange={(e) => setNomPartie(e.target.value)}
          />

          <button className="ct-primary-btn" onClick={validerParametres} type="button">
            Suivant
          </button>
        </div>
      )}

      {etape === 'noms' && (
        <div className="ct-step">
          <button className="ct-back-btn" onClick={() => setEtape('parametres')} type="button">
            ← Retour
          </button>

          <h2 className="ct-title">Les joueurs</h2>

          <div className="ct-noms-list">
            {joueurs.map((j) => (
              <div key={j.id} className="ct-nom-row">
                <span className="ct-nom-dot" style={{ background: j.couleur }} />
                <input
                  type="text"
                  className="ct-input"
                  value={j.nom}
                  onChange={(e) => renommerJoueur(j.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="ct-primary-btn" onClick={commencerPartie} disabled={creationEnCours} type="button">
            {creationEnCours ? 'Création...' : 'Commencer'}
          </button>
        </div>
      )}

      {etape === 'jeu' && joueurActif && (
        <div className="ct-step-jeu">
          <div className="ct-jeu-header">
            <button className="ct-jeu-header-btn" onClick={retourAccueil} type="button">
              Nouvelle partie
            </button>
            <button className="ct-jeu-header-btn" onClick={() => setEnPause((p) => !p)} type="button">
              {enPause ? '▶ Reprendre' : '⏸ Pause'}
            </button>
            <button className="ct-jeu-header-btn ct-jeu-header-btn-danger" onClick={reinitialiser} type="button">
              Réinitialiser
            </button>
          </div>

          <div
            className={`ct-zone ${expire ? 'ct-zone-expire' : ''}`}
            style={{ background: joueurActif.couleur, '--zone-color': joueurActif.couleur }}
            onClick={passerAuSuivant}
            role="button"
            tabIndex={0}
          >
            <div className="ct-zone-name">{joueurActif.nom}</div>
            <div className="ct-zone-time">{formaterTemps(tempsDe(joueurActif))}</div>
            <div className="ct-zone-hint">Touche l'écran pour passer au joueur suivant</div>
          </div>

          <div className="ct-others-list">
            {joueurs.map((j, i) => {
              if (i === joueurActifIndex) return null
              const moyenne = moyenneParTour(j)
              return (
                <div key={j.id} className="ct-other-row">
                  <span className="ct-other-dot" style={{ background: j.couleur }} />
                  <span className="ct-other-name">{j.nom}</span>
                  <span className="ct-other-time">{formaterTemps(tempsDe(j))}</span>
                  <span className="ct-other-moyenne">
                    {moyenne !== null ? `${formaterTemps(moyenne)}/tour` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formaterTemps(secondes) {
  const total = Math.max(0, Math.round(secondes))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formaterDate(dateIso) {
  const d = new Date(dateIso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
