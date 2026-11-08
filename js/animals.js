// 小猪/小牛: shared in state.animals {id:{k:'pig'|'cow'|'piglet',x,y,mom?,fed:{role:n}}}.
// Merge-friendly: per-id map; feed counts are per-role counters (each phone only bumps its own) so concurrent feeds sum.
// Births are deterministic ids (<pig>-b<n>) so both phones agree. One phone is the "host" (spawns + saves wander positions every 30s).
// ---- tuning: hunger timers ----
const ANI_HUNGRY_MS=48*36e5,ANI_LEAVE_MS=72*36e5,ANI_TOMB_KEEP_MS=7*864e5; // 💢 after 48h unfed, leaves after 72h; tombstones pruned after 7 days
// lastFed is per-phone (lf[role]=ts), effective = newest => merge never loses a feed. Leaving sets gone=ts (tombstone) so the per-id merge can't resurrect it.
const lastFed=a=>Math.max(0,...Object.values(a.lf||{}).map(Number));
const ANI={pig:{name:'小猪',sp:.7,cap:4},cow:{name:'小牛',sp:.5,cap:3},piglet:{name:'迷你小猪',sp:.9},calf:{name:'小牛犊',sp:.7}};const BABY={pig:'piglet',cow:'calf'},KIDS=['piglet','calf'];;
const live={};let initLf=false;let spawnT=20,posT=30;
const role=()=>window.Sync&&Sync.auth?Sync.auth.role:'me';
function isHost(){if(!window.Sync||!Sync.auth||Sync.auth.role==='xiaobai')return true;const o=Sync.others.xiaobai;return!(o&&o.here&&!o.hidden)}
const fedTotal=a=>Object.values(a.fed||{}).reduce((s,n)=>s+(+n||0),0);
const GROW_FEEDS=8,GROWN={piglet:'pig',calf:'cow'};
// breeding progress for adults: feeds since adulthood (fb = feeds counted while young; per-phone counters keep merging additive)
const breedN=a=>fedTotal(a)-(a.fb||0);
// animals: no water, no objects of any kind (fences/gates always block), no buildings
function aFree(x,y,drv){const tx=Math.floor(x),ty=Math.floor(y);if(!inb(tx,ty))return false;const i=idx(tx,ty),o=state.obj[i];return state.ter[i]!==WATER&&(!o||drv&&o==='gate'&&(gateAng[i]||0)>.6)&&occ[i]==null}
const onGate=(x,y)=>state.obj[idx(Math.floor(x),Math.floor(y))]==='gate';
function gateDriven(i){const x=i%W+.5,y=(i/W|0)+.5;for(const id in live){const l=live[id];if(l.run>0&&!l.fade&&Math.hypot(l.x-x,l.y-y)<1.6)return true}return false}
// soft animal-animal spacing: ~0.8 tiles. selfId skips self; allow=true skips the check (drive through gates etc.)
function aNear(x,y,self){for(const id in live){if(id===self||live[id].fade)continue;if(Math.hypot(live[id].x-x,live[id].y-y)<.8)return id}return null}
const aFreeR=(x,y,r,d,self)=>aFree(x-r,y,d)&&aFree(x+r,y,d)&&aFree(x,y-r*.6,d)&&aFree(x,y+r*.4,d)&&!(self&&aNear(x,y,self));
const N8=[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]];
function pickStep(l,id,r,dv,wantX,wantY,sp){ // prefer toward want, else any free neighbor
 const cand=[];for(const[a,b]of N8){const nx=l.x+a*.55,ny=l.y+b*.55;if(!aFreeR(nx,ny,r,dv,id))continue;
  const score=wantX==null?Math.random():-(Math.hypot(wantX-nx,wantY-ny))+Math.random()*.15;cand.push({nx,ny,score,a,b})}
 cand.sort((u,v)=>v.score-u.score);return cand[0]||null}

