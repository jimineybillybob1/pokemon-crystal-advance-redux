const CACHE_NAME='crystal-advance-redux-guide-20260925d';
const CORE=[
  './','./index.html','./styles.css','./refinements.css','./app.js','./site.webmanifest',
  './config/game-config.js','./config/game-overrides.js','./sync-config.js',
  './data/guide-data.js','./data/items-data.js','./data/legendary-data.js','./data/acquisition-data.js',
  './data/egg-data.js','./data/battle-data.js','./data/move-tutor-data.js','./data/curated-builds.js',
  './assets/art/crystal-advance-redux-logo.png','./assets/art/crystal-advance-redux-hero.png',
  './assets/icons/icon-192x192.png','./assets/icons/icon-512x512.png','./assets/ui/pokeball.svg'
];

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response})));
});
