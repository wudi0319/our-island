// v38: 钓鱼 — fixed wooden dock on the south shore. Stand on it -> 钓鱼 (3 food per cast).
// Island-level shared state: state.fishN={id:count} (counters, merged additively like inv), state.fishDex={id:{by,at}} (first catch).
(()=>{
const COST=3,FOODS=['carrot','tomato','strawberry'];
const TIERS=[
 {k:'普通',p:50,need:3,zone:80,spd:55,c:'#9aa5b1'},
 {k:'少见',p:27,need:4,zone:68,spd:58,c:'#5cb85c'},
 {k:'稀有',p:14,need:6,zone:56,spd:66,c:'#3a8ee6'},
 {k:'史诗',p:7,need:8,zone:52,spd:72,c:'#a05ce6'},
 {k:'传说',p:2,need:10,zone:46,spd:76,c:'#f0a020'}];
const FISH=[
 {id:'crucian',n:'小鲫鱼',t:0,sh:'fish',a:'#8fa38a',b:'#c9d6b8'},
 {id:'shrimp',n:'小虾',t:0,sh:'shrimp',a:'#f59a8a',b:'#ffd0c4'},
 {id:'ycroaker',n:'小黄鱼',t:0,sh:'fish',a:'#e8c040',b:'#fff0a0'},
 {id:'bass',n:'鲈鱼',t:1,sh:'fish',a:'#6f7f8f',b:'#c8d4de',spot:1},
 {id:'crab',n:'螃蟹',t:1,sh:'crab',a:'#e0503a',b:'#ff9a7a'},
 {id:'bigcroaker',n:'大黄鱼',t:2,sh:'fish',a:'#d9a020',b:'#ffe27a',big:1},
 {id:'octopus',n:'章鱼',t:2,sh:'octo',a:'#b06ad0',b:'#e6b8f5'},
 {id:'puffer',n:'河豚',t:3,sh:'puffer',a:'#d8b860',b:'#fff4c8'},
 {id:'lobster',n:'龙虾',t:3,sh:'lobster',a:'#d0382a',b:'#ff8a6a'},
 {id:'koi',n:'金色锦鲤',t:4,sh:'fish',a:'#f5b400',b:'#fff3b0',koi:1,big:1}];
const FM=Object.fromEntries(FISH.map(f=>[f.id,f]));
// ---- dock: from island centre go south to the first water tile, dock = 3 water tiles there ----
let dock=[],dockDir=1;
function calcDock(){dock=[];let best=null;
 for(const sx of[0,-1,1,-2,2,-3,3,-4,4,-5,5,-6,6,-8,8,-10,10])for(const dirY of[1,-1]){const x=W/2+sx;let y=H/2;while(y>1&&y<H-2&&ter(x,y)!==WATER)y+=dirY;
  if(ter(x,y-dirY)===WATER)continue;let ok=ter(x,y)===WATER,n=0;for(let yy=y;yy>=0&&yy<H;yy+=dirY){n++;if(ter(x,yy)!==WATER)ok=false}if(n<4)ok=false;
  const d=Math.abs(y-H/2)+Math.abs(sx)*.5;if(ok&&(!best||d<best.d))best={x,y,dirY,d}}
 if(!best)best={x:W/2,y:H-6,dirY:1};
 for(let k=0;k<3;k++)dock.push([best.x,best.y+k*best.dirY]);dockDir=best.dirY}
calcDock();
window.isDock=(x,y)=>dock.some(d=>d[0]===x&&d[1]===y);
const onDock=()=>{const p=Game.state.player;return isDock(Math.floor(p.x),Math.floor(p.y))};
window.dockDraw=()=>{for(const[x,y]of dock){const X=x*T,Y=y*T;
  ctx.fillStyle='#6b4a32';for(const px of[.12,.8])ctx.fillRect(X+px*T,Y+T*.75,T*.1,T*.4);
  ctx.fillStyle='#c98f55';ctx.fillRect(X+T*.08,Y,T*.84,T);ctx.strokeStyle='#6b4a32';ctx.lineWidth=2;
  for(let k=0;k<4;k++){ctx.fillStyle=k%2?'#b97f48':'#d59d62';ctx.fillRect(X+T*.08,Y+k*T/4,T*.84,T/4-1);ctx.beginPath();ctx.moveTo(X+T*.08,Y+(k+1)*T/4-.5);ctx.lineTo(X+T*.92,Y+(k+1)*T/4-.5);ctx.stroke()}
  ctx.strokeRect(X+T*.08,Y,T*.84,T);ctx.fillStyle='#5a3a24';for(const px of[.2,.78])for(let k=0;k<4;k++)ctx.fillRect(X+px*T,Y+k*T/4+T*.1,2,2)}
 const[x,y]=dock[dock.length-1];ctx.fillStyle='#6b4a32';ctx.fillRect(x*T+T*.08,(dockDir>0?y+1:y)*T-3,T*.84,6)};
// ---- shared state ----
const fs=()=>{const s=Game.state;s.fishN=s.fishN||{};s.fishDex=s.fishDex||{};return s};
const foodTotal=()=>FOODS.reduce((n,k)=>n+(Game.state.inv[k]||0),0);
function pay(n){const inv=Game.state.inv;while(n>0){const top=FOODS.slice().sort((a,b)=>(inv[b]||0)-(inv[a]||0))[0];if(!(inv[top]>0))return false;inv[top]--;n--}return true}
const who=()=>typeof charKind!=='undefined'&&charKind==='white'?'小白':'鸡毛';
// ---- session ----
const F={st:'idle',t:0,tier:0,ok:0,needle:-90,dir:1,zc:0,force:null};
const btn=document.createElement('button');btn.id='fishBtn';btn.className='hidden';btn.textContent='🎣 钓鱼';document.querySelector('main').appendChild(btn);
const ui=document.createElement('div');ui.id='fishUI';ui.className='hidden';
ui.innerHTML='<div class="card"><b id="fTitle">有鱼上钩！</b><canvas id="fGauge" width="300" height="170"></canvas><div id="fDots"></div><p class="fHint">指针扫到红色区域时点「收线」</p><button id="fReel">收线</button></div>';document.body.appendChild(ui);
const bag=document.createElement('div');bag.id='fishBag';bag.className='hidden';document.body.appendChild(bag);
const bagBtn=document.createElement('button');bagBtn.id='bagBtn';bagBtn.textContent='🐟 鱼篓';document.querySelector('main').appendChild(bagBtn);
function rollTier(){let r=Math.random()*100;for(let i=0;i<TIERS.length;i++){if(r<TIERS[i].p)return i;r-=TIERS[i].p}return 0}
function cast(){if(F.st!=='idle')return;if(!onDock())return Game.toast('要站在码头上才能钓鱼哦');const have=foodTotal();
 if(have<COST)return Game.toast(`食物不够啦，钓一次要${COST}个食物（现在${have}个）`);
 pay(COST);Game.save();Game.refresh();F.st='cast';F.t=.7;F.wait=2+Math.random()*2.5;Game.toast('甩竿！用掉3个食物当鱼饵');upd()}
function bite(){const f=F.force||{};F.force=null;if(f.empty!=null?f.empty:Math.random()<.3){F.st='idle';Game.toast('饵被啄掉了…');upd();return}
 F.tier=f.tier!=null?f.tier:rollTier();F.ok=0;F.needle=-90;F.dir=1;F.zc=0;F.st='fight';const ti=TIERS[F.tier];
 document.getElementById('fTitle').innerHTML=`有鱼上钩！<span style="color:${ti.c}">【${ti.k}】</span>`;ui.classList.remove('hidden');dots();upd()}
function dots(){const ti=TIERS[F.tier];document.getElementById('fDots').innerHTML=Array.from({length:ti.need},(_,i)=>`<i class="${i<F.ok?'on':''}"></i>`).join('')}
function inZone(){return Math.abs(F.needle-F.zc)<=TIERS[F.tier].zone/2}
function reel(){if(F.st!=='fight')return;const ti=TIERS[F.tier];
 if(!inZone()){F.st='idle';ui.classList.add('hidden');Game.toast('哎呀，鱼跑掉了…饵也没了');upd();return false}
 F.ok++;dots();if(F.ok>=ti.need){catchFish();return true}
 const m=Math.min(28,(90-ti.zone/2)-5);F.zc=Math.max(-m,Math.min(m,(Math.random()*2-1)*m));return true}
function catchFish(){const pool=FISH.filter(f=>f.t===F.tier),f=F.forceFish?FM[F.forceFish]:pool[Math.random()*pool.length|0];F.forceFish=null;
 const s=fs();s.fishN[f.id]=(s.fishN[f.id]||0)+1;let first='';if(!s.fishDex[f.id]){s.fishDex[f.id]={by:who(),at:Date.now()};first=' 🆕图鉴解锁！'}
 F.st='idle';ui.classList.add('hidden');Game.save();Game.toast(`钓到了【${TIERS[f.t].k}】${f.n}！${first}`);F.last=f.id;upd()}
function upd(){btn.classList.toggle('hidden',!(onDock()&&F.st==='idle'));}
btn.onclick=cast;document.getElementById('fReel').onclick=reel;
// ---- per-frame ----
let lastT=performance.now(),acc=0;
function step(){const now=performance.now(),dt=Math.min(.05,(now-lastT)/1000);lastT=now;
 if(F.st==='cast'){F.t-=dt;if(F.t<=0){F.st='wait'}}else if(F.st==='wait'){F.wait-=dt;if(F.wait<=0)bite()}
 else if(F.st==='fight'){const sp=TIERS[F.tier].spd;F.needle+=F.dir*sp*dt;if(F.needle>=90){F.needle=90;F.dir=-1}if(F.needle<=-90){F.needle=-90;F.dir=1}gauge()}
 if((acc+=dt)>.25){acc=0;if(F.st==='idle')upd();else if(!onDock()&&F.st!=='fight'){F.st='idle';Game.toast('离开码头，收竿了');upd()}}
 requestAnimationFrame(step)}
requestAnimationFrame(step);
function gauge(){const c=document.getElementById('fGauge'),g=c.getContext('2d'),cx=150,cy=155,R=130,ti=TIERS[F.tier],rad=d=>(d-90)*Math.PI/180;
 g.clearRect(0,0,300,170);g.lineCap='butt';g.lineWidth=26;g.strokeStyle='#e9dcc0';g.beginPath();g.arc(cx,cy,R,Math.PI,0);g.stroke();
 g.strokeStyle='#ff5a4a';g.beginPath();g.arc(cx,cy,R,rad(F.zc-ti.zone/2),rad(F.zc+ti.zone/2));g.stroke();
 g.lineWidth=3;g.strokeStyle='#6b4a32';g.beginPath();g.arc(cx,cy,R+13,Math.PI,0);g.stroke();g.beginPath();g.arc(cx,cy,R-13,Math.PI,0);g.stroke();
 const a=rad(F.needle);g.lineCap='round';g.lineWidth=6;g.strokeStyle='#3b2a20';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*(R+8),cy+Math.sin(a)*(R+8));g.stroke();
 g.fillStyle='#3b2a20';g.beginPath();g.arc(cx,cy,10,0,7);g.fill()}
// rod + bobber in world
window.fishDraw=()=>{if(F.st==='idle'||F.st==='fight'&&false)return;const p=Game.state.player,[cx,cy]=camXY();ctx.setTransform(dpr,0,0,dpr,-Math.round(cx*dpr),-Math.round(cy*dpr));
 const[dx,dy]=dock[dock.length-1],bx=(dx+.5)*T,by=(dy+.5+dockDir*1.3)*T,t=performance.now()/1000;let k=1;if(F.st==='cast')k=1-F.t/.7;
 const rx=p.x*T+T*.35,ry=(p.y-.9)*T;const tipX=rx+T*.2,tipY=ry-T*.6;
 ctx.strokeStyle='#7a4b1d';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(rx,ry+T*.3);ctx.lineTo(tipX,tipY);ctx.stroke();
 const bob=F.st==='fight'?Math.sin(t*20)*5+6:Math.sin(t*3)*2,ex=tipX+(bx-tipX)*k,ey=tipY+(by-tipY)*k-Math.sin(k*Math.PI)*T+bob*(k>=1);
 ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.quadraticCurveTo((tipX+ex)/2,Math.max(tipY,ey)+10,ex,ey);ctx.stroke();
 if(k>=1){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(bx,by+6,10+Math.sin(t*3)*2,4,0,0,7);ctx.stroke()}
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,6,0,Math.PI);ctx.fill();ctx.fillStyle='#ff4a3a';ctx.beginPath();ctx.arc(ex,ey,6,Math.PI,0);ctx.fill();ctx.strokeStyle='#3b2a20';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,ey,6,0,7);ctx.stroke();
 if(F.st==='fight'){ctx.font='900 22px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ff4a3a';ctx.fillText('！',bx,by-16)}};