function sync(){state.animals=state.animals||{};const A=state.animals;
 for(const id in live)if(!A[id]||A[id].gone&&!live[id].fade)delete live[id];
 for(const id in A){const a=A[id],l=live[id];if(a.gone)continue;if(!a.lf||!lastFed(a)){a.lf={[role()]:Date.now()};initLf=true}if(!l){live[id]={x:a.x,y:a.y,ax:a.x,ay:a.y,dir:3,ph:0,mv:false,t:Math.random()*3,tx:null,ty:null,run:0,stuck:0,lx:a.x,ly:a.y};continue}
  if(a.x!==l.ax||a.y!==l.ay){l.ax=a.x;l.ay=a.y;if(l.run>0&&isHost())continue;if(Math.hypot(a.x-l.x,a.y-l.y)>.3){if(Math.hypot(a.x-l.x,a.y-l.y)>8){l.x=a.x;l.y=a.y}else{l.tx=a.x;l.ty=a.y;l.t=6}}}}}
function commit(id){const a=state.animals[id],l=live[id];if(!a||!l||!isHost())return; // only the host writes positions; a non-host's local drive preview would otherwise yank the host's animal back later
a.x=l.ax=+l.x.toFixed(2);a.y=l.ay=+l.y.toFixed(2)}
let uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function spawnAnimal(k,x,y,extra){if(x==null){for(let n=0;n<200;n++){const tx=2+Math.random()*(W-4)|0,ty=2+Math.random()*(H-4)|0;
  if(state.ter[idx(tx,ty)]===GRASS&&aFreeR(tx+.5,ty+.5,.3,false,null)&&!aNear(tx+.5,ty+.5,null)&&Math.hypot(tx-state.player.x,ty-state.player.y)>3){x=tx+.5;y=ty+.5;break}}if(x==null)return null}
 state.animals=state.animals||{};const id=(extra&&extra.id)||k[0]+uid();state.animals[id]=Object.assign({k,x:+x.toFixed(2),y:+y.toFixed(2),fed:{},lf:{[role()]:Date.now()}},extra||{});delete state.animals[id].id;sync();return id}
