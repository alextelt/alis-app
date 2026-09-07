import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

const DOUZE_HEURES_MS = 12 * 60 * 60 * 1000

// Récupère la soirée active de l'utilisateur (créateur ou participant) et ses participants.
// Rafraîchi toutes les 30s, comme les autres hooks/écrans du projet.
export function useSoireeActive(user) {
  const [soireeActive, setSoireeActive] = useState(null)
  const [participants, setParticipants] = useState([])
  const [chargement, setChargement] = useState(true)

  const recharger = useCallback(async () => {
    if (!user) return

    const douzeHeuresAvant = new Date(Date.now() - DOUZE_HEURES_MS).toISOString()

    const { data, error } = await supabase
      .from('soirees')
      .select('*, soiree_participants!inner(profile_id)')
      .eq('statut', 'ouverte')
      .gt('date_derniere_activite', douzeHeuresAvant)
      .eq('soiree_participants.profile_id', user.id)
      .order('date_creation', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      setSoireeActive(null)
      setParticipants([])
      setChargement(false)
      return
    }

    const soiree = data[0]
    setSoireeActive(soiree)

    const { data: participantsData, error: erreurParticipants } = await supabase
      .from('soiree_participants')
      .select('id, profile_id, profile:profiles!soiree_participants_profile_id_fkey(id, pseudo, avatar_url)')
      .eq('soiree_id', soiree.id)

    if (!erreurParticipants) {
      setParticipants(
        (participantsData || []).map((p) => ({
          id: p.id,
          profileId: p.profile_id,
          pseudo: p.profile?.pseudo,
          avatarUrl: p.profile?.avatar_url,
        }))
      )
    }

    setChargement(false)
  }, [user])

  useEffect(() => {
    recharger()
    const interval = setInterval(recharger, 30000)
    return () => clearInterval(interval)
  }, [recharger])

  const nbParticipants = participants.length
  const majorite = Math.floor(nbParticipants / 2) + 1

  return { soireeActive, participants, nbParticipants, majorite, chargement, recharger }
}
