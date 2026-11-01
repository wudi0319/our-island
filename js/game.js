const N=10,PAD=1,T=16; // 10x10 island + 1 tile sea border
const CROPS={carrot:{name:'胡萝卜',ms:60e3},tomato:{name:'番茄',ms:120e3},strawberry:{name:'草莓',ms:180e3}}; // per stage (testing speeds)
const DECOR={fence:'篱笆',flower:'花',tree:'树',house:'小屋'};
const TOOLS=[['hoe','锄地'],['seed','播种'],['can','浇水'],['basket','收获'],['fence','篱笆'],['flower','花'],['tree','树'],['house','小屋'],['erase','拆除']];
function newState(){const tiles=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const edge=x==0||y==0||x==N-1||y==N-1;tiles.push({g:edge?'sand':'grass',obj:null,crop:null})}
 tiles[44].obj='house';tiles[22].obj='tree';tiles[77].obj='tree';return{v:1,tiles,inv:{carrot:0,tomato:0,strawberry:0},updatedAt:Date.now()}}
let state=Store.load()||newState(),tool='hoe',seed='carrot',frame=0;
const save=()=>{state.updatedAt=Date.now();Store.save(state)};
Store.subscribe(s=>{if(s)state=s});

// --- crop growth: each stage needs watering, then grows after ms ---
function tick(){const now=Date.now();let ch=false;
 for(const t of state.tiles){const c=t.crop;if(c&&c.stage<2&&c.wateredAt&&now-c.wateredAt>=CROPS[c.type].ms){c.stage++;c.wateredAt=null;ch=true}}
 if(ch)save()}

// --- rendering ---
const cv=document.getElementById('map'),ctx=cv.getContext('2d');
const off=document.createElement('canvas');off.width=off.height=(N+PAD*2)*T;const oc=off.getContext('2d');
let scale=1;
function resize(){const m=document.querySelector('main');const sz=Math.min(m.clientWidth-8,m.clientHeight-8);scale=sz/off.width;
 const px=off.width*scale;cv.style.width=cv.style.height=px+'px';const d=devicePixelRatio||1;cv.width=cv.height=Math.round(px*d);ctx.imageSmoothingEnabled=false}
function draw(){frame++;const W=N+PAD*2;
 for(let y=0;y<W;y++)for(let x=0;x<W;x++){oc.save();oc.translate(x*T,y*T);
  const ix=x-PAD,iy=y-PAD;
  if(ix<0||iy<0||ix>=N||iy>=N)S.water(oc,(frame>>4)+x+y);
  else{const t=state.tiles[iy*N+ix];
   if(t.g==='soil')S.soil(oc,t.crop&&t.crop.wateredAt);else if(t.g==='sand')S.sand(oc);else S.grass(oc,(ix+iy)%2);
   if(t.crop)S.crop(oc,t.crop.type,t.crop.stage);
   if(t.crop&&t.crop.stage===2&&(frame>>4)%2){oc.fillStyle='#fff';oc.fillRect(13,1,2,2)}
   if(t.obj)S[t.obj](oc)}
  oc.restore()}
 ctx.drawImage(off,0,0,cv.width,cv.height);requestAnimationFrame(draw)}

// --- input ---
const toastEl=document.getElementById('toast');let tt;
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('show'),1500)}
function act(i){const t=state.tiles[i];
 switch(tool){
 case'hoe':if(t.obj)return toast('这里有东西哦');if(t.g==='soil')return;t.g='soil';break;
 case'seed':if(t.g!=='soil')return toast('先锄地再播种');if(t.crop)return toast('已经种上啦');t.crop={type:seed,stage:0,wateredAt:null,plantedAt:Date.now()};toast('种下了'+CROPS[seed].name+'，记得浇水');break;
 case'can':if(!t.crop)return toast('这里没有作物');if(t.crop.stage===2)return toast('已经成熟，可以收获了');if(t.crop.wateredAt)return toast('今天已经浇过了');t.crop.wateredAt=Date.now();toast('浇水啦 💧');break;
 case'basket':if(!t.crop||t.crop.stage<2)return toast('还没成熟呢');state.inv[t.crop.type]++;toast('收获 '+CROPS[t.crop.type].name+' +1');t.crop=null;break;
 case'erase':if(t.obj)t.obj=null;else if(t.crop)t.crop=null;else if(t.g==='soil')t.g='grass';else return;break;
 default:if(t.obj||t.crop||t.g==='soil')return toast('这里放不下');t.obj=tool}
 save();renderInv()}
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/r.width*(N+2))-PAD,y=Math.floor((e.clientY-r.top)/r.height*(N+2))-PAD;
 if(x>=0&&y>=0&&x<N&&y<N)act(y*N+x)});

// --- UI ---
function icon(name){const c=document.createElement('canvas');c.width=c.height=16;S[name](c.getContext('2d'));return c}
const tb=document.getElementById('toolbar'),seedsEl=document.getElementById('seeds');
TOOLS.forEach(([k,l])=>{const b=document.createElement('button');b.className='tool'+(k===tool?' on':'');b.append(icon(k),l);b.onclick=()=>{tool=k;[...tb.children].forEach(x=>x.classList.toggle('on',x===b));seedsEl.classList.toggle('hidden',k!=='seed');resize()};tb.append(b)});
Object.entries(CROPS).forEach(([k,c])=>{const b=document.createElement('button');b.textContent=c.name+'种子';if(k===seed)b.className='on';b.onclick=()=>{seed=k;[...seedsEl.children].forEach(x=>x.classList.toggle('on',x===b))};seedsEl.append(b)});
function renderInv(){document.getElementById('inv').textContent=`🥕${state.inv.carrot} 🍅${state.inv.tomato} 🍓${state.inv.strawberry}`}
addEventListener('resize',resize);resize();renderInv();tick();setInterval(tick,1000);draw();
window.Game={get state(){return state},set state(s){state=s;save();renderInv()}}; // hook for future sync