function nearest(kinds){const p=state.player;let best=null,bd=1e9;for(const id in live){const a=state.animals[id];if(!a||!kinds.includes(a.k))continue;const l=live[id];if(l.fade||window.intrCarrier&&intrCarrier(id))continue;const d=Math.hypot(l.x-p.x,l.y-p.y)-(l.run>0?1.4:0);if(d<1.6&&d<bd){bd=d;best=id}}return best}
function animalsUpdate(dt){sync();const A=state.animals;
 if(initLf){initLf=false;save()}
 for(const id in live){const l=live[id],a=A[id];if(l.fade){l.fade-=dt;if(l.fade<=0)delete live[id];continue}const cw=window.intrCarrier&&intrCarrier(id);if(cw){l.x=cw.x+.2;l.y=cw.y-.05;l.tx=null;l.mv=true;l.ph+=dt*20;continue}const rs=!isHost()&&window.SimIn&&SimIn.a[id];if(rs&&l.run<=0&&performance.now()-rs.t<4000){const v=rs.v,k=1-Math.exp(-dt*6);if(Math.hypot(v[0]-l.x,v[1]-l.y)>5){l.x=v[0];l.y=v[1]}else{l.x+=(v[0]-l.x)*k;l.y+=(v[1]-l.y)*k}l.dir=v[2];l.mv=!!v[3]||Math.hypot(v[0]-l.x,v[1]-l.y)>.05;if(l.mv)l.ph+=dt*10;l.tx=null;continue}
  const sp=ANI[a.k].sp*(l.run>0?4:1);l.t-=dt;
  if(l.run>0){l.run-=dt;if(l.run<=0&&onGate(l.x,l.y))l.run=.3;if(l.run<=0){l.tx=null;l.t=2+Math.random()*3;commit(id);save()}}
  const rad=KIDS.includes(a.k)?.2:.3,dv=l.run>0;
  // gentle unstick nudge if overlapping another animal
  const oth=!dv&&aNear(l.x,l.y,id);if(oth){const o=live[oth],dd=Math.hypot(l.x-o.x,l.y-o.y)||.01,ux=(l.x-o.x)/dd,uy=(l.y-o.y)/dd,nx=l.x+ux*.08,ny=l.y+uy*.08;if(aFreeR(nx,l.y,rad,dv))l.x=nx;if(aFreeR(l.x,ny,rad,dv))l.y=ny}
  if(l.tx==null&&l.t<0){const mom=a.mom&&live[a.mom];const cx=mom?mom.x:l.x,cy=mom?mom.y:l.y,rr=mom?1.5:3;
   let placed=false;for(let tries=0;tries<6&&!placed;tries++){const tx=cx+(Math.random()*2-1)*rr,ty=cy+(Math.random()*2-1)*rr;if(aFreeR(tx,ty,rad,false,id)){l.tx=tx;l.ty=ty;l.t=8;placed=true}}
   for(let tries=0;tries<6&&!placed;tries++){const tx=cx+(Math.random()*2-1)*rr,ty=cy+(Math.random()*2-1)*rr;if(aFreeR(tx,ty,rad,false,null)){l.tx=tx;l.ty=ty;l.t=8;l.sq=1.5;placed=true}}
   if(!placed)l.t=1.5+Math.random()*3}
  l.mv=false;if(l.tx!=null){const dx=l.tx-l.x,dy=l.ty-l.y,d=Math.hypot(dx,dy);
   if(d<.08&&l.nx!=null){l.tx=l.nx;l.ty=l.ny;l.nx=null}else if(d<.08||l.t<0){l.nx=null;l.tx=null;l.t=2+Math.random()*4;if(l.run>0){l.run=0;commit(id);save()}}
   else{const step=Math.min(d,sp*dt),vx=dx/d*step,vy=dy/d*step;let m=false,ox=l.x,oy=l.y;
    if(l.sq>0)l.sq-=dt;const me=dv||l.sq>0?null:id;if(aFreeR(l.x+vx,l.y,rad,dv,me)){l.x+=vx;m=true}if(aFreeR(l.x,l.y+vy,rad,dv,me)){l.y+=vy;m=true}
    if(!m&&dv&&onGate(l.x,l.y)){l.x+=vx;l.y+=vy;m=true}
    if(m&&dv&&Math.hypot(l.x-ox,l.y-oy)<step*.35){l.x=ox;l.y=oy;m=false} // driven but grinding into a wall -> treat as blocked so it slides away
    if(!m&&!dv&&!(l.sq>0)&&(aFreeR(l.x+vx,l.y,rad,false,null)||aFreeR(l.x,l.y+vy,rad,false,null))){l.sq=1.5;if(aFreeR(l.x+vx,l.y,rad,false,null)){l.x+=vx;m=true}if(aFreeR(l.x,l.y+vy,rad,false,null)){l.y+=vy;m=true}} // blocked only by other animals: squeeze past instead of freezing
    if(!m){ // blocked: slide along an adjacent free tile toward the goal, else give up this target
     if(dv){const px=l.px!=null?l.px:l.x,py=l.py!=null?l.py:l.y;let best=null;for(const[a,b]of N8){const nx=l.x+a*.55,ny=l.y+b*.55;if(!aFreeR(nx,ny,rad,true,null))continue;const sc=Math.hypot(nx-px,ny-py)+Math.random()*.05;if(!best||sc>best.sc)best={a,b,sc}}
      if(best){const len=Math.hypot(best.a,best.b);l.tx=l.x+best.a/len*2.5;l.ty=l.y+best.b/len*2.5;l.nx=null;m=true;l.mv=true}}
     const alt=m?null:(pickStep(l,id,rad,dv,l.tx,l.ty,sp)||pickStep(l,null,rad,dv,l.tx,l.ty,sp));if(alt&&!dv)l.sq=1.5;if(alt){const len=Math.hypot(alt.a,alt.b)||1,s2=sp*dt;l.x+=alt.a/len*s2;l.y+=alt.b/len*s2;if(!aFreeR(l.x,l.y,rad,dv,null)){l.x=ox;l.y=oy}else{m=true;if(Math.abs(alt.a)>.001)l.dir=alt.a<0?2:3}}
     if(!m){l.nx=null;l.tx=null;l.t=.3+Math.random()*.7;if(l.run>0){l.run=0;commit(id);save()}}}
    else{l.mv=true;l.ph+=dt*10;l.stuck=0;if(Math.abs(vx)>.001)l.dir=vx<0?2:3}}}
  // periodic unstick: haven't meaningfully moved for ~2.5s, pick a random free neighbor as a short target
  if(Math.hypot(l.x-(l.lx||l.x),l.y-(l.ly||l.y))>.12){l.lx=l.x;l.ly=l.y;l.stuck=0}else l.stuck=(l.stuck||0)+dt;
  if((l.stuck||0)>2.5&&l.run<=0){const alt=pickStep(l,id,rad,false,null,null,sp);if(alt){l.tx=alt.nx;l.ty=alt.ny;l.t=3;l.stuck=0}else{const a2=pickStep(l,null,rad,false,null,null,sp);if(a2){l.tx=l.x+(a2.nx-l.x)*2.5;l.ty=l.y+(a2.ny-l.y)*2.5;l.t=3;l.sq=2;l.stuck=0}else l.stuck=1.5}}}
 if(isHost()){spawnT-=dt;posT-=dt;
  if(spawnT<0){spawnT=120+Math.random()*120;const c={pig:0,cow:0};for(const id in A)if(!A[id].gone&&c[A[id].k]!=null&&!A[id].mom)c[A[id].k]++;
   const k=Math.random()<.55?'pig':'cow',k2=k==='pig'?'cow':'pig',pick=c[k]<ANI[k].cap?k:c[k2]<ANI[k2].cap?k2:null;if(pick&&spawnAnimal(pick)){toast('岛上来了一只'+ANI[pick].name+'！');save()}}
  const now=Date.now();let gch=false;for(const id in A){const a=A[id];if(a.gone){if(now-a.gone>ANI_TOMB_KEEP_MS){delete A[id];gch=true}continue}
   if(now-lastFed(a)>ANI_LEAVE_MS){a.gone=now;gch=true;if(live[id])live[id].fade=1.2;toast(ANI[a.k].name+'饿坏了，跑掉了…')}}if(gch)save();
  if(posT<0){posT=30;let ch=false;for(const id in live){const l=live[id];if(Math.hypot(l.x-l.ax,l.y-l.ay)>.3){commit(id);ch=true}}if(ch)save()}}
 buttons()}
