// 危机事件：小偷偷菜 / 野兽抓猪牛. Shared in state.intr {id:{k,x,y,ph,at,fear:{role:n},fdec,scared:{role:ts},loot:{crop:n},carry,took,res}}.
// Simulated (movement/stealing/damage) only by the animal "host" phone; any phone may press 汪 (per-role counters, summed => presses never lost).
// Fence durability: state.fhp[tile]={d:{role:totalDamage},r:{role:{at,base}}}; hp=100-(sumD-base of newest repair). Each phone writes only its own keys,
// so repairs and damage never fight in the merge. No decay over time — only intruders damage fences.
const EV_AWAY_MS=30*60e3,EV_CHANCE=.4,EV_MAX_PER_DAY=2,EV_KEEP_MS=3*864e5;
const THIEF_MAX=3,THIEF_STEAL_S=5,THIEF_SPEED=.7,WOLF_SPEED=.9,ESCAPE_S=60,ESCAPE_MUL=.45,FLEE_SPEED=4.5;
const FEAR_NEED={thief:6,wolf:12},FEAR_DECAY=.5,FEAR_IDLE_S=2,WOLF_DPS=8,BARK_R=1.8,FENCE_WOOD=1;
const INTR={thief:{name:'小偷',ic:'🦝',alert:'🦝 有小偷来偷菜啦！快保护好你的菜！'},wolf:{name:'大灰狼',ic:'🐺',alert:'🐺 有野兽登岛啦！快保护猪猪和牛牛！'}};
const CROPN={carrot:'胡萝卜',tomato:'番茄',strawberry:'草莓'};
const iRole=()=>window.Sync&&Sync.auth?Sync.auth.role:'me';
const iHost=()=>window.Animals?Animals.isHost():true;
const sum=o=>Object.values(o||{}).reduce((s,n)=>s+(+n||0),0);
const IL={};let lastBark=0,cryFx=0,dogBub=null,iSaveT=0;const seenDone=new Set();
// ---- fence durability ----
function fRec(i){state.fhp=state.fhp||{};return state.fhp[i]||(state.fhp[i]={d:{},r:{}})}
function fenceHp(i){const r=state.fhp&&state.fhp[i];if(!r)return 100;let rep=null;for(const k in r.r||{}){const v=r.r[k];if(v&&(!rep||v.at>rep.at))rep=v}
 return Math.max(0,Math.min(100,100-(sum(r.d)-(rep?rep.base:0))))}
function fenceNew(i){const r=fRec(i);r.r[iRole()]={at:Date.now(),base:+sum(r.d).toFixed(1)}}
function fenceRepair(i){const hp=fenceHp(i);if(hp>=100)return toast('篱笆很结实，不用修');if((state.inv.wood||0)<FENCE_WOOD)return toast('需要1块木头修篱笆，去砍树吧🪓');
 state.inv.wood-=FENCE_WOOD;fenceNew(i);save();renderInv();toast('篱笆修好啦 🔨（木头 -1）')}
function fenceDamage(i,n){const r=fRec(i),k=iRole();r.d[k]=+((r.d[k]||0)+n).toFixed(2);if(fenceHp(i)<=0){delete state.obj[i];delete state.fhp[i];rebuildOcc();toast('篱笆被攻破了！');save()}}
function fenceFx(x,y,i){const hp=fenceHp(i);if(hp>=100)return;const X=x*T,Y=y*T;
 if(hp<50){ctx.strokeStyle='#2a1d16';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X+T*.42,Y+T*.3);ctx.lineTo(X+T*.52,Y+T*.42);ctx.lineTo(X+T*.45,Y+T*.52);ctx.lineTo(X+T*.56,Y+T*.66);ctx.moveTo(X+T*.15,Y+T*.5);ctx.lineTo(X+T*.25,Y+T*.6);ctx.stroke()}
 const w=T*.7;ctx.beginPath();ctx.roundRect(X+T*.15,Y-4,w,7,3);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#3b2a20';ctx.stroke();
 ctx.fillStyle=hp<30?'#ff5a5a':hp<60?'#ffb347':'#6fd07a';ctx.fillRect(X+T*.15+1.5,Y-2.5,(w-3)*hp/100,4)}
