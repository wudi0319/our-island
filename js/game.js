// 我们的小岛 v2 — big sandbox island, player + joystick, cartoon art.
const W=64,H=64,T=48; // map size, tile px (CSS)
const WATER=0,SAND=1,GRASS=2,SOIL=3;
const CROPS={carrot:{name:'胡萝卜',ms:60e3},tomato:{name:'番茄',ms:120e3},strawberry:{name:'草莓',ms:180e3}}; // per stage, testing speeds
const TOOLS=[['hoe','锄地'],['seed','播种'],['can','浇水'],['basket','收获'],['axe','砍树'],['fence','篱笆','fenceIcon'],['gate','栅栏门','gateIcon'],['flower','花'],['tree','树'],['house','小屋'],['canteen','食堂','canteenIcon'],['erase','拆除']];
const SOLID={tree:1,house:1,canteen:1,fence:1,rock:1};const BIG={house:1,canteen:1};const CANTEEN='胖仔食堂';

// ---- world generation (seeded) ----
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function genWorld(seed){const r=rng(seed),ter=new Array(W*H),obj={};
 const bumps=[...Array(8)].map(()=>[r()*W,r()*H,4+r()*6,r()*6]);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-W/2)/(W/2),dy=(y-H/2)/(H/2);
  let h=1-Math.sqrt(dx*dx+dy*dy)*1.15+.12*Math.sin(x*.31+seed)*Math.cos(y*.27)+.07*Math.sin(x*.13-y*.17);
  ter[y*W+x]=h<0?WATER:h<.1?SAND:GRASS}
 // ponds
 for(let k=0;k<3;k++){const px=16+r()*32|0,py=16+r()*32|0,rad=2+r()*2.5;
  if(Math.abs(px-W/2)<6&&Math.abs(py-H/2)<6)continue;
  for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){const d=Math.hypot(x,y*1.2);const i=(py+y)*W+px+x;if(d<rad)ter[i]=WATER;else if(d<rad+1&&ter[i]===GRASS)ter[i]=SAND}}
 // trees, rocks, flowers
 for(let i=0;i<W*H;i++){const x=i%W,y=i/W|0;if(ter[i]!==GRASS||Math.hypot(x-W/2,y-H/2)<5)continue;const v=r();
  if(v<.08)obj[i]='tree';else if(v<.095)obj[i]='rock';else if(v<.12)obj[i]='flower'}
 obj[(H/2-3)*W+W/2]='house';return{ter,obj}}
function newState(){const seed=20261101,{ter,obj}=genWorld(seed);
 return{v:2,seed,w:W,h:H,ter,obj,crops:{},inv:{carrot:0,tomato:0,strawberry:0,wood:0},player:{x:W/2+.5,y:H/2+.5,dir:0},updatedAt:Date.now()}}