// ---- pixel icons (16x16, nearest upscaled) ----
function icon(f,px,sil){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),P=(x,y,w,h,col)=>{g.fillStyle=sil?'#3b3b48':col;g.fillRect(x,y,w,h)};const A=f.a,B=f.b,K='#2a1d16';
 if(f.sh==='fish'){const b=f.big?1:0;P(3-b,5-b,9+b,6+b*2,A);P(4-b,9,8+b,2+b,B);P(12,6,3,4,A);P(14,5,1,6,A);P(4,7,1,1,K);P(7,4-b,3,1,A);if(f.spot){P(7,7,1,1,K);P(9,6,1,1,K)}if(f.koi){P(6,6,3,2,'#e04020');P(9,8,2,1,'#e04020')}}
 else if(f.sh==='shrimp'){P(4,6,8,4,A);P(3,7,2,2,A);P(11,8,3,3,A);P(12,10,2,3,B);P(4,7,1,1,K);P(1,4,4,1,A);P(5,10,1,2,B);P(7,10,1,2,B);P(9,10,1,2,B)}
 else if(f.sh==='crab'){P(4,7,8,5,A);P(5,11,6,1,B);P(5,6,1,2,K);P(10,6,1,2,K);P(1,5,3,3,A);P(12,5,3,3,A);P(2,12,2,1,A);P(12,12,2,1,A);P(3,11,1,1,A);P(12,11,1,1,A)}
 else if(f.sh==='octo'){P(4,2,8,7,A);P(5,7,6,2,B);P(6,5,1,1,K);P(9,5,1,1,K);for(const x of[3,5,7,9,11])P(x,9,2,4+(x%4?1:0),A)}
 else if(f.sh==='puffer'){P(3,3,10,10,A);P(4,9,8,3,B);for(const[x,y]of[[2,5],[13,6],[5,2],[10,2],[2,10],[13,10],[7,13]])P(x,y,1,1,K);P(5,6,1,1,K);P(13,7,2,2,A)}
 else if(f.sh==='lobster'){P(5,5,7,4,A);P(11,6,3,2,A);P(13,5,2,4,B);P(1,3,4,3,A);P(1,8,4,3,A);P(5,6,1,1,K);P(6,9,1,2,A);P(8,9,1,2,A);P(10,9,1,2,A);P(4,4,1,1,B)}
 const o=document.createElement('canvas');o.width=o.height=px;const og=o.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(c,0,0,px,px);o.className='ficon';return o}