// ---- buttons ----
const driveBtn=document.getElementById('drive'),feedBtn=document.getElementById('feed');
const show=(b,on,txt)=>{if(b.classList.contains('hidden')===on)b.classList.toggle('hidden',!on);if(txt&&b.textContent!==txt)b.textContent=txt};
const FOODS=['carrot','tomato','strawberry'],FIC={carrot:'🥕',tomato:'🍅',strawberry:'🍓'},FNM={carrot:'胡萝卜',tomato:'番茄',strawberry:'草莓'};
const ALLK=['pig','cow','piglet','calf'];const foodOf=()=>FOODS.find(k=>state.inv[k]>0);
function buttons(){const id=nearest(ALLK),a=id&&state.animals[id],f=foodOf(),cw=a&&(a.k==='cow'||a.k==='calf');
 show(driveBtn,!!a,a?(cw?'赶牛':'赶猪'):null);show(feedBtn,!!a&&!!f,a&&f?(cw?'喂牛 ':'喂猪 ')+FIC[f]:null)}
function applyDrive(p){const l=live[p.id];if(!l)return;Object.assign(l,{tx:p.tx,ty:p.ty,nx:p.nx,ny:p.ny,run:p.run,t:6,dir:p.dir,px:p.px,py:p.py})}
function drive(){const id=nearest(ALLK);if(!id)return;const l=live[id],p=state.player,k=state.animals[id].k;let dx=l.x-p.x,dy=l.y-p.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
 l.nx=null;l.tx=l.x+dx*5;l.ty=l.y+dy*5;
 // smart: steer through a gate roughly ahead (<=45°, <=5 tiles)
 let bg=null,bs=1e9;for(const i of gates){const gx=i%W+.5,gy=(i/W|0)+.5,vx=gx-l.x,vy=gy-l.y,gd=Math.hypot(vx,vy);if(gd>5||gd<.2)continue;if((vx*dx+vy*dy)/gd<.7)continue;const sc=gd*(2-(vx*dx+vy*dy)/gd);if(sc<bs){bs=sc;bg=[gx,gy,vx/gd,vy/gd]}}
 if(bg){l.tx=bg[0];l.ty=bg[1];l.nx=bg[0]+bg[2]*1.3;l.ny=bg[1]+bg[3]*1.3}
 l.px=p.x;l.py=p.y;l.run=Math.min(5,Math.max(l.run,0)+2.5);l.t=6;l.dir=dx<0?2:3;if(!isHost()&&window.SyncDrive)SyncDrive({id,tx:l.tx,ty:l.ty,nx:l.nx,ny:l.ny,run:l.run,dir:l.dir,px:p.x,py:p.y});if(!l.tt||performance.now()-l.tt>1500){l.tt=performance.now();toast(k==='cow'||k==='calf'?'小牛快跑～':'小猪快跑～')}}
