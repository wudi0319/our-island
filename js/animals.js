// 小猪/小牛: shared in state.animals {id:{k:'pig'|'cow'|'piglet',x,y,mom?,fed:{role:n}}}.
// Merge-friendly: per-id map; feed counts are per-role counters (each phone only bumps its own) so concurrent feeds sum.
// Births are deterministic ids (<pig>-b<n>) so both phones agree. One phone is the "host" (spawns + saves wander positions every 30s).
// ---- tuning: hunger timers ----
const ANI_HUNGRY_MS=48*36e5,ANI_LEAVE_MS=72*36e5,ANI_TOMB_KEEP_MS=7*864e5; // 💢 after 48h unfed, leaves after 72h; tombstones pruned after 7 days
// lastFed is per-phone (lf[role]=ts), effective = newest => merge never loses a feed. Leaving sets gone=ts (tombstone) so the per-id merge can't resurrect it.
const lastFed=a=>Math.max(0,...Object.values(a.lf||{}).map(Number));
const ANI={pig:{name:'小猪',sp:.7,cap:4},cow:{name:'小牛',sp:.5,cap:3},piglet:{name:'迷你小猪',sp:.9}};
const live={};let initLf=false;let spawnT=20,posT=30;
const role=()=>window.Sync&&Sync.auth?Sync.auth.role:'me';
function isHost(){if(!window.Sync||!Sync.auth||Sync.auth.role==='xiaobai')return true;const o=Sync.others.xiaobai;return!(o&&o.here)}
const fedTotal=a=>Object.values(a.fed||{}).reduce((s,n)=>s+(+n||0),0);
// animals: no water, no objects of any kind (fences/gates always block), no buildings
function aFree(x,y){const tx=Math.floor(x),ty=Math.floor(y);if(!inb(tx,ty))return false;const i=idx(tx,ty);return state.ter[i]!==WATER&&!state.obj[i]&&occ[i]==null}
const aFreeR=(x,y,r)=>aFree(x-r,y)&&aFree(x+r,y)&&aFree(x,y-r*.6)&&aFree(x,y+r*.4);
function sync(){state.animals=state.animals||{};const A=state.animals;
 for(const id in live)if(!A[id]||A[id].gone&&!live[id].fade)delete live[id];
 for(const id in A){const a=A[id],l=live[id];if(a.gone)continue;if(!a.lf||!lastFed(a)){a.lf={[role()]:Date.now()};initLf=true}if(!l){live[id]={x:a.x,y:a.y,ax:a.x,ay:a.y,dir:3,ph:0,mv:false,t:Math.random()*3,tx:null,ty:null,run:0};continue}
  if(a.x!==l.ax||a.y!==l.ay){l.ax=a.x;l.ay=a.y;if(Math.hypot(a.x-l.x,a.y-l.y)>.3){if(Math.hypot(a.x-l.x,a.y-l.y)>8){l.x=a.x;l.y=a.y}else{l.tx=a.x;l.ty=a.y;l.t=6}}}}}
function commit(id){const a=state.animals[id],l=live[id];if(!a||!l)return;a.x=l.ax=+l.x.toFixed(2);a.y=l.ay=+l.y.toFixed(2)}
let uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function spawnAnimal(k,x,y,extra){if(x==null){for(let n=0;n<200;n++){const tx=2+Math.random()*(W-4)|0,ty=2+Math.random()*(H-4)|0;
  if(state.ter[idx(tx,ty)]===GRASS&&aFreeR(tx+.5,ty+.5,.3)&&Math.hypot(tx-state.player.x,ty-state.player.y)>3){x=tx+.5;y=ty+.5;break}}if(x==null)return null}
 state.animals=state.animals||{};const id=(extra&&extra.id)||k[0]+uid();state.animals[id]=Object.assign({k,x:+x.toFixed(2),y:+y.toFixed(2),fed:{},lf:{[role()]:Date.now()}},extra||{});delete state.animals[id].id;sync();return id}