// ---- events ----
const fearOf=e=>Math.max(0,sum(e.fear)-(e.fdec||0));
const isActive=e=>e&&e.ph!=='done';
const active=()=>Object.entries(state.intr||{}).filter(([,e])=>isActive(e));
function todayCount(){const d=new Date().toDateString();return Object.values(state.intr||{}).filter(e=>new Date(e.at).toDateString()===d).length}
const liveAnimals=()=>Object.entries(state.animals||{}).filter(([id,a])=>!a.gone&&Animals.live[id]);
function edgeSpawn(tx,ty){const a=Math.random()*7;for(let r=14;r>3;r--){const x=Math.max(1,Math.min(W-2,tx+Math.cos(a)*r)),y=Math.max(1,Math.min(H-2,ty+Math.sin(a)*r));if(state.ter[idx(x|0,y|0)]!==WATER)return[x,y]}return[tx+3,ty+3]}
function startEvent(k,force){state.intr=state.intr||{};
 if(!force){if(active().length||todayCount()>=EV_MAX_PER_DAY)return null}
 if(!k)k=Math.random()<.5?'thief':'wolf';
 const crops=Object.keys(state.crops||{}),an=liveAnimals();if(k==='thief'&&!crops.length)k=an.length?'wolf':null;else if(k==='wolf'&&!an.length)k=crops.length?'thief':null;if(!k)return null;
 const tgt=k==='thief'?[+crops[0]%W,+crops[0]/W|0]:[Animals.live[an[0][0]].x,Animals.live[an[0][0]].y];const[x,y]=edgeSpawn(tgt[0],tgt[1]);
 const id=k[0]+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 state.intr[id]={k,x:+x.toFixed(2),y:+y.toFixed(2),ph:'in',at:Date.now(),fear:{},fdec:0,scared:{},loot:{},carry:null};
 alertBanner(INTR[k].alert);save();return id}
function maybeEvent(){const K='our-island-lastseen',now=Date.now(),last=+localStorage.getItem(K)||0;localStorage.setItem(K,now);
 if(now-last>EV_AWAY_MS&&Math.random()<EV_CHANCE)setTimeout(()=>startEvent(),4000)}
setInterval(()=>{if(!document.hidden)localStorage.setItem('our-island-lastseen',Date.now())},30e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeEvent()});
const alertEl=document.getElementById('alert');let alertT;
function alertBanner(m){alertEl.textContent=m;alertEl.classList.remove('hidden');clearTimeout(alertT);alertT=setTimeout(()=>alertEl.classList.add('hidden'),4500)}
// ---- simulation ----
function intrCarrier(aid){for(const id in state.intr||{}){const e=state.intr[id];if(isActive(e)&&e.carry===aid)return IL[id]||e}return null}
function goTo(e,tx,ty,sp,dt,wolf){const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<.05)return 0;const s=Math.min(d,sp*dt),nx=e.x+dx/d*s,ny=e.y+dy/d*s;
 if(wolf){const i=idx(Math.floor(nx),Math.floor(ny)),o=state.obj[i];if(o==='fence'||o==='gate')return{fence:i}}
 e.x=nx;e.y=ny;e.dir=dx<0?2:3;return d}
