const CACHE_NAME = 'alis-v2'
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

// Réseau d'abord, cache en secours (pour le HTML et les assets JS/CSS : toujours la dernière version si en ligne)
async function networkFirst(request) {
  try {
    const reponseReseau = await fetch(request)
    const copie = reponseReseau.clone()
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, copie)
    return reponseReseau
  } catch {
    const reponseEnCache = await caches.match(request)
    return reponseEnCache || caches.match('/')
  }
}

// Cache d'abord, réseau en secours (pour les images/icônes qui changent rarement)
async function cacheFirst(request) {
  const reponseEnCache = await caches.match(request)
  if (reponseEnCache) return reponseEnCache

  const reponseReseau = await fetch(request)
  const copie = reponseReseau.clone()
  const cache = await caches.open(CACHE_NAME)
  cache.put(request, copie)
  return reponseReseau
}

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

  const estImage =
    event.request.destination === 'image' ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)

  event.respondWith(estImage ? cacheFirst(event.request) : networkFirst(event.request))
})
