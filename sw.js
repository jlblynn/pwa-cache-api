// the service worker's "install" event is a strategic time to cache static assets
// Caching the application shell on install ensures that the service worker has access to all shell assets

// the application shell files
const filesToCache = [
  '/',
  'style/main.css',
  'images/still_life_medium.jpg',
  'index.html',
  'pages/offline.html',
  'pages/404.html'
];

const staticCacheName = 'pages-cache-v2';

self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    // create the cache and add all files
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

// get rid of unused caches in the sw 'activate' event
/*
  delete old caches in the activate event to ensure that we aren't deleting 
  caches before the new service worker has taken over the page
*/
self.addEventListener('activate', event => {
  console.log('Activating new service worker...');

  // array of current caches
  const cacheWhitelist = [staticCacheName];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // delete caches not on whitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// intercept requests for those files from the network and respond with the files from the cache
self.addEventListener('fetch', event => {
  console.log('Fetch event for ', event.request.url);
  // create a custom response to the request
  // cache falling back to network strategy
  event.respondWith(
    // check cache for requested resource
    caches.match(event.request)
    .then(response => {
      if (response) {
        console.log('Found ', event.request.url, ' in cache');
        return response;
      }
      console.log('Network request for ', event.request.url);
      return fetch(event.request)

      // add fetched files to the cache
      .then(response => {
        if (response.status === 404) {
          return caches.match('pages/404.html');
        }
        return caches.open(staticCacheName)
        .then(cache => {
          cache.put(event.request.url, response.clone());
          return response;
        });
      });
    }).catch(error => {
      console.log('Error, ', error);
      return caches.match('pages/offline.html');
    })
  );
});