function scare(id,e,why){if(e.ph==='flee'||e.ph==='done')return;const back=[];
 if(e.carry){const a=state.animals[e.carry];if(a){a.x=+e.x.toFixed(2);a.y=+e.y.toFixed(2);back.push('救回了'+(a.k==='cow'?'小牛':'小猪'))}e.carry=null}
 const L=e.loot||{};let n=0;for(const k in L){state.inv[k]=(state.inv[k]||0)+L[k];n+=L[k];back.push('追回了'+L[k]+'个'+CROPN[k])}e.loot={};
 e.ph='flee';e.scaredAway=1;const ang=Math.atan2(e.y-state.player.y,e.x-state.player.x);e.fx=e.x+Math.cos(ang)*40;e.fy=e.y+Math.sin(ang)*40;
 if(iHost()){state.inv.wood=(state.inv.wood||0)+1}
 toast((why==='cry'?'胖宝一嗓子把'+INTR[e.k].name+'吓跑了！':INTR[e.k].name+'被吓跑啦！')+(back.length?' '+back.join('，')+'！':'')+(iHost()?' 🪵+1':''));renderInv();save()}
function escape(e){e.ph='escape';const ang=Math.atan2(e.y-H/2,e.x-W/2),cx=Math.cos(ang),cy=Math.sin(ang);let d=1;
 for(;d<120;d+=.5){if(offIsland({x:e.x+cx*d,y:e.y+cy*d}))break}d+=1;e.fx=e.x+cx*d;e.fy=e.y+cy*d;
 e.esp=+Math.max(.06,d/ESCAPE_S).toFixed(3);e.eEnd=Date.now()+ESCAPE_S*1e3}
const offIsland=e=>!inb(Math.floor(e.x),Math.floor(e.y))||state.ter[idx(Math.floor(e.x),Math.floor(e.y))]===WATER&&Math.hypot(e.x-W/2,e.y-H/2)>22;
function finish(id,e){e.ph='done';e.done=Date.now();let lost=[];
 if(e.carry){const a=state.animals[e.carry];if(a){a.gone=Date.now();lost.push((a.k==='cow'?'小牛':a.k==='piglet'?'迷你小猪':'小猪')+'被抱走了')}e.took=e.carry;e.carry=null}
 for(const k in e.loot||{})lost.push(CROPN[k]+'×'+e.loot[k]);e.res=e.scaredAway?'保卫成功！':lost.length?INTR[e.k].name+'跑掉了…损失：'+lost.join('，'):'保卫成功！';save()}