function feed(){const id=nearest(ALLK),f=foodOf();if(!id||!f)return;const a=state.animals[id],r=role();state.inv[f]--;a.lf=a.lf||{};a.lf[r]=Date.now();
 if(GROWN[a.k]){a.fed=a.fed||{};a.fed[r]=(a.fed[r]||0)+1;const n=fedTotal(a);
  if(n>=GROW_FEEDS){const was=a.k;a.k=GROWN[was];a.fb=n;a.grown=Date.now();delete a.mom;const l=live[id];if(l){l.tx=null;l.nx=null}toast(a.k==='cow'?'小牛长大了！🐮':'小猪长大了！🐷')}
  else toast(ANI[a.k].name+'吃了'+FNM[f]+' '+FIC[f]+'（'+n+'/'+GROW_FEEDS+'）')}
 else if(BABY[a.k]){a.fed=a.fed||{};a.fed[r]=(a.fed[r]||0)+1;const n=breedN(a);if(n%8===0){const l=live[id],cid=id+'-b'+n/8;if(!state.animals[cid]){let bx=l.x,by=l.y;for(const[ox,oy]of[[.8,0],[-.8,0],[0,.8],[0,-.8],[0,0]])if(aFreeR(l.x+ox,l.y+oy,.2,false,id)){bx=l.x+ox;by=l.y+oy;break}
   spawnAnimal(BABY[a.k],bx,by,{id:cid,mom:id})}toast(a.k==='cow'?'生了一只小牛犊！🐮':'生了一只迷你小猪！🐷')}else toast('喂了一根'+FNM[f]+' '+FIC[f])}
 else toast(ANI[a.k].name+'吃了'+FNM[f]+' '+FIC[f]);commit(id);save();renderInv()}
driveBtn.addEventListener('pointerdown',e=>{e.preventDefault();drive()});feedBtn.addEventListener('pointerdown',e=>{e.preventDefault();feed()});
// ---- draw (called per row by game.js) ----
function animalsDraw(row){for(const id in live){const l=live[id],a=state.animals[id];if(!a||Math.floor(l.y)!==row)continue;const k=a.k;if(l.fade)ctx.globalAlpha=Math.max(0,l.fade/1.2);const sc=k==='piglet'?.7:k==='calf'?.85:k==='cow'?1.45:1.2;
 ctx.save();ctx.translate((l.x-sc/2)*T,(l.y-sc*.85)*T);ctx.scale(T*sc,T*sc);S[k==='cow'||k==='calf'?'cow':'pig'](ctx,l.dir,l.ph,l.mv);ctx.restore();ctx.globalAlpha=1;
 if(!l.fade&&Date.now()-lastFed(a)>ANI_HUNGRY_MS){ctx.font=`${T*.36}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💢',(l.x+sc*.3)*T,(l.y-sc*.95)*T+Math.sin(performance.now()/250)*2)}
 if(BABY[k]||GROWN[k]){const f=GROWN[k]?Math.min(1,fedTotal(a)/GROW_FEEDS):(breedN(a)%8)/8,w=T*.8,X=l.x*T-w/2,Y=(l.y-sc*.85)*T+2;ctx.beginPath();ctx.roundRect(X,Y,w,9,5);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.stroke();
  if(f>0){ctx.beginPath();ctx.roundRect(X+2,Y+2,(w-4)*f,5,3);ctx.fillStyle=GROWN[k]?'#5cc85a':'#ff8a2a';ctx.fill()}}}}
window.gateDriven=gateDriven;window.Animals={applyDrive,NAME:{pig:'小猪',cow:'小牛',piglet:'迷你小猪',calf:'小牛犊'},lastFed,HUNGRY:ANI_HUNGRY_MS,LEAVE:ANI_LEAVE_MS,live,spawn:spawnAnimal,drive,feed,isHost,fedTotal,aFree,nearest};
