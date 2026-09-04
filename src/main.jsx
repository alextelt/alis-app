import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { afficherNotificationMiseAJour } from './updateNotifier.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const nouveauWorker = registration.installing
          if (!nouveauWorker) return

          nouveauWorker.addEventListener('statechange', () => {
            if (nouveauWorker.state === 'installed' && navigator.serviceWorker.controller) {
              afficherNotificationMiseAJour()
            }
          })
        })
      })
      .catch((err) => {
        console.warn('Enregistrement du service worker échoué :', err)
      })
  })
}
