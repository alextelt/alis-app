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
// selon la règle : 5 XP pour le niveau 2, puis +10% par niveau suivant
export function calculerNiveau(xpTotal) {
  let niveau = 1
  let xpPourProchainNiveau = 5
  let xpCumule = 0

  while (xpTotal >= xpCumule + xpPourProchainNiveau) {
    xpCumule += xpPourProchainNiveau
    niveau += 1
    xpPourProchainNiveau = Math.round(xpPourProchainNiveau * 1.1)
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

// Palette d'avatars : emoji + couleur de fond, thème médiéval-fantastique / pride
export const AVATARS = [
  { emoji: '🦄', bg: '#7B4B9E' },
  { emoji: '🦄', bg: '#C9598A' },
  { emoji: '🦄', bg: '#4A8AA8' },
  { emoji: '🐉', bg: '#4A5D3A' },
  { emoji: '🐉', bg: '#7A3131' },
  { emoji: '🐲', bg: '#A9843F' },
  { emoji: '🐲', bg: '#3A5A6E' },
  { emoji: '⚔️', bg: '#4A3B28' },
  { emoji: '🛡️', bg: '#5A4A2E' },
  { emoji: '🏰', bg: '#6E5B3E' },
  { emoji: '👑', bg: '#A9843F' },
  { emoji: '👑', bg: '#8B3E5A' },
  { emoji: '🧙', bg: '#5A3E7A' },
  { emoji: '🧙‍♀️', bg: '#3E5A7A' },
  { emoji: '🧙‍♂️', bg: '#5A7A3E' },
  { emoji: '🧚', bg: '#C9598A' },
  { emoji: '🧚‍♀️', bg: '#598AC9' },
  { emoji: '🧚‍♂️', bg: '#59C9A8' },
  { emoji: '🧝', bg: '#3E7A5A' },
  { emoji: '🧝‍♀️', bg: '#7A5A3E' },
  { emoji: '🧞', bg: '#7A3E5A' },
  { emoji: '🧜', bg: '#3E7A9E' },
  { emoji: '✨', bg: '#8B6F3E' },
  { emoji: '🌟', bg: '#6E5B3E' },
  { emoji: '⭐', bg: '#4A3B28' },
  { emoji: '🌈', bg: '#7B4B9E' },
  { emoji: '🏳️‍🌈', bg: '#5A3E7A' },
  { emoji: '🏳️‍⚧️', bg: '#598AC9' },
  { emoji: '💜', bg: '#5A3E7A' },
  { emoji: '💎', bg: '#3E7A9E' },
  { emoji: '🔮', bg: '#5A3E7A' },
  { emoji: '🌹', bg: '#7A3145' },
  { emoji: '🥚', bg: '#4A5D3A' },
  { emoji: '🔥', bg: '#7A3131' },
  { emoji: '🌙', bg: '#3E3E6E' },
  { emoji: '🪄', bg: '#7A5A3E' },
  { emoji: '🧪', bg: '#3E7A5A' },
  { emoji: '📜', bg: '#6E5B3E' },
  { emoji: '🗝️', bg: '#8B6F3E' },
  { emoji: '🎭', bg: '#5A3E5A' },
]

export function parserAvatar(avatarUrl) {
  if (!avatarUrl) return null
  const [emoji, bg] = avatarUrl.split('|')
  if (!emoji || !bg) return null
  return { emoji, bg }
}