function intrUpdate(dt){const A=state.intr;if(!A)return;const now=Date.now();
 for(const id in A){const e=A[id];
  if(e.ph==='done'){if(!seenDone.has(id)){seenDone.add(id);if(now-e.done<60e3&&e.res)toast(e.res)}if(now-e.at>EV_KEEP_MS&&iHost())delete A[id];continue}
  // any phone: fear full / cry => flee
  if(e.ph!=='flee'&&(fearOf(e)>=FEAR_NEED[e.k]||Object.keys(e.scared||{}).length))scare(id,e,Object.keys(e.scared||{}).length?'cry':'bark');
  const l=IL[id]||(IL[id]={x:e.x,y:e.y,ph:0});l.ph+=dt*12;l.cover=Math.max(0,(l.cover||0)-dt);
  if(!iHost()){l.x+=(e.x-l.x)*Math.min(1,dt*4);l.y+=(e.y-l.y)*Math.min(1,dt*4);l.dir=e.dir;continue}
  if(now-lastBark>FEAR_IDLE_S*1e3&&fearOf(e)>0)e.fdec=+((e.fdec||0)+FEAR_DECAY*dt).toFixed(2);
  const carrying=e.carry||sum(e.loot)>0;
  if(e.ph==='flee'){goTo(e,e.fx,e.fy,FLEE_SPEED,dt);if(offIsland(e)||Math.hypot(e.x-state.player.x,e.y-state.player.y)>16)finish(id,e)}
  else if(e.ph==='escape'){goTo(e,e.fx,e.fy,e.esp||(e.k==='wolf'?WOLF_SPEED:THIEF_SPEED)*ESCAPE_MUL,dt);if(Date.now()>=(e.eEnd||0)||!e.eEnd&&offIsland(e))finish(id,e)}
  else if(e.k==='thief'){const C=state.crops;if(sum(e.loot)>=THIEF_MAX||!Object.keys(C).length){carrying?escape(e):(e.ph='flee',e.fx=e.x+(e.x-W/2),e.fy=e.y+(e.y-H/2))}
   else{if(e.tgt==null||!C[e.tgt]){const ks=Object.keys(C).sort((a,b)=>(C[b].stage===2)-(C[a].stage===2)||Math.hypot(a%W-e.x,(a/W|0)-e.y)-Math.hypot(b%W-e.x,(b/W|0)-e.y));e.tgt=+ks[0];e.st=0}
    const tx=e.tgt%W+.5,ty=(e.tgt/W|0)+.5;if(goTo(e,tx,ty,THIEF_SPEED,dt)<.1){e.ph2='steal';e.st=(e.st||0)+dt;if(e.st>=THIEF_STEAL_S){const c=C[e.tgt];e.loot[c.type]=(e.loot[c.type]||0)+1;delete C[e.tgt];e.tgt=null;e.st=0;toast('小偷偷走了一个'+CROPN[c.type]+'！');save()}}else e.ph2=null}}
  else{ // wolf
   if(e.carry){escape(e)}else{let best=null,bd=1e9;for(const[aid]of liveAnimals()){const L2=Animals.live[aid],d=Math.hypot(L2.x-e.x,L2.y-e.y);if(d<bd){bd=d;best=aid}}
    if(!best){e.ph='flee';e.fx=e.x+(e.x-W/2);e.fy=e.y+(e.y-H/2)}else{const L2=Animals.live[best];e.ph2=null;
     const r=goTo(e,L2.x,L2.y,WOLF_SPEED,dt,true);if(r&&r.fence!=null){e.ph2='attack';e.atk=r.fence;fenceDamage(r.fence,WOLF_DPS*dt)}else if(bd<.6){e.carry=best;toast('大灰狼抓住了'+(state.animals[best].k==='cow'?'小牛':'小猪')+'！快追！');save()}}}}
  l.x=e.x;l.y=e.y;l.dir=e.dir}
 iSaveT-=dt;if(active().length&&iSaveT<=0&&iHost()){iSaveT=1.5;for(const[,e]of active()){e.x=+e.x.toFixed(2);e.y=+e.y.toFixed(2)}save()}
 buttonsI()}
// ---- 汪！/ 胖宝大哭 ----
const barkBtn=document.getElementById('bark');
function nearI(){const p=state.player;let b=null,bd=BARK_R;for(const[id,e]of active()){if(e.ph==='flee')continue;const l=IL[id]||e,d=Math.hypot(l.x-p.x,l.y-p.y);if(d<bd){bd=d;b=id}}return b}
function buttonsI(){const id=nearI(),cry=typeof baby!=='undefined'&&baby.carried,t=cry?'胖宝大哭！':'汪！';if(barkBtn.classList.contains('hidden')===!!id)barkBtn.classList.toggle('hidden',!id);if(barkBtn.textContent!==t)barkBtn.textContent=t;barkBtn.classList.toggle('cry',!!cry)}
function bark(){const id=nearI();if(!id)return;const e=state.intr[id],r=iRole();lastBark=Date.now();
 if(typeof baby!=='undefined'&&baby.carried){e.scared=e.scared||{};e.scared[r]=Date.now();cryFx=1.2;say('哇——！');(IL[id]||{}).cover=1.5;scare(id,e,'cry');return}
 e.fear=e.fear||{};e.fear[r]=(e.fear[r]||0)+1;dogBub={t:1,m:pick(['汪！不许偷！','汪汪！','走开！汪！'])};save()}