function loadState(){const s=Store.load();if(s&&s.v===2&&s.ter&&s.ter.length===W*H)return s;Store.clearOld&&Store.clearOld();return newState()}
// character choice is per-device (each phone picks its own pup)
let charKind=localStorage.getItem('our-island-char')||'yellow';
function setChar(k){charKind=k;localStorage.setItem('our-island-char',k);document.querySelectorAll('#menu [data-char]').forEach(b=>b.classList.toggle('on',b.dataset.char===k))}
let state=loadState(),tool='hoe',seed='carrot',dirty=false,lastSave=0;
// ---- big houses: obj 'house' sits on the door tile (bottom row), footprint x-1..x+2, y-3..y (4x4) ----
let occ={};const foot=a=>{const x=a%W,y=a/W|0,r=[];for(let dy=-3;dy<=0;dy++)for(let dx=-1;dx<=2;dx++)if(x+dx>=0&&x+dx<W&&y+dy>=0)r.push((y+dy)*W+x+dx);return r};
let gates=[];const gateAng={};
function rebuildOcc(){occ={};gates=Object.keys(state.obj).filter(k=>state.obj[k]==='gate').map(Number);for(const k in state.obj)if(BIG[state.obj[k]])foot(+k).forEach(j=>occ[j]=+k)}
function migrate(){state.names=state.names||{};let ch=false;
 // v9: food list lives at island level; merge old per-house lists (dedupe) and turn that house into the canteen
 if(!state.foodList){state.foodList=[];ch=true}
 if(state.lists){const seen=new Set(state.foodList.map(i=>i.id+'|'+i.name+'|'+(i.url||'')));let conv=Object.values(state.obj).includes('canteen');
  for(const k in state.lists){const L=state.lists[k]||[];for(const it of L){const key=it.id+'|'+it.name+'|'+(it.url||''),k2='|'+it.name+'|'+(it.url||'');if(seen.has(key)||[...seen].some(s=>s.endsWith(k2)))continue;seen.add(key);state.foodList.push(it)}
   if(!conv&&state.obj[k]==='house'&&L.length){state.obj[k]='canteen';delete state.names[k];conv=true}}
  for(const k in state.obj)if(!conv&&state.obj[k]==='house'&&/食堂/.test(state.names[k]||'')){state.obj[k]='canteen';delete state.names[k];conv=true}
  delete state.lists;ch=true}
 for(const k in state.obj)if(BIG[state.obj[k]]){const a=+k,x=a%W,y=a/W|0;
  if(x<1||x>W-3||y<3){delete state.obj[k];ch=true;continue}
  for(const j of foot(a)){if(j!==a&&state.obj[j]){if(BIG[state.obj[j]]){delete state.obj[a];break}delete state.obj[j];ch=true}
   if(state.crops[j]){delete state.crops[j];ch=true}if(state.ter[j]===0||state.ter[j]===3){state.ter[j]=2;ch=true}}
  if(state.obj[k]==='house'&&state.names[k]==null){state.names[k]='我们的家';ch=true}}
 rebuildOcc();const p=state.player,pi=Math.floor(p.y)*W+Math.floor(p.x);
 if(occ[pi]!=null){const a=occ[pi];p.x=a%W+.5;p.y=(a/W|0)+1.5;ch=true}
 if(ch)save()}
const save=()=>{state.updatedAt=Date.now();Store.save(state);dirty=false};
Store.subscribe(s=>{if(s&&s.v===2){state=s;rebuildOcc()}});migrate();

// ---- helpers ----
const idx=(x,y)=>y*W+x,inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const ter=(x,y)=>inb(x,y)?state.ter[idx(x,y)]:WATER;
const blocked=(x,y)=>{if(!inb(x,y))return true;const i=idx(x,y);return state.ter[i]===WATER||SOLID[state.obj[i]]||occ[i]!=null||state.obj[i]==='gate'&&!gateNear(i)};
// gates open when any dog (me or the other online pup) is within ~1.5 tiles
function dogs(){const L=[state.player],o=window.Sync&&Sync.others;if(o)for(const k in o){const d=o[k];if(d.here&&d.x!=null&&Date.now()-d.t<20000)L.push(d)}return L}
function gateNear(i){const x=i%W+.5,y=(i/W|0)+.5;return dogs().some(d=>Math.hypot(d.x-x,d.y-y)<1.6)}
function gatesUpdate(dt){for(const i of gates){const t=gateNear(i)?1:0,a=gateAng[i]||0;if(a!==t){gateAng[i]=t>a?Math.min(1,a+dt*5):Math.max(0,a-dt*5);dirty=dirty}}}
const isFence=(x,y)=>inb(x,y)&&(state.obj[idx(x,y)]==='fence'||state.obj[idx(x,y)]==='gate');

// ---- crop growth ----
function tick(){const now=Date.now();let ch=false;
 for(const k in state.crops){const c=state.crops[k];if(c.stage<2&&c.wateredAt&&now-c.wateredAt>=CROPS[c.type].ms){c.stage++;c.wateredAt=null;ch=true}}
 if(ch)save()}

// ---- input: joystick ----
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let jv={x:0,y:0},jid=null;
function joyMove(e){const r=joy.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),R=r.width/2-10;
 if(m>R){dx*=R/m;dy*=R/m}jv={x:dx/R,y:dy/R};knob.style.transform=`translate(${dx}px,${dy}px)`}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);joyMove(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)joyMove(e)});
const joyEnd=e=>{if(e.pointerId!==jid)return;jid=null;jv={x:0,y:0};knob.style.transform=''};
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
const keys={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.key]=1});addEventListener('keyup',e=>keys[e.key]=0);

