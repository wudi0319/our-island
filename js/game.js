// 我们的小岛 v2 — big sandbox island, player + joystick, cartoon art.
const W=64,H=64,T=48; // map size, tile px (CSS)
const WATER=0,SAND=1,GRASS=2,SOIL=3;
const CROPS={carrot:{name:'胡萝卜',ms:60e3},tomato:{name:'番茄',ms:120e3},strawberry:{name:'草莓',ms:180e3}}; // per stage, testing speeds
const TOOLS=[['hoe','锄地'],['seed','播种'],['can','浇水'],['basket','收获'],['axe','砍树'],['fence','篱笆','fenceIcon'],['flower','花'],['tree','树'],['house','小屋'],['erase','拆除']];
const SOLID={tree:1,house:1,fence:1,rock:1};

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
let charKind=localStorage.getItem('our-island-char')||'white';
function setChar(k){charKind=k;localStorage.setItem('our-island-char',k);document.querySelectorAll('#menu [data-char]').forEach(b=>b.classList.toggle('on',b.dataset.char===k))}
let state=loadState(),tool='hoe',seed='carrot',dirty=false,lastSave=0;
// ---- big houses: obj 'house' sits on the bottom-middle tile, footprint x-1..x+1, y-2..y ----
let occ={};const foot=a=>{const x=a%W,y=a/W|0,r=[];for(let dy=-2;dy<=0;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<W&&y+dy>=0)r.push((y+dy)*W+x+dx);return r};
function rebuildOcc(){occ={};for(const k in state.obj)if(state.obj[k]==='house')foot(+k).forEach(j=>occ[j]=+k)}
function migrate(){state.names=state.names||{};let ch=false;
 for(const k in state.obj)if(state.obj[k]==='house'){const a=+k,x=a%W,y=a/W|0;
  if(x<1||x>W-2||y<2){delete state.obj[k];ch=true;continue}
  for(const j of foot(a)){if(j!==a&&state.obj[j]){if(state.obj[j]==='house'){delete state.obj[a];break}delete state.obj[j];ch=true}
   if(state.crops[j]){delete state.crops[j];ch=true}if(state.ter[j]===0||state.ter[j]===3){state.ter[j]=2;ch=true}}
  if(state.obj[k]&&state.names[k]==null){state.names[k]='我们的家';ch=true}}
 rebuildOcc();const p=state.player,pi=Math.floor(p.y)*W+Math.floor(p.x);
 if(occ[pi]!=null){const a=occ[pi];p.x=a%W+.5;p.y=(a/W|0)+1.5;ch=true}
 if(ch)save()}
const save=()=>{state.updatedAt=Date.now();Store.save(state);dirty=false};
Store.subscribe(s=>{if(s&&s.v===2){state=s;rebuildOcc()}});migrate();

// ---- helpers ----
const idx=(x,y)=>y*W+x,inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const ter=(x,y)=>inb(x,y)?state.ter[idx(x,y)]:WATER;
const blocked=(x,y)=>{if(!inb(x,y))return true;const i=idx(x,y);return state.ter[i]===WATER||SOLID[state.obj[i]]||occ[i]!=null};
const isFence=(x,y)=>inb(x,y)&&state.obj[idx(x,y)]==='fence';

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
const keys={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.key]=1;if(e.key===' ')act()});addEventListener('keyup',e=>keys[e.key]=0);
document.getElementById('act').addEventListener('pointerdown',e=>{e.preventDefault();act()});

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
function act(){const[x,y]=front();if(!inb(x,y))return;const i=idx(x,y);
 if(occ[i]!=null){const a=occ[i];if(tool==='erase'){delete state.obj[a];delete state.names[a];rebuildOcc();save();return toast('小屋拆掉了')}return openSign(a)}
 const t=state.ter[i],o=state.obj[i],c=state.crops[i];
 const p=state.player,pi=idx(Math.floor(p.x),Math.floor(p.y));
 switch(tool){
 case'hoe':if(t===WATER)return toast('那是水哦');if(o)return toast('这里有东西哦');if(t===SOIL)return;state.ter[i]=SOIL;break;
 case'seed':if(t!==SOIL)return toast('先锄地再播种');if(c)return toast('已经种上啦');state.crops[i]={type:seed,stage:0,wateredAt:null,plantedAt:Date.now()};toast('种下了'+CROPS[seed].name+'，记得浇水');break;
 case'can':if(!c)return toast('前面没有作物');if(c.stage===2)return toast('成熟啦，快收获');if(c.wateredAt)return toast('已经浇过啦');c.wateredAt=Date.now();toast('浇水啦 💧');break;
 case'basket':if(!c||c.stage<2)return toast('还没成熟呢');state.inv[c.type]++;toast('收获 '+CROPS[c.type].name+' +1');delete state.crops[i];break;
 case'axe':if(o!=='tree')return toast('前面没有树');delete state.obj[i];state.inv.wood=(state.inv.wood||0)+3;toast('木头 +3');break;
 case'erase':if(o)delete state.obj[i];else if(c)delete state.crops[i];else if(t===SOIL)state.ter[i]=GRASS;else return;break;
 case'house':{if(x<1||x>W-2||y<2)return toast('这里放不下');const fp=foot(i);if(fp.length<9||fp.some(j=>state.ter[j]===WATER||state.obj[j]||state.crops[j]||state.ter[j]===SOIL||occ[j]!=null))return toast('需要3×3的空地哦');
  state.obj[i]='house';state.names[i]='我们的家';rebuildOcc();if(!canStand(p.x,p.y)){delete state.obj[i];delete state.names[i];rebuildOcc();return toast('离太近啦，退后一点')}break}
 default:if(i===pi)return;if(t===WATER)return toast('不能放在水里');if(o||c||t===SOIL)return toast('这里放不下');state.obj[i]=tool;if(SOLID[tool]&&!canStand(p.x,p.y)){delete state.obj[i];return toast('离太近啦，退后一点')}}
 save();renderInv()}