barkBtn.addEventListener('pointerdown',ev=>{ev.preventDefault();bark()});
// ---- drawing ----
function drawThief(c,dir,ph,mv,cover,sack){const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.05:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);shadow(c,.5,.93,.3,.07);
 if(sack){c.save();c.translate(.2,.38-b);circ(c,0,0,.2,'#c9a36b');c.restore()}
 c.beginPath();c.moveTo(.22,.6);c.quadraticCurveTo(.02,.5,.08,.36);c.lineWidth=.13;c.strokeStyle=OL;c.lineCap='round';c.stroke();c.lineWidth=.08;c.strokeStyle='#9aa0a8';c.stroke();
 [.36,.6].forEach((x,i)=>rr(c,x-.05,.74+(mv&&i?-.04:0),.1,.17,.04,'#6c7078'));rr(c,.28,.48-b,.44,.34,.16,'#9aa0a8');
 circ(c,.6,.36-b,.21,'#b8bec6');[[.46,.17],[.72,.17]].forEach(([x,y])=>circ(c,x,y-b,.07,'#9aa0a8'));
 c.beginPath();c.ellipse(.62,.35-b,.17,.06,0,0,7);c.fillStyle='#3b3f46';c.fill();circ(c,.56,.35-b,.025,'#fff',false);circ(c,.69,.35-b,.025,'#fff',false);circ(c,.79,.42-b,.035,OL,false);
 if(cover){circ(c,.44,.18-b,.08,'#6c7078');circ(c,.76,.18-b,.08,'#6c7078')}c.restore()}
function drawWolf(c,dir,ph,mv,cover){const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.04:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);shadow(c,.5,.93,.36,.07);
 c.beginPath();c.moveTo(.16,.5);c.quadraticCurveTo(-.04,.36,.04,.24);c.lineWidth=.16;c.strokeStyle=OL;c.lineCap='round';c.stroke();c.lineWidth=.1;c.strokeStyle='#8a8f99';c.stroke();
 [.24,.36,.58,.7].forEach((x,i)=>rr(c,x-.05,.7+(mv&&i%2?-.04:0),.1,.2,.04,'#6f7480'));rr(c,.14,.4-b,.64,.36,.17,'#8a8f99');rr(c,.3,.58-b,.3,.14,.07,'#c9ccd2',false);
 c.beginPath();c.moveTo(.68,.24-b);c.lineTo(.7,.04-b);c.lineTo(.8,.18-b);c.moveTo(.86,.2-b);c.lineTo(.94,.03-b);c.lineTo(.98,.24-b);c.fillStyle='#6f7480';c.fill();c.lineWidth=.05;c.strokeStyle=OL;c.stroke();
 circ(c,.84,.34-b,.18,'#8a8f99');rr(c,.88,.36-b,.18,.12,.05,'#c9ccd2');circ(c,1.04,.39-b,.03,OL,false);
 c.lineWidth=.035;c.strokeStyle=OL;c.beginPath();c.moveTo(.74,.26-b);c.lineTo(.82,.29-b);c.moveTo(.9,.29-b);c.lineTo(.97,.26-b);c.stroke();circ(c,.79,.32-b,.025,OL,false);circ(c,.93,.32-b,.025,OL,false);
 if(cover){circ(c,.7,.12-b,.08,'#6f7480');circ(c,.95,.12-b,.08,'#6f7480')}c.restore()}