// ---- player ----
let moving=false,phase=0;
function front(){const p=state.player,d=[[0,1],[0,-1],[-1,0],[1,0]][p.dir];return[Math.floor(p.x)+d[0],Math.floor(p.y)+d[1]]}
function canStand(x,y){const r=.28;return![[x-r,y-.1],[x+r,y-.1],[x-r,y+.2],[x+r,y+.2]].some(([a,b])=>blocked(Math.floor(a),Math.floor(b)))}
function update(dt){const p=state.player;let vx=jv.x,vy=jv.y;
 if(keys.ArrowLeft||keys.a)vx=-1;if(keys.ArrowRight||keys.d)vx=1;if(keys.ArrowUp||keys.w)vy=-1;if(keys.ArrowDown||keys.s)vy=1;
 const m=Math.hypot(vx,vy);moving=m>.2;if(!moving)return;
 if(m>1){vx/=m;vy/=m}const sp=4.2*dt;
 p.dir=Math.abs(vx)>Math.abs(vy)?(vx<0?2:3):(vy<0?1:0);
 if(canStand(p.x+vx*sp,p.y))p.x+=vx*sp;if(canStand(p.x,p.y+vy*sp))p.y+=vy*sp;phase+=dt*14;dirty=true}

// ---- actions on the tile in front ----
const toastEl=document.getElementById('toast');let tt;
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('show'),1500)}
function act(){const[x,y]=front();actAt(x,y)}
function bigErr(x,y,k){if(k==='canteen'&&Object.values(state.obj).includes('canteen'))return'已经有胖仔食堂啦';if(!inb(x,y)||x<1||x>W-3||y<3)return'这里放不下';const i=idx(x,y),fp=foot(i);if(fp.length<16||fp.some(j=>state.ter[j]===WATER||state.obj[j]||state.crops[j]||state.ter[j]===SOIL||occ[j]!=null))return'需要4×4的空地哦';
 const p=state.player;state.obj[i]=k;rebuildOcc();const ok=canStand(p.x,p.y);delete state.obj[i];rebuildOcc();return ok?null:'离太近啦，退后一点'}
function actAt(x,y){if(!inb(x,y))return;const i=idx(x,y);
 if(occ[i]!=null){const a=occ[i],kind=state.obj[a];if(tool==='erase'){delete state.obj[a];delete state.names[a];rebuildOcc();save();return toast(kind==='canteen'?'胖仔食堂拆掉了，美食记录还在哦':'小屋拆掉了')}
  return i===a?openBuilding(a):kind==='house'?openSign(a):openBuilding(a)}
 const t=state.ter[i],o=state.obj[i],c=state.crops[i];
 const p=state.player,pi=idx(Math.floor(p.x),Math.floor(p.y));
 switch(tool){
 case'hoe':if(t===WATER)return toast('那是水哦');if(o)return toast('这里有东西哦');if(t===SOIL)return;state.ter[i]=SOIL;break;
 case'seed':if(t!==SOIL)return toast('先锄地再播种');if(c)return toast('已经种上啦');state.crops[i]={type:seed,stage:0,wateredAt:null,plantedAt:Date.now()};toast('种下了'+CROPS[seed].name+'，记得浇水');break;
 case'can':if(!c)return toast('前面没有作物');if(c.stage===2)return toast('成熟啦，快收获');if(c.wateredAt)return toast('已经浇过啦');c.wateredAt=Date.now();toast('浇水啦 💧');break;
 case'basket':if(!c||c.stage<2)return toast('还没成熟呢');state.inv[c.type]++;toast('收获 '+CROPS[c.type].name+' +1');delete state.crops[i];break;
 case'axe':if(o!=='tree')return toast('前面没有树');delete state.obj[i];state.inv.wood=(state.inv.wood||0)+3;toast('木头 +3');break;
 case'erase':if(o){delete state.obj[i];if(state.fhp)delete state.fhp[i]}else if(c)delete state.crops[i];else if(t===SOIL)state.ter[i]=GRASS;else return;break;
 case'house':case'canteen':{const er=bigErr(x,y,tool);if(er)return toast(er);state.obj[i]=tool;if(tool==='house')state.names[i]='我们的家';else toast('胖仔食堂开张啦！');rebuildOcc();break}
 default:if((tool==='fence'||tool==='gate')&&(o==='fence'||o==='gate'))return window.fenceRepair&&fenceRepair(i);if(i===pi)return;if(t===WATER)return toast('不能放在水里');if(o||c||t===SOIL)return toast('这里放不下');state.obj[i]=tool;if(SOLID[tool]&&!canStand(p.x,p.y)){delete state.obj[i];return toast('离太近啦，退后一点')}if(window.fenceNew&&(tool==='fence'||tool==='gate'))fenceNew(i)}
 rebuildOcc();save();renderInv()}

