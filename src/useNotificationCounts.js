import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

// Centralise les compteurs de notifications affichés en badges dans la nav du bas.
// Rafraîchi toutes les 30s, comme les écrans qui affichent ces mêmes listes.
export function useNotificationCounts(user, estAdmin) {
  const [demandesAmisEnAttente, setDemandesAmisEnAttente] = useState(0)
  const [quetesAVoterEnAttente, setQuetesAVoterEnAttente] = useState(0)
  const [elementsAdminEnAttente, setElementsAdminEnAttente] = useState(0)

  const charger = useCallback(async () => {
    if (!user) return

    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const [amisRes, votesRes] = await Promise.all([
      supabase
        .from('amities')
        .select('id', { count: 'exact', head: true })
        .eq('destinataire_id', user.id)
        .eq('statut', 'en_attente'),
      supabase
        .from('quetes_validations')
        .select('id, joueur_id, votes(votant_id)')
        .eq('statut', 'en_attente')
        .gte('date_creation', uneHeureAvant),
    ])

    if (!amisRes.error) setDemandesAmisEnAttente(amisRes.count ?? 0)

    if (!votesRes.error) {
      const aVoter = votesRes.data.filter(
        (t) => t.joueur_id !== user.id && !t.votes.some((v) => v.votant_id === user.id)
      ).length
      setQuetesAVoterEnAttente(aVoter)
    }

    if (estAdmin) {
      const [comptesRes, quetesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('statut_validation', 'en_attente'),
        supabase
          .from('quetes')
          .select('id', { count: 'exact', head: true })
          .eq('statut_catalogue', 'proposée'),
      ])
      const total = (comptesRes.count ?? 0) + (quetesRes.count ?? 0)
      setElementsAdminEnAttente(total)
    } else {
      setElementsAdminEnAttente(0)
    }
  }, [user, estAdmin])

  useEffect(() => {
    charger()
    const interval = setInterval(charger, 30000)
    return () => clearInterval(interval)
  }, [charger])

  return { demandesAmisEnAttente, quetesAVoterEnAttente, elementsAdminEnAttente }
}