function intrDraw(row){const p=state.player;
 for(const[id,e]of active()){const l=IL[id]||e;if(Math.floor(l.y)!==row)continue;const sc=e.k==='wolf'?1.5:1.25,mv=true;
  ctx.save();ctx.translate((l.x-sc/2)*T,(l.y-sc*.88)*T);ctx.scale(T*sc,T*sc);(e.k==='wolf'?drawWolf:drawThief)(ctx,l.dir,l.ph||0,mv,l.cover>0||e.ph==='flee',sum(e.loot)>0);ctx.restore();
  const need=FEAR_NEED[e.k],f=Math.min(1,fearOf(e)/need),w=T*.95,X=l.x*T-w/2,Y=(l.y-sc*.95)*T-14;ctx.beginPath();ctx.roundRect(X,Y,w,10,5);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.stroke();
  if(f>0){ctx.beginPath();ctx.roundRect(X+2,Y+2,(w-4)*f,6,3);ctx.fillStyle='#ff5a5a';ctx.fill()}ctx.font=`${T*.3}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.ph==='flee'?'💦':'😨',X-10,Y+5);
  if(e.ph==='escape'&&e.eEnd){const sec=Math.max(0,Math.ceil((e.eEnd-Date.now())/1e3));ctx.font=`900 ${T*.32}px sans-serif`;ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.strokeText('⏱'+sec+'s',l.x*T,Y-14);ctx.fillStyle='#d9534f';ctx.fillText('⏱'+sec+'s',l.x*T,Y-14)}
  if(e.ph2==='steal'||e.ph2==='attack'){ctx.fillText(e.ph2==='steal'?'🤫':'💥',l.x*T+T*.5,(l.y-sc*.6)*T+Math.sin(performance.now()/120)*3)}}
 if(Math.floor(p.y)===row){if(dogBub&&dogBub.t>0){dogBub.t-=1/60;const X=p.x*T,Y=(p.y-1.6)*T;ctx.font=`900 ${T*.3}px "PingFang SC",sans-serif`;const tw=ctx.measureText(dogBub.m).width+18;ctx.globalAlpha=Math.min(1,dogBub.t*3);
   ctx.beginPath();ctx.roundRect(X-tw/2,Y-15,tw,30,15);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#3b2a20';ctx.stroke();ctx.fillStyle='#d9534f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(dogBub.m,X,Y+1);ctx.globalAlpha=1}
  if(cryFx>0){cryFx-=1/60;for(let k=0;k<3;k++){const r=((1.2-cryFx)*2+k*.35)%1.2;ctx.globalAlpha=Math.max(0,1-r);ctx.beginPath();ctx.arc(p.x*T,(p.y-.5)*T,T*(.6+r*2.2),0,7);ctx.lineWidth=4;ctx.strokeStyle='#5ab8f0';ctx.stroke()}ctx.globalAlpha=1}}}
function intrOverlay(){const[cx,cy]=camXY(),m=52;ctx.setTransform(dpr,0,0,dpr,0,0);
 for(const[id,e]of active()){if(e.ph==='flee')continue;const l=IL[id]||e,sx=l.x*T-cx,sy=(l.y-.5)*T-cy;if(sx>-10&&sx<vw+10&&sy>-10&&sy<vh+10)continue;
  const ox=vw/2,oy=vh/2,dx=sx-ox,dy=sy-oy,k=Math.min((vw/2-m)/Math.abs(dx||1e-6),(vh/2-m-70)/Math.abs(dy||1e-6)),ax=Math.max(m,Math.min(vw-m,ox+dx*k)),ay=Math.max(m+60,Math.min(vh-m-140,oy+dy*k)),a=Math.atan2(dy,dx);
  const dist=Math.round(Math.hypot(l.x-state.player.x,l.y-state.player.y)),pulse=1+Math.sin(performance.now()/180)*.08;
  ctx.save();ctx.translate(ax,ay);ctx.scale(pulse,pulse);ctx.beginPath();ctx.arc(0,0,22,0,7);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#d9534f';ctx.stroke();
  ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(34,0);ctx.lineTo(22,-9);ctx.lineTo(22,9);ctx.closePath();ctx.fillStyle='#d9534f';ctx.fill();ctx.restore();
  ctx.font='22px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(INTR[e.k].ic,0,1);
  ctx.font='900 12px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#fff';let t=dist+'m';if(e.ph==='escape'&&e.eEnd)t+=' ⏱'+Math.max(0,Math.ceil((e.eEnd-Date.now())/1e3))+'s';
  ctx.strokeText(t,0,32);ctx.fillStyle='#d9534f';ctx.fillText(t,0,32);ctx.restore()}}
window.intrOverlay=intrOverlay;
for(const id in state.intr||{})if(state.intr[id].ph==='done')seenDone.add(id);
maybeEvent();
window.Intr={start:startEvent,bark,fenceHp,fenceDamage,fenceRepair,fearOf,NEED:FEAR_NEED,get IL(){return IL}};
