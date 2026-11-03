const C='island-v28',F=['./','index.html','style.css?v=28','js/store.js?v=28','js/sprites.js?v=28','js/game.js?v=28','js/baby.js?v=28','js/animals.js?v=28','js/info.js?v=28','js/sync.js?v=28','js/vendor/supabase.js?v=28','manifest.webmanifest','icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(u.origin!==location.origin||e.request.method!=='GET')return; // cross-origin (weather API, future Supabase): let the browser handle it
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