// ---- rendering ----
const cv=document.getElementById('map'),ctx=cv.getContext('2d');let vw=0,vh=0,dpr=1,frame=0;
function resize(){const m=cv.parentElement;dpr=devicePixelRatio||1;vw=m.clientWidth;vh=m.clientHeight;cv.width=vw*dpr;cv.height=vh*dpr}
const COL={[SAND]:'#ffe3a3',[GRASS]:'#8ddc6a',[SOIL]:'#b9773f'};
function drawTile(x,y,t){const X=x*T,Y=y*T;
 if(t===WATER){ctx.fillStyle='#5cc8ea';ctx.fillRect(X,Y,T+1,T+1);const o=(frame/30+x*1.7+y*1.3)%6;if(o<2){ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.roundRect(X+T*.2+o*4,Y+T*.4,T*.3,3,2);ctx.fill()}return}
 ctx.fillStyle=t===SOIL?COL[GRASS]:COL[t];ctx.fillRect(X,Y,T+1,T+1);
 if(t===GRASS&&(x*7+y*13)%5===0){ctx.strokeStyle='#6cc44f';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X+T*.3,Y+T*.6);ctx.lineTo(X+T*.27,Y+T*.45);ctx.moveTo(X+T*.38,Y+T*.6);ctx.lineTo(X+T*.42,Y+T*.44);ctx.stroke()}
 if(t===SAND&&(x*5+y*3)%7===0){ctx.fillStyle='#f5cf82';ctx.beginPath();ctx.arc(X+T*.6,Y+T*.5,2,0,7);ctx.fill()}
 if(t===SOIL){const c=state.crops[idx(x,y)];ctx.fillStyle=c&&c.wateredAt?'#7a4a26':COL[SOIL];ctx.strokeStyle='#5a3a22';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(X+3,Y+3,T-6,T-6,10);ctx.fill();ctx.stroke()}}
// soft shoreline: draw sand/grass edges as rounded blobs over water
function drawShore(x,y,t){if(t===WATER)return;const X=x*T,Y=y*T;
 for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(ter(x+dx,y+dy)===WATER){ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=3;ctx.beginPath();
  if(dx)ctx.moveTo(X+(dx>0?T:0),Y+4),ctx.lineTo(X+(dx>0?T:0),Y+T-4);else ctx.moveTo(X+4,Y+(dy>0?T:0)),ctx.lineTo(X+T-4,Y+(dy>0?T:0));ctx.stroke()}}
function sprite(fn,x,y,...a){ctx.save();ctx.translate(x*T,y*T);ctx.scale(T,T);fn(ctx,...a);ctx.restore()}
function draw(){frame++;const p=state.player;
 let cx=p.x*T-vw/2,cy=p.y*T-vh/2;cx=Math.max(0,Math.min(W*T-vw,cx));cy=Math.max(0,Math.min(H*T-vh,cy));
 ctx.setTransform(dpr,0,0,dpr,-Math.round(cx*dpr),-Math.round(cy*dpr));
 const x0=Math.max(0,cx/T|0),y0=Math.max(0,cy/T|0),x1=Math.min(W-1,(cx+vw)/T|0),y1=Math.min(H-1,(cy+vh)/T|0);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawTile(x,y,state.ter[idx(x,y)]);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawShore(x,y,state.ter[idx(x,y)]);
 const[fx,fy]=front();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.roundRect(fx*T+2,fy*T+2,T-4,T-4,10);ctx.stroke();ctx.setLineDash([]);
 // objects + player sorted by row
 const py=Math.floor(p.y);
 for(let y=Math.max(0,y0-1);y<=Math.min(H-1,y1+1);y++){
  for(let x=Math.max(0,x0-1);x<=Math.min(W-1,x1+1);x++){const i=idx(x,y),c=state.crops[i],o=state.obj[i];
   if(c){sprite(S.crop,x,y,c.type,c.stage);if(c.stage===2&&(frame>>4)%2)sprite((g)=>circ(g,.85,.15,.07,'#fff6a0'),x,y)}
   if(o==='fence')sprite(S.fence,x,y,isFence(x,y-1),isFence(x+1,y),isFence(x,y+1),isFence(x-1,y));
   else if(o==='house'){ctx.save();ctx.translate((x-1.6)*T,(y-2.75)*T);ctx.scale(T*3.2,T*3.2);S.house(ctx);ctx.restore();drawSign(x,y,state.names[i]||'我们的家')}
   else if(o==='tree'){ctx.save();ctx.translate((x-.15)*T,(y-.6)*T);ctx.scale(T*1.3,T*1.6);S.tree(ctx);ctx.restore()}
   else if(o)sprite(S[o],x,y)}
  if(y===py){ctx.save();ctx.translate((p.x-.7)*T,(p.y-1.2)*T);ctx.scale(T*1.4,T*1.4);S.puppy(ctx,p.dir,phase,moving,charKind);ctx.restore()}}
 }
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();if(dirty&&now-lastSave>2000){lastSave=now;save()}requestAnimationFrame(loop)}

