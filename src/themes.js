export const THEMES = [
  { id: 'medieval', nom: 'Médiéval' },
  { id: 'dark', nom: 'Dark' },
  { id: 'light', nom: 'Light' },
  { id: 'confort', nom: 'Confort' },
  { id: 'licorne', nom: 'Licorne' },
]

const ACCENTS_LICORNE = [
  { gold: '#9333EA', goldBright: '#A855F7' },
  { gold: '#DB2777', goldBright: '#EC4899' },
  { gold: '#0D9488', goldBright: '#14B8A6' },
  { gold: '#2563EB', goldBright: '#3B82F6' },
  { gold: '#D97706', goldBright: '#F59E0B' },
  { gold: '#DC2626', goldBright: '#EF4444' },
]

export function appliquerTheme(themeId) {
  document.documentElement.dataset.theme = themeId

  if (themeId === 'licorne') {
    const accent = ACCENTS_LICORNE[Math.floor(Math.random() * ACCENTS_LICORNE.length)]
    document.documentElement.style.setProperty('--gold', accent.gold)
    document.documentElement.style.setProperty('--gold-bright', accent.goldBright)
    document.documentElement.style.setProperty('--vert', accent.gold)
    document.documentElement.style.setProperty('--vert-bright', accent.goldBright)
  } else {
    document.documentElement.style.removeProperty('--gold')
    document.documentElement.style.removeProperty('--gold-bright')
    document.documentElement.style.removeProperty('--vert')
    document.documentElement.style.removeProperty('--vert-bright')
  }
}
