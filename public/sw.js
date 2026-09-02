const CACHE_NAME = 'alis-v1'
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ne jamais mettre en cache les appels à Supabase : on veut toujours des données fraîches
  if (url.hostname.includes('supabase.co')) {
    return
  }

  // Seules les requêtes GET peuvent être mises en cache
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((reponseEnCache) => {
      if (reponseEnCache) return reponseEnCache

      return fetch(event.request)
        .then((reponseReseau) => {
          const copie = reponseReseau.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie))
          return reponseReseau
        })
        .catch(() => caches.match('/'))
    })
  )
})
