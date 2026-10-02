/*
 * Service worker mínimo do Servirea (F16). Existe para o app poder ser instalado e para mostrar uma página
 * simples sem conexão. NÃO guarda dados de negócio: nenhuma resposta da API, do portal ou de documentos é
 * armazenada, e só a página de "sem conexão" fica em cache. Navegações usam sempre a rede.
 * Mudou este arquivo? Aumente a versão para limpar o cache antigo.
 */
const VERSAO = 'servirea-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  // Só navegações GET da própria origem; tudo o mais (API, arquivos, POST) passa direto, sem cache.
  if (pedido.method !== 'GET' || pedido.mode !== 'navigate') return;
  if (new URL(pedido.url).origin !== self.location.origin) return;
  evento.respondWith(fetch(pedido).catch(() => caches.match(OFFLINE)));
});