// ---- rendering ----
const cv=document.getElementById('map'),ctx=cv.getContext('2d');let vw=0,vh=0,dpr=1,frame=0;
function resize(){const m=cv.parentElement;dpr=devicePixelRatio||1;vw=m.clientWidth;vh=m.clientHeight;cv.width=vw*dpr;cv.height=vh*dpr}
const COL={[SAND]:'#f7e2b5',[GRASS]:'#b4d98a',[SOIL]:'#c99566'};
function drawTile(x,y,t){const X=x*T,Y=y*T;
 if(t===WATER){ctx.fillStyle='#9fd6e0';ctx.fillRect(X,Y,T+1,T+1);const o=(frame/30+x*1.7+y*1.3)%6;if(o<2){ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.roundRect(X+T*.2+o*4,Y+T*.4,T*.3,3,2);ctx.fill()}return}
 ctx.fillStyle=t===SOIL?COL[GRASS]:COL[t];ctx.fillRect(X,Y,T+1,T+1);
 if(t===GRASS&&(x*7+y*13)%5===0){ctx.strokeStyle='#92c06c';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X+T*.3,Y+T*.6);ctx.lineTo(X+T*.27,Y+T*.45);ctx.moveTo(X+T*.38,Y+T*.6);ctx.lineTo(X+T*.42,Y+T*.44);ctx.stroke()}
 if(t===SAND&&(x*5+y*3)%7===0){ctx.fillStyle='#e8c98f';ctx.beginPath();ctx.arc(X+T*.6,Y+T*.5,2,0,7);ctx.fill()}
 if(t===SOIL){const c=state.crops[idx(x,y)];ctx.fillStyle=c&&c.wateredAt?'#9a6a44':COL[SOIL];ctx.strokeStyle='#3b2a20';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(X+3,Y+3,T-6,T-6,10);ctx.fill();ctx.stroke()}}
// soft shoreline: draw sand/grass edges as rounded blobs over water
function drawShore(x,y,t){if(t===WATER)return;const X=x*T,Y=y*T;
 for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(ter(x+dx,y+dy)===WATER){ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=3;ctx.beginPath();
  if(dx)ctx.moveTo(X+(dx>0?T:0),Y+4),ctx.lineTo(X+(dx>0?T:0),Y+T-4);else ctx.moveTo(X+4,Y+(dy>0?T:0)),ctx.lineTo(X+T-4,Y+(dy>0?T:0));ctx.stroke()}}
function sprite(fn,x,y,...a){ctx.save();ctx.translate(x*T,y*T);ctx.scale(T,T);fn(ctx,...a);ctx.restore()}
function draw(){frame++;const p=state.player;
 const[cx,cy]=camXY();
 ctx.setTransform(dpr,0,0,dpr,-Math.round(cx*dpr),-Math.round(cy*dpr));
 const x0=Math.max(0,cx/T|0),y0=Math.max(0,cy/T|0),x1=Math.min(W-1,(cx+vw)/T|0),y1=Math.min(H-1,(cy+vh)/T|0);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawTile(x,y,state.ter[idx(x,y)]);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawShore(x,y,state.ter[idx(x,y)]);
 // objects + player sorted by row
 const py=Math.floor(p.y);
 for(let y=Math.max(0,y0-1);y<=Math.min(H-1,y1+1);y++){
  for(let x=Math.max(0,x0-1);x<=Math.min(W-1,x1+1);x++){const i=idx(x,y),c=state.crops[i],o=state.obj[i];
   if(c){sprite(S.crop,x,y,c.type,c.stage);if(c.stage===2&&(frame>>4)%2)sprite((g)=>circ(g,.85,.15,.07,'#fff6a0'),x,y)}
   if(o==='gate')sprite(S.gate,x,y,isFence(x,y-1)||isFence(x,y+1),gateAng[i]||0);
   else if(o==='fence')sprite(S.fence,x,y,isFence(x,y-1),isFence(x+1,y),isFence(x,y+1),isFence(x-1,y));
   if((o==='fence'||o==='gate')&&window.fenceFx)fenceFx(x,y,i);
   else if(BIG[o]){ctx.save();ctx.translate((x-1.6)*T,(y-2.99)*T);ctx.scale(T*4.2,T*4.2);S[o](ctx);ctx.restore();drawSign(x,y,o==='canteen'?CANTEEN:state.names[i]||'我们的家')}
   else if(o==='tree'){ctx.save();ctx.translate((x-.15)*T,(y-.6)*T);ctx.scale(T*1.3,T*1.6);S.tree(ctx);ctx.restore()}
   else if(o)sprite(S[o],x,y)}
  if(window.babyDraw&&!baby.carried&&y===Math.floor(baby.y))babyDraw();
  window.drawOthers&&drawOthers(y);window.animalsDraw&&animalsDraw(y);window.intrDraw&&intrDraw(y);
  if(y===py){ctx.save();ctx.translate((p.x-.7)*T,(p.y-1.2)*T);ctx.scale(T*1.4,T*1.4);S.puppy(ctx,p.dir,phase,moving,charKind);ctx.restore();if(typeof baby!=='undefined'&&baby.carried)babyDraw()}}
 
 if(prev){const ok=!bigErr(prev.x,prev.y,prev.k);ctx.fillStyle=ok?'rgba(80,220,110,.35)':'rgba(255,70,70,.38)';ctx.strokeStyle=ok?'#2fa84f':'#e03b3b';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect((prev.x-1)*T,(prev.y-3)*T,4*T,4*T,12);ctx.fill();ctx.stroke();
  ctx.save();ctx.globalAlpha=.6;ctx.translate((prev.x-1.6)*T,(prev.y-2.99)*T);ctx.scale(T*4.2,T*4.2);S[prev.k](ctx);ctx.restore()}
 }
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);gatesUpdate(dt);window.animalsUpdate&&animalsUpdate(dt);window.intrUpdate&&intrUpdate(dt);window.babyUpdate&&babyUpdate(dt);draw();window.intrOverlay&&intrOverlay();if(dirty&&now-lastSave>2000){lastSave=now;save()}requestAnimationFrame(loop)}

