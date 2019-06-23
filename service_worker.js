const cacheKey = 'v4';
console.log(`cacheKey = [${cacheKey}]`);

this.addEventListener('install', evt => {
  console.log('installed');
  evt.waitUntil(
    caches.open(cacheKey).then(cache => {
      return cache.addAll([
        '.',
        'manifest.webmanifest',
        'index.html',
        'coscup.jpg',
      ]);
    }));
});

this.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.open(cacheKey).then(cache => {
      return cache.match(evt.request).then(resp => {
        if (resp) {
          console.log(`Using cached [${evt.request.url}]`);
          return resp;
        }

        console.log(`Fetching [${evt.request.url}] from remote`);
        return fetch(evt.request).then(remoteResp => {
          if (evt.request.url.match(/cdn/i))
            cache.put(evt.request, remoteResp.clone());
          return remoteResp;
        });
      });
    }));
});

this.addEventListener('activate', evt => {
  console.log('activated');
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName != cacheKey)
          .map(cacheName => caches.delete(cacheName)))
    }).then(() => self.clients.claim()));
});

this.addEventListener('message', evt => {
  if (evt.data.action == 'purgeCache') {
    console.log(`Purging caches...`);
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => {
        console.log(`Cache [${cacheName}] deleted`);
        return caches.delete(cacheName);
      }));
    }).then(() => {
      console.log('Caches purged');
      evt.ports[0].postMessage({ok: true})
    });
  }
});
