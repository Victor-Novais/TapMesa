// TapMesa Operational Service Worker v1.0.0
// Regra de Ouro (Seção 4 / F11):
// NUNCA cachear respostas da API nem telas de mesa (/m/*).
// Cache apenas para o shell estático e assets do aplicativo.

const CACHE_NAME = "tapmesa-shell-v1";

const PRECACHE_ASSETS = [
  "/",
  "/panel",
  "/favicon.ico",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
            return null;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 0. NUNCA interceptar requisições cross-origin (ex: backend em outro subdomínio/porta)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. NUNCA interceptar nem cachear requisições para a API (/api/*)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. NUNCA interceptar nem cachear rotas públicas da mesa (/m/*)
  if (url.pathname.startsWith("/m/")) {
    return;
  }

  // 3. NUNCA interceptar Server-Sent Events (SSE) ou chamadas de mutação (POST/PUT/DELETE/PATCH)
  if (
    request.method !== "GET" ||
    request.headers.get("Accept")?.includes("text/event-stream")
  ) {
    return;
  }

  // 4. Assets estáticos do Next.js (_next/static/*) - Cache First com network fallback
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // 5. Navegação HTML - Network First com cache fallback para /panel quando offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match("/panel");
        }),
      ),
    );
  }
});

