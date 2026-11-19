/* Fitness offline — service worker: appka jde otevřít bez internetu. */
const CACHE='fitness-offline-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const FONT_CSS='https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap';
async function cacheFonts(c){
  try{const r=await fetch(FONT_CSS); if(!r.ok) return; await c.put(FONT_CSS,r.clone());
    const css=await r.text(); const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]);
    await Promise.all(urls.map(u=>fetch(u).then(x=>x.ok?c.put(u,x):null).catch(()=>null)));
  }catch(e){}
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(CORE); await cacheFonts(c);}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  const font=u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com';
  if(u.origin!==location.origin&&!font) return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const key=r.mode==='navigate'?'./index.html':r;
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')) c.put(key,res.clone()); return res;}).catch(()=>hit);
    return hit||net;
  }));
});
