// Nom du cache → incrémente quand tu modifies des fichiers importants
const CACHE_NAME = "credesi-cache-v3";

// Liste des fichiers à pré-cacher (modifie selon ton projet)
const urlsToCache = [
  "/",
  "/index.html",

  // Styles
  "/style/style.css",
  "/style/cours.css",
  "/style/loader.css",
  "/style/mise_a_jour_panneau.css",
  "/style/pdf.css",
  "/style/popup.css",
  "/style/secretariat.css",

  // Scripts
  "/script/script.js",
  "/script/cours.js",
  "/script/loader.js",
  "/script/pdf.js",
  "/script/popup.js",

  // Images / Logos
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/img/Logo CredESI/CredESI-Logo1.png",
  "/img/Logo CredESI/CredESI-Logo2.png",
  "/img/Logo CredESI/iconv2.png",
  "/img/Logo Discord/ESI1.png",
  "/img/Logo Discord/ESI2.png",

  // Page fallback offline
  "/offline.html",
];

// Installation → met les fichiers en cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Mise en cache des fichiers initiaux");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activation → supprime les vieux caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("🗑️ Suppression ancien cache :", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch → stratégie "stale-while-revalidate"
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Si on a une bonne réponse → on la met à jour en cache
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Si pas de réseau et pas de cache → renvoie offline.html
            if (event.request.mode === "navigate") {
              return cache.match("/offline.html");
            }
          });

        // Renvoie le cache immédiatement si dispo, sinon attend le réseau
        return cachedResponse || fetchPromise;
      });
    })
  );
});
