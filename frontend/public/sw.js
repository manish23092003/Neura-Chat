/* Lifo.sh Service Worker — routes /_sw/<boxId>/<port>/… to in-VM servers. */

/** @type {Map<string, MessagePort>} */
const hosts = new Map();
let reqId = 0;
/** @type {Map<number, {resolve: Function}>} */
const pending = new Map();

/* ── Handle messages from the main thread ── */
self.addEventListener('message', (evt) => {
  const data = evt.data;
  if (!data) return;

  if (data.type === 'lifo-connect') {
    const port = evt.ports?.[0];
    if (!port || !data.boxId) return;
    hosts.set(data.boxId, port);
    port.onmessage = (e) => {
      const msg = e.data;
      if (!msg) return;
      if (msg.type === 'response') {
        const p = pending.get(msg.requestId);
        if (p) {
          pending.delete(msg.requestId);
          p.resolve(msg);
        }
      }
    };
    port.start?.();
  }
});

/* ── Claim all clients immediately ── */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

/* ── Intercept /_sw/<boxId>/<port>/… requests ── */
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  const match = url.pathname.match(/^\/_sw\/([^/]+)\/(\d+)(\/.*)?$/);
  if (!match) return; // Not a Lifo preview request — let it pass through

  const [, boxId, portStr, rest] = match;
  const port = hosts.get(boxId);

  if (!port) {
    evt.respondWith(new Response('Lifo: no sandbox connected for this boxId', { status: 502 }));
    return;
  }

  evt.respondWith((async () => {
    const id = ++reqId;
    const vmPath = (rest || '/') + url.search;
    const headers = {};
    evt.request.headers.forEach((v, k) => { headers[k] = v; });
    const body = ['GET', 'HEAD'].includes(evt.request.method)
      ? undefined
      : await evt.request.text();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        resolve(new Response('Lifo: request timed out', { status: 504 }));
      }, 120000);

      pending.set(id, {
        resolve: (msg) => {
          clearTimeout(timeout);
          const respHeaders = new Headers(msg.headers || {});
          // Strip anti-framing headers that break iframe preview
          respHeaders.delete('x-frame-options');
          respHeaders.delete('content-security-policy');
          const body = msg.bodyBuffer ? new Uint8Array(msg.bodyBuffer) : new Uint8Array(0);
          resolve(new Response(body, {
            status: msg.statusCode || 200,
            headers: respHeaders
          }));
        }
      });

      port.postMessage({
        type: 'request',
        requestId: id,
        port: parseInt(portStr, 10),
        method: evt.request.method,
        url: vmPath,
        headers,
        body
      });
    });
  })());
});

/* ── When waking up without hosts, ask the main thread to reconnect ── */
self.addEventListener('activate', () => {
  if (hosts.size === 0) {
    self.clients.matchAll().then((clients) => {
      clients.forEach((c) => c.postMessage({ type: 'lifo-need-host' }));
    });
  }
});