function nearest(kinds){const p=state.player;let best=null,bd=1.6;for(const id in live){const a=state.animals[id];if(!a||!kinds.includes(a.k))continue;const l=live[id];if(l.fade||window.intrCarrier&&intrCarrier(id))continue;const d=Math.hypot(l.x-p.x,l.y-p.y);if(d<bd){bd=d;best=id}}return best}
function animalsUpdate(dt){sync();const A=state.animals;
 if(initLf){initLf=false;save()}
 for(const id in live){const l=live[id],a=A[id];if(l.fade){l.fade-=dt;if(l.fade<=0)delete live[id];continue}const cw=window.intrCarrier&&intrCarrier(id);if(cw){l.x=cw.x+.2;l.y=cw.y-.05;l.tx=null;l.mv=true;l.ph+=dt*20;continue}const sp=ANI[a.k].sp*(l.run>0?4:1);l.t-=dt;
  if(l.run>0){l.run-=dt;if(l.run<=0){l.tx=null;l.t=2+Math.random()*3;commit(id);save()}}
  if(l.tx==null&&l.t<0){const mom=a.mom&&live[a.mom];const cx=mom?mom.x:l.x,cy=mom?mom.y:l.y,r=mom?1.5:3;
   const tx=cx+(Math.random()*2-1)*r,ty=cy+(Math.random()*2-1)*r;if(Math.random()<.6&&aFreeR(tx,ty,.3)){l.tx=tx;l.ty=ty;l.t=8}else l.t=2+Math.random()*4}
  l.mv=false;if(l.tx!=null){const dx=l.tx-l.x,dy=l.ty-l.y,d=Math.hypot(dx,dy);
   if(d<.08||l.t<0){l.tx=null;l.t=2+Math.random()*4;if(l.run>0){l.run=0;commit(id);save()}}
   else{const s=Math.min(d,sp*dt),vx=dx/d*s,vy=dy/d*s,r=a.k==='piglet'?.2:.3;let m=false;
    if(aFreeR(l.x+vx,l.y,r)){l.x+=vx;m=true}if(aFreeR(l.x,l.y+vy,r)){l.y+=vy;m=true}
    if(!m){l.tx=null;l.t=1+Math.random()*2;if(l.run>0){l.run=0;commit(id);save()}}else{l.mv=true;l.ph+=dt*10;if(Math.abs(vx)>.001)l.dir=vx<0?2:3}}}}
 if(isHost()){spawnT-=dt;posT-=dt;
  if(spawnT<0){spawnT=120+Math.random()*120;const c={pig:0,cow:0};for(const id in A)if(!A[id].gone&&c[A[id].k]!=null)c[A[id].k]++;
   const k=Math.random()<.55?'pig':'cow',k2=k==='pig'?'cow':'pig',pick=c[k]<ANI[k].cap?k:c[k2]<ANI[k2].cap?k2:null;if(pick&&spawnAnimal(pick)){toast('岛上来了一只'+ANI[pick].name+'！');save()}}
  const now=Date.now();let gch=false;for(const id in A){const a=A[id];if(a.gone){if(now-a.gone>ANI_TOMB_KEEP_MS){delete A[id];gch=true}continue}
   if(now-lastFed(a)>ANI_LEAVE_MS){a.gone=now;gch=true;if(live[id])live[id].fade=1.2;toast(ANI[a.k].name+'饿坏了，跑掉了…')}}if(gch)save();
  if(posT<0){posT=30;let ch=false;for(const id in live){const l=live[id];if(Math.hypot(l.x-l.ax,l.y-l.ay)>.3){commit(id);ch=true}}if(ch)save()}}
 buttons()}