// ---- 鱼篓 / 图鉴 ----
let tab='bag';
function renderBag(){const s=fs(),tot=Object.values(s.fishN).reduce((a,b)=>a+b,0),got=Object.keys(s.fishDex).filter(k=>FM[k]).length;
 bag.innerHTML=`<div class="card"><div class="tabs"><button data-tab="bag" class="${tab==='bag'?'on':''}">🧺 鱼篓（${tot}）</button><button data-tab="dex" class="${tab==='dex'?'on':''}">📖 图鉴 ${got}/${FISH.length}</button></div><div class="fgrid"></div><button id="bagClose">好的</button></div>`;
 const grid=bag.querySelector('.fgrid');
 if(tab==='bag'){const own=FISH.filter(f=>s.fishN[f.id]>0);if(!own.length)grid.innerHTML='<p class="empty">鱼篓还是空的，去码头钓鱼吧 🎣</p>';
  for(const f of own){const d=document.createElement('div');d.className='fc';d.appendChild(icon(f,48));d.insertAdjacentHTML('beforeend',`<b>${f.n}</b><span style="color:${TIERS[f.t].c}">${TIERS[f.t].k}</span><em>×${s.fishN[f.id]}</em>`);grid.appendChild(d)}}
 else for(const f of FISH){const e=s.fishDex[f.id],d=document.createElement('div');d.className='fc'+(e?'':' no');d.appendChild(icon(f,48,!e));
  const dt=e?new Date(e.at):null;d.insertAdjacentHTML('beforeend',e?`<b>${f.n}</b><span style="color:${TIERS[f.t].c}">${TIERS[f.t].k}</span><small>${e.by} 首钓 · ${dt.getMonth()+1}/${dt.getDate()}</small>`:`<b>？？？</b><span style="color:${TIERS[f.t].c}">${TIERS[f.t].k}</span><small>还没钓到</small>`);grid.appendChild(d)}}
bagBtn.onclick=()=>{renderBag();bag.classList.remove('hidden')};
bag.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;renderBag()}if(e.target.id==='bagClose'||e.target===bag)bag.classList.add('hidden')});
window.Fish={F,cast,reel,inZone,TIERS,FISH,dock:()=>dock,onDock,render:renderBag,COST,
 setNeedleInZone(){F.needle=F.zc},setNeedleOut(){F.needle=F.zc>0?-85:85},skipWait(){if(F.st==='cast'||F.st==='wait'){F.st='wait';F.wait=0}}};
})();
