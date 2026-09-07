// Vérifie si une date ISO correspond à aujourd'hui (heure locale du navigateur)
export function estAujourdhui(dateIso) {
  const d = new Date(dateIso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

// Compare deux dates selon le "jour de jeu" (6h du matin à 6h du matin), pas le jour calendaire
export function memeJourDeJeu(dateIso1, dateIso2 = new Date()) {
  const decaler = (d) => {
    const date = new Date(d)
    date.setHours(date.getHours() - 6)
    return date
  }
  const d1 = decaler(dateIso1)
  const d2 = decaler(dateIso2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

// Vérifie si une date ISO date de moins d'1h
export function moinsDune_heure(dateIso) {
  const d = new Date(dateIso)
  return Date.now() - d.getTime() < 60 * 60 * 1000
}

// Minutes restantes avant expiration (1h après date_creation)
export function minutesAvantExpiration(dateIso) {
  const d = new Date(dateIso)
  const expiration = d.getTime() + 60 * 60 * 1000
  const restant = Math.max(0, Math.round((expiration - Date.now()) / 60000))
  return restant
}

// Calcule le niveau et la progression XP à partir de l'XP total,
// selon la règle : 500 XP pour le niveau 2, puis +1% par niveau suivant
export function calculerNiveau(xpTotal) {
  let niveau = 1
  let xpPourProchainNiveau = 500
  let xpCumule = 0

  while (xpTotal >= xpCumule + xpPourProchainNiveau) {
    xpCumule += xpPourProchainNiveau
    niveau += 1
    xpPourProchainNiveau = Math.round(xpPourProchainNiveau * 1.01)
  }

  const xpDansNiveauActuel = xpTotal - xpCumule

  return {
    niveau,
    xpDansNiveauActuel,
    xpPourProchainNiveau,
    progression: xpPourProchainNiveau > 0 ? xpDansNiveauActuel / xpPourProchainNiveau : 0,
  }
}

export const LABELS_CATEGORIE = {
  victoires: 'Victoires',
  enchainements: 'Enchaînements',
  resilience: 'Résilience',
  defis_sociaux: 'Défis sociaux',
  predictions: 'Prédictions',
}

export const ORDRE_CATEGORIES = ['victoires', 'enchainements', 'resilience', 'defis_sociaux', 'predictions']

export const NIVEAUX_DIFFICULTE = { facile: 1, moyen: 2, difficile: 3 }

// Palette d'avatars : créature + couleur de fond + badge optionnel, thème médiéval-fantastique / pride
export const AVATAR_CREATURES = ['🦄', '🐉', '🐲', '🧙', '🧙‍♀️', '🧙‍♂️', '🧝', '🧝‍♀️', '🧝‍♂️', '🧚', '🧚‍♀️', '🧚‍♂️', '🧞', '🧞‍♀️', '🧞‍♂️', '🧜', '🧜‍♀️', '🧜‍♂️']

export const AVATAR_COLORS = ['#7B4B9E', '#C9598A', '#4A8AA8', '#4A5D3A', '#7A3131', '#A9843F', '#3A5A6E', '#598AC9', '#59C9A8', '#3E7A9E', '#5A3E7A', '#8B6F3E']

export const AVATAR_BADGES = [null, '✨', '🌟', '⭐', '👑', '💎', '🔥', '🌈', '🏳️‍🌈', '🏳️‍⚧️', '💜', '🗡️', '🛡️', '🔮', '🌙', '🪄', '🌹']

// Accepte le nouveau format "creature|couleur|badge" et l'ancien "emoji|couleur" (sans badge)
export function parserAvatar(avatarUrl) {
  if (!avatarUrl) return null
  const parties = avatarUrl.split('|')
  const [creature, bg, badge] = parties
  if (!creature || !bg) return null
  return { creature, bg, badge: badge || null }
}