const plaque=(x,y,name)=>{const w=Math.max(1.1,Math.min(2.4,.3*Array.from(name).length+.45)),h=.5;return{x:x+.5-w/2,y:y-1.98,w,h}};
function drawSign(x,y,name){const q=plaque(x,y,name),sx=q.x*T,sy=q.y*T,w=q.w*T,h=q.h*T;
 ctx.beginPath();ctx.roundRect(sx,sy+3,w,h,12);ctx.fillStyle='rgba(90,58,34,.35)';ctx.fill();
 ctx.beginPath();ctx.roundRect(sx,sy,w,h,12);ctx.fillStyle='#fff3d6';ctx.fill();ctx.lineWidth=3.5;ctx.strokeStyle='#3b2a20';ctx.stroke();
 ctx.fillStyle='#ff9ab0';[sx+8,sx+w-8].forEach(cx=>{ctx.beginPath();ctx.arc(cx,sy+h/2,3,0,7);ctx.fill()});
 ctx.fillStyle='#7a4b1d';ctx.font=`900 ${T*.3}px "Yuanti SC","PingFang SC","Hiragino Maru Gothic ProN",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,sx+w/2,sy+h/2+1)}
const dlg=document.getElementById('signDlg'),signIn=document.getElementById('signIn');let signA=null;
function openSign(a){signA=a;signIn.value=state.names[a]||'';dlg.classList.remove('hidden');setTimeout(()=>signIn.focus(),50)}
function closeSign(ok){if(ok&&signA!=null){const v=Array.from(signIn.value.trim()).slice(0,12).join('')||'我们的家';state.names[signA]=v;save();toast('门牌改成「'+v+'」')}signIn.blur();dlg.classList.add('hidden');signA=null}
document.getElementById('signOk').onclick=()=>closeSign(true);document.getElementById('signCancel').onclick=()=>closeSign(false);
signIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)closeSign(true)});
function camXY(){const p=state.player;let cx=p.x*T-vw/2,cy=p.y*T-vh/2;return[Math.max(0,Math.min(W*T-vw,cx)),Math.max(0,Math.min(H*T-vh,cy))]}
function toWorld(e){const r=cv.getBoundingClientRect(),[cx,cy]=camXY();return[(e.clientX-r.left+cx)/T,(e.clientY-r.top+cy)/T]}
// ---- tap-to-use + building preview ----
let prev=null,tap=null;const pvBar=document.getElementById('pv');
function showPrev(x,y){prev={x:Math.max(1,Math.min(W-3,x)),y:Math.max(3,Math.min(H-1,y)),k:tool};pvBar.classList.remove('hidden')}
function cancelPrev(){prev=null;pvBar.classList.add('hidden')}
document.getElementById('pvOk').addEventListener('click',()=>{if(!prev)return;const er=bigErr(prev.x,prev.y,prev.k);if(er)return toast(er);const{x,y,k}=prev,t0=tool;tool=k;cancelPrev();actAt(x,y);tool=t0});
document.getElementById('pvNo').addEventListener('click',cancelPrev);
function tapBuilding(wx,wy){const p=state.player;for(const k in state.obj)if(BIG[state.obj[k]]){const x=k%W,y=k/W|0,cant=state.obj[k]==='canteen';
  const q=plaque(x,y,cant?CANTEEN:state.names[k]||'我们的家');if(wx>=q.x-.1&&wx<=q.x+q.w+.1&&wy>=q.y-.15&&wy<=q.y+q.h+.15){cant?openBuilding(+k):openSign(+k);return true}
  if(tool!=='erase'&&wx>=x-1&&wx<=x+3&&wy>=y-1.4&&wy<=y+1){openBuilding(+k);return true}}return false}
cv.addEventListener('pointerdown',e=>{const[wx,wy]=toWorld(e);if(window.babyTap&&babyTap(wx,wy))return;
 tap={id:e.pointerId,sx:e.clientX,sy:e.clientY,t:performance.now(),moved:false,px:prev&&prev.x,py:prev&&prev.y,wx,wy};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(!tap||e.pointerId!==tap.id)return;if(Math.hypot(e.clientX-tap.sx,e.clientY-tap.sy)>10)tap.moved=true;
 if(prev&&tap.moved){prev.x=Math.max(1,Math.min(W-3,tap.px+Math.round((e.clientX-tap.sx)/T)));prev.y=Math.max(3,Math.min(H-1,tap.py+Math.round((e.clientY-tap.sy)/T)))}});
const tapEnd=e=>{if(!tap||e.pointerId!==tap.id)return;const t=tap;tap=null;if(e.type==='pointercancel'||t.moved||performance.now()-t.t>600)return;
 const tx=Math.floor(t.wx),ty=Math.floor(t.wy);
 if(BIG[tool]&&(prev||!tapBuilding(t.wx,t.wy)&&occ[idx(tx,ty)]==null)){showPrev(tx,ty+2);return}
 if(tapBuilding(t.wx,t.wy))return;actAt(tx,ty)};
cv.addEventListener('pointerup',tapEnd);cv.addEventListener('pointercancel',tapEnd);
// ---- inside the house: canteen = shared food wishlist (island-level state.foodList, survives moving/removing the canteen); houses = empty room ----
const houseEl=document.getElementById('house'),listEl=document.getElementById('wishList'),doneEl=document.getElementById('doneList'),form=document.getElementById('wishForm');let houseA=null,editId=null;
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>{u=(u||'').trim();if(!u)return'';if(!/^https?:\/\//i.test(u))u='https://'+u;try{const x=new URL(u);return/^https?:$/.test(x.protocol)?x.href:''}catch(e){return''}};
const fmt=ts=>{const d=new Date(ts);return`${d.getMonth()+1}月${d.getDate()}日`};
function openBuilding(a){houseA=a;const cant=state.obj[a]==='canteen';state.foodList=state.foodList||[];
 document.getElementById('houseTitle').textContent=cant?'🍜 '+CANTEEN:'🏠 '+(state.names[a]||'我们的家');houseEl.classList.toggle('room',!cant);closeForm();if(cant)renderList();houseEl.classList.remove('hidden')}
function renderList(){const L=state.foodList||[];const todo=L.filter(i=>!i.done),done=L.filter(i=>i.done).sort((a,b)=>b.done-a.done);
 const card=i=>`<li data-id="${i.id}" class="${i.done?'done':''}"><button class="chk" data-a="toggle">${i.done?'✔':''}</button><div class="txt"><b>${esc(i.name)}</b>${i.note?`<p>${esc(i.note)}</p>`:''}${i.url?`<a href="${esc(i.url)}" target="_blank" rel="noopener">🔗 打开链接</a>`:''}<small>${i.done?'吃过了 · '+fmt(i.done):'添加于 '+fmt(i.added)}</small></div><button class="ic" data-a="edit">✏️</button><button class="ic" data-a="del">🗑️</button></li>`;
 listEl.innerHTML=todo.map(card).join('')||'<p class="empty">还没有想吃的，刷到好吃的就加进来吧～</p>';doneEl.innerHTML=done.map(card).join('');document.getElementById('doneHead').classList.toggle('hidden',!done.length)}
houseEl.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const id=b.closest('li').dataset.id,L=state.foodList,it=L.find(i=>i.id===id);if(!it)return;
 if(b.dataset.a==='toggle'){it.done=it.done?null:Date.now();if(it.done)toast('吃过了「'+it.name+'」😋')}
 else if(b.dataset.a==='del'){if(!confirm('删除「'+it.name+'」？'))return;L.splice(L.indexOf(it),1)}
 else if(b.dataset.a==='edit'){openForm(it);return}save();renderList()});
function openForm(it){editId=it?it.id:null;form.name.value=it?it.name:'';form.note.value=it?it.note||'':'';form.url.value=it?it.url||'':'';document.getElementById('formTitle').textContent=it?'修改':'想一起吃…';form.classList.remove('hidden');document.getElementById('addBtn').classList.add('hidden');setTimeout(()=>form.name.focus(),50)}
function closeForm(){form.classList.add('hidden');document.getElementById('addBtn').classList.remove('hidden');editId=null;document.activeElement&&document.activeElement.blur()}
document.getElementById('addBtn').onclick=()=>openForm(null);document.getElementById('formCancel').onclick=closeForm;
form.addEventListener('submit',e=>{e.preventDefault();const name=form.name.value.trim().slice(0,40);if(!name)return toast('写下想吃什么吧');const note=form.note.value.trim().slice(0,200),url=safeUrl(form.url.value);
 if(form.url.value.trim()&&!url)return toast('链接好像不对哦');const L=state.foodList;
 if(editId){Object.assign(L.find(i=>i.id===editId),{name,note,url})}else L.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,note,url,added:Date.now(),done:null});
 save();closeForm();renderList()});
document.getElementById('houseClose').onclick=()=>{closeForm();houseEl.classList.add('hidden');houseA=null};
// ---- UI ----
function icon(name){const c=document.createElement('canvas');c.width=c.height=60;const g=c.getContext('2d');g.scale(60,60);S[name](g);return c}
const tb=document.getElementById('toolbar'),seedsEl=document.getElementById('seeds');
TOOLS.forEach(([k,l,ic])=>{const b=document.createElement('button');b.className='tool'+(k===tool?' on':'');b.dataset.tool=k;b.append(icon(ic||k),l);
 b.onclick=()=>{tool=k;cancelPrev();[...tb.children].forEach(x=>x.classList.toggle('on',x===b));seedsEl.classList.toggle('hidden',k!=='seed');resize()};tb.append(b)});
Object.entries(CROPS).forEach(([k,c])=>{const b=document.createElement('button');b.textContent=c.name+'种子';b.dataset.seed=k;if(k===seed)b.className='on';b.onclick=()=>{seed=k;[...seedsEl.children].forEach(x=>x.classList.toggle('on',x===b))};seedsEl.append(b)});
function renderInv(){const v=state.inv;document.getElementById('inv').textContent=`🥕${v.carrot} 🍅${v.tomato} 🍓${v.strawberry} 🪵${v.wood||0}`}
const menu=document.getElementById('menu');document.getElementById('gear').onclick=()=>menu.classList.toggle('hidden');
menu.querySelectorAll('[data-char]').forEach(b=>{const c=b.querySelector('canvas'),g=c.getContext('2d');g.scale(c.width,c.height);S.puppy(g,0,0,false,b.dataset.char);b.onclick=()=>{setChar(b.dataset.char);toast('换成'+b.textContent+'啦')}});
document.getElementById('menuClose').onclick=()=>menu.classList.add('hidden');setChar(charKind);
addEventListener('resize',resize);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>document.hidden&&save());
resize();renderInv();tick();setInterval(tick,1000);requestAnimationFrame(loop);
window.Game={get state(){return state},get moving(){return moving},refresh(){rebuildOcc();renderInv();if(!houseEl.classList.contains('hidden')&&houseA!=null&&state.obj[houseA]==='canteen')renderList()},set state(s){state=s;save();renderInv()},act,actAt,front,toast,save,gateNear,get gateAng(){return gateAng},get preview(){return prev},get baby(){return baby},openSign,openBuilding,setChar,setTool:k=>tb.querySelector(`[data-tool=${k}]`).click()}; // hooks for sync/tests
