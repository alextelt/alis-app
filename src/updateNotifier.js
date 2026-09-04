// Affiche une bannière fixe invitant l'utilisateur à recharger l'appli
// quand une nouvelle version du service worker a été installée.
export function afficherNotificationMiseAJour() {
  if (document.querySelector('.update-banner')) return

  const banniere = document.createElement('div')
  banniere.className = 'update-banner'

  const texte = document.createElement('span')
  texte.className = 'update-banner-text'
  texte.textContent = 'Nouvelle version disponible'

  const bouton = document.createElement('button')
  bouton.type = 'button'
  bouton.className = 'update-banner-btn'
  bouton.textContent = 'Actualiser'
  bouton.onclick = () => window.location.reload()

  banniere.appendChild(texte)
  banniere.appendChild(bouton)
  document.body.appendChild(banniere)
}