function drawSign(x,y,name){const w=Math.max(1.2,Math.min(2.6,.32*Array.from(name).length+.4))*T,h=.48*T,sx=(x+1.35)*T-w/2,sy=(y+.3)*T;
 ctx.fillStyle='#8a5a32';ctx.fillRect(sx+w*.2-3,sy+h-2,6,T*.35);ctx.fillRect(sx+w*.8-3,sy+h-2,6,T*.35);
 ctx.beginPath();ctx.roundRect(sx,sy,w,h,10);ctx.fillStyle='#fff3d6';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#5a3a22';ctx.stroke();
 ctx.fillStyle='#7a4b1d';ctx.font=`900 ${T*.3}px "Yuanti SC","PingFang SC","Hiragino Maru Gothic ProN",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,sx+w/2,sy+h/2+1)}
const dlg=document.getElementById('signDlg'),signIn=document.getElementById('signIn');let signA=null;
function openSign(a){signA=a;signIn.value=state.names[a]||'';dlg.classList.remove('hidden');setTimeout(()=>signIn.focus(),50)}
function closeSign(ok){if(ok&&signA!=null){const v=Array.from(signIn.value.trim()).slice(0,12).join('')||'我们的家';state.names[signA]=v;save();toast('门牌改成「'+v+'」')}signIn.blur();dlg.classList.add('hidden');signA=null}
document.getElementById('signOk').onclick=()=>closeSign(true);document.getElementById('signCancel').onclick=()=>closeSign(false);
signIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)closeSign(true)});
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),p=state.player;let cx=p.x*T-vw/2,cy=p.y*T-vh/2;cx=Math.max(0,Math.min(W*T-vw,cx));cy=Math.max(0,Math.min(H*T-vh,cy));
 const wx=(e.clientX-r.left+cx)/T,wy=(e.clientY-r.top+cy)/T;for(const k in state.obj)if(state.obj[k]==='house'){const ax=k%W+1.35,ay=(k/W|0)+.54;if(Math.abs(wx-ax)<1.3&&Math.abs(wy-ay)<.4&&Math.hypot(p.x-ax,p.y-ay)<4)return openSign(+k)}});
// ---- UI ----
function icon(name){const c=document.createElement('canvas');c.width=c.height=60;const g=c.getContext('2d');g.scale(60,60);S[name](g);return c}
const tb=document.getElementById('toolbar'),seedsEl=document.getElementById('seeds');
TOOLS.forEach(([k,l,ic])=>{const b=document.createElement('button');b.className='tool'+(k===tool?' on':'');b.dataset.tool=k;b.append(icon(ic||k),l);
 b.onclick=()=>{tool=k;[...tb.children].forEach(x=>x.classList.toggle('on',x===b));seedsEl.classList.toggle('hidden',k!=='seed');resize()};tb.append(b)});
Object.entries(CROPS).forEach(([k,c])=>{const b=document.createElement('button');b.textContent=c.name+'种子';b.dataset.seed=k;if(k===seed)b.className='on';b.onclick=()=>{seed=k;[...seedsEl.children].forEach(x=>x.classList.toggle('on',x===b))};seedsEl.append(b)});
function renderInv(){const v=state.inv;document.getElementById('inv').textContent=`🥕${v.carrot} 🍅${v.tomato} 🍓${v.strawberry} 🪵${v.wood||0}`}
const menu=document.getElementById('menu');document.getElementById('gear').onclick=()=>menu.classList.toggle('hidden');
menu.querySelectorAll('[data-char]').forEach(b=>{const c=b.querySelector('canvas'),g=c.getContext('2d');g.scale(c.width,c.height);S.puppy(g,0,0,false,b.dataset.char);b.onclick=()=>{setChar(b.dataset.char);toast('换成'+b.textContent+'啦')}});
document.getElementById('menuClose').onclick=()=>menu.classList.add('hidden');setChar(charKind);
addEventListener('resize',resize);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>document.hidden&&save());
resize();renderInv();tick();setInterval(tick,1000);requestAnimationFrame(loop);
window.Game={get state(){return state},set state(s){state=s;save();renderInv()},act,front,openSign,setChar,setTool:k=>tb.querySelector(`[data-tool=${k}]`).click()}; // hooks for sync/tests