// ---- buttons ----
const driveBtn=document.getElementById('drive'),feedBtn=document.getElementById('feed');
const show=(b,on,txt)=>{if(b.classList.contains('hidden')===on)b.classList.toggle('hidden',!on);if(txt&&b.textContent!==txt)b.textContent=txt};
const FOODS=['carrot','tomato','strawberry'],FIC={carrot:'🥕',tomato:'🍅',strawberry:'🍓'},FNM={carrot:'胡萝卜',tomato:'番茄',strawberry:'草莓'};
const foodOf=()=>FOODS.find(k=>state.inv[k]>0);
function buttons(){const id=nearest(['pig','cow','piglet']),a=id&&state.animals[id],f=foodOf();
 show(driveBtn,!!a,a?(a.k==='cow'?'赶牛':'赶猪'):null);show(feedBtn,!!a&&!!f,a&&f?(a.k==='cow'?'喂牛 ':'喂猪 ')+FIC[f]:null)}
function drive(){const id=nearest(['pig','cow','piglet']);if(!id)return;const l=live[id],p=state.player;let dx=l.x-p.x,dy=l.y-p.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
 l.tx=l.x+dx*5;l.ty=l.y+dy*5;l.run=2.5;l.t=4;l.dir=dx<0?2:3;toast(state.animals[id].k==='cow'?'小牛快跑～':'小猪快跑～')}
function feed(){const id=nearest(['pig','cow','piglet']),f=foodOf();if(!id||!f)return;const a=state.animals[id],r=role();state.inv[f]--;a.lf=a.lf||{};a.lf[r]=Date.now();
 if(a.k==='pig'){a.fed=a.fed||{};a.fed[r]=(a.fed[r]||0)+1;const n=fedTotal(a);if(n%8===0){const l=live[id],cid=id+'-b'+n/8;if(!state.animals[cid]){let bx=l.x,by=l.y;for(const[ox,oy]of[[.8,0],[-.8,0],[0,.8],[0,-.8],[0,0]])if(aFreeR(l.x+ox,l.y+oy,.2)){bx=l.x+ox;by=l.y+oy;break}
   spawnAnimal('piglet',bx,by,{id:cid,mom:id})}toast('生了一只迷你小猪！🐷')}else toast('喂了一根'+FNM[f]+' '+FIC[f])}
 else toast((a.k==='cow'?'小牛':'迷你小猪')+'吃了'+FNM[f]+' '+FIC[f]);commit(id);save();renderInv()}
driveBtn.addEventListener('pointerdown',e=>{e.preventDefault();drive()});feedBtn.addEventListener('pointerdown',e=>{e.preventDefault();feed()});
// ---- draw (called per row by game.js) ----
function animalsDraw(row){for(const id in live){const l=live[id],a=state.animals[id];if(!a||Math.floor(l.y)!==row)continue;const k=a.k;if(l.fade)ctx.globalAlpha=Math.max(0,l.fade/1.2);const sc=k==='piglet'?.7:k==='cow'?1.45:1.2;
 ctx.save();ctx.translate((l.x-sc/2)*T,(l.y-sc*.85)*T);ctx.scale(T*sc,T*sc);S[k==='cow'?'cow':'pig'](ctx,l.dir,l.ph,l.mv);ctx.restore();ctx.globalAlpha=1;
 if(!l.fade&&Date.now()-lastFed(a)>ANI_HUNGRY_MS){ctx.font=`${T*.36}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💢',(l.x+sc*.3)*T,(l.y-sc*.95)*T+Math.sin(performance.now()/250)*2)}
 if(k==='pig'){const f=(fedTotal(a)%8)/8,w=T*.8,X=l.x*T-w/2,Y=(l.y-sc*.85)*T+2;ctx.beginPath();ctx.roundRect(X,Y,w,9,5);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.stroke();
  if(f>0){ctx.beginPath();ctx.roundRect(X+2,Y+2,(w-4)*f,5,3);ctx.fillStyle='#ff8a2a';ctx.fill()}}}}
window.Animals={lastFed,HUNGRY:ANI_HUNGRY_MS,LEAVE:ANI_LEAVE_MS,live,spawn:spawnAnimal,drive,feed,isHost,fedTotal,aFree,nearest};
