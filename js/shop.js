// v34: 神秘商店 (inside any house) — 胖宝 skins. Island-level shared state like the canteen list:
// state.skins={own:{id:ts}, cur:'id'|'dog', at:ts}. own merges per-key (union); cur is one shared value (both phones show the same 胖宝).
(()=>{
const PRICE=200,FOODS=[['carrot','胡萝卜'],['tomato','番茄'],['strawberry','草莓']];
const SKINS=[
 {id:'pink',name:'粉衣躺躺款',suit:'#f7cdd8',shade:'#e9a9bb',deco:'flower',decoC:'#f29bb2'},
 {id:'beige',name:'米色学步款',suit:'#f6ecd4',shade:'#dccba6',deco:'star',decoC:'#e3d2a8',feet:1},
 {id:'bib',name:'柿子围兜款',suit:'#fbf6ea',shade:'#e2d8c4',deco:'none',bib:1},
 {id:'stripe',name:'粉条纹款',suit:'#fbe3ea',shade:'#eab0c0',deco:'stripe',decoC:'#f2a9bd'}];
const SK=Object.fromEntries(SKINS.map(s=>[s.id,s]));
const SKIN_C='#f7d2ae',SKIN_S='#e7b48a',OLc='#6b3f25',HAIR='#5a3a24';
function E(c,x,y,rx,ry,f,st){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);if(f){c.fillStyle=f;c.fill()}if(st!==false){c.lineWidth=.03;c.strokeStyle=OLc;c.stroke()}}
// unit-box sprite, feet at ~.94 like S.puppy. dir: 0 front,1 back,2 left,3 right
S.babyHuman=(c,dir,phase,moving,id)=>{const k=SK[id]||SKINS[0],fz=!!S.fussy,tt=performance.now()/1000,side=fz?0:dir===2?-1:dir===3?1:0,back=dir===1&&!fz,b=moving&&!fz?Math.abs(Math.sin(phase))*.03:0,lg=fz?Math.sin(tt*17)*.07:moving?Math.sin(phase)*.05:0;
 c.save();c.lineJoin='round';c.lineCap='round';
 c.beginPath();c.ellipse(.5,.93,.27,.06,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill();
 // feet / legs
 const fc=k.feet?k.suit:SKIN_C;E(c,.37,.86+lg,.1,.07,k.suit);E(c,.63,.86-lg,.1,.07,k.suit);E(c,.33+side*.03,.9+lg,.07,.045,fc);E(c,.67+side*.03,.9-lg,.07,.045,fc);
 // body
 c.save();c.beginPath();c.ellipse(.5,.7-b,.25,.2,0,0,7);c.fillStyle=k.suit;c.fill();c.clip();
 if(k.deco==='stripe'){c.fillStyle=k.decoC;for(let y=.52;y<.92;y+=.07)c.fillRect(0,y-b,1,.03)}
 else if(k.deco==='flower'||k.deco==='star'){c.fillStyle=k.decoC;for(const[x,y]of[[.36,.62],[.6,.6],[.47,.75],[.68,.76],[.32,.8]]){c.beginPath();c.arc(x,y-b,.022,0,7);c.fill()}}
 c.fillStyle=k.shade;c.globalAlpha=.5;c.fillRect(0,.8-b,1,.2);c.globalAlpha=1;c.restore();
 c.beginPath();c.ellipse(.5,.7-b,.25,.2,0,0,7);c.lineWidth=.03;c.strokeStyle=OLc;c.stroke();
 if(!back&&!k.bib){c.fillStyle=k.shade;for(const y of[.62,.7,.78])if(!side){c.beginPath();c.arc(.5,y-b,.013,0,7);c.fill()}}
 if(k.bib&&!back){c.beginPath();c.ellipse(.5+side*.05,.6-b,.17,.11,0,0,Math.PI);c.lineTo(.33+side*.05,.6-b);c.fillStyle='#fffaf0';c.fill();c.lineWidth=.025;c.strokeStyle='#e08a3a';c.stroke();
  c.fillStyle='#ee8434';for(const x of[.42,.5,.58]){c.beginPath();c.arc(x+side*.05,.65-b,.022,0,7);c.fill()}}
 // arms + hands
 if(fz){for(const s of[-1,1]){const w=Math.sin(tt*14+s*1.7)*.06;c.save();c.translate(.5+s*.24,.62);c.rotate(s*(.8+w*4));E(c,0,-.08,.06,.1,k.suit);E(c,0,-.18,.05,.045,SKIN_C);c.restore()}}
 else{const aw=moving?Math.sin(phase+1)*.03:0;for(const s of[-1,1]){if(side&&s===-side)continue;E(c,.5+s*.24,.68-b+aw*s,.07,.09,k.suit);E(c,.5+s*.26,.76-b+aw*s,.05,.04,SKIN_C)}}
 // head
 const hx=.5+side*.02,hy=.36-b;
 if(!back)for(const s of[-1,1]){if(side&&s===side)continue;E(c,hx+s*.24,hy+.03,.05,.06,SKIN_C)}
 E(c,hx,hy,.235,.22,SKIN_C);
 // very short sparse hair: thin cap + a few strands
 c.save();c.beginPath();c.ellipse(hx,hy,.235,.22,0,0,7);c.clip();c.fillStyle=HAIR;c.globalAlpha=back?.75:.55;c.beginPath();c.ellipse(hx,hy-(back?.02:.17),.26,back?.24:.1,0,0,7);c.fill();c.restore();
 c.globalAlpha=1;c.strokeStyle=HAIR;c.lineWidth=.016;for(const[x,l]of[[-.08,.04],[-.03,.05],[.02,.045],[.07,.04]]){c.beginPath();c.moveTo(hx+x,hy-.2);c.lineTo(hx+x+.01,hy-.2+l);c.stroke()}
 c.beginPath();c.ellipse(hx,hy,.235,.22,0,0,7);c.lineWidth=.03;c.strokeStyle=OLc;c.stroke();
 if(!back){const fx=hx+side*.07;
  if(fz){c.strokeStyle='#2a1d16';c.lineWidth=.022;for(const s of[-1,1]){const ex=fx+s*.085,ey=hy+.03;c.beginPath();c.moveTo(ex-s*.03,ey-.022);c.lineTo(ex+s*.012,ey);c.lineTo(ex-s*.03,ey+.022);c.stroke()}
   c.strokeStyle=OLc;c.lineWidth=.014;for(const s of[-1,1]){c.beginPath();c.moveTo(fx+s*.05,hy-.04);c.lineTo(fx+s*.12,hy-.055);c.stroke()}
   c.fillStyle='#8ccff0';const td=(tt*1.5)%1;for(const s of[-1,1]){c.beginPath();c.ellipse(fx+s*.12,hy+.06+td*.06,.012,.018,0,0,7);c.fill()}}
  else if(S.closedEyes){c.strokeStyle='#2a1d16';c.lineWidth=.02;for(const s of[-1,1]){if(side&&s===-side&&0)continue;c.beginPath();c.arc(fx+s*.085,hy+.03,.03,.15*Math.PI,.85*Math.PI);c.stroke()}}
  else{c.fillStyle='#2a1d16';for(const s of[-1,1]){if(side&&s===-side){continue}c.beginPath();c.ellipse(fx+s*.085,hy+.03,.026,.02,0,0,7);c.fill()}if(side){c.beginPath();c.ellipse(fx-side*.06,hy+.03,.022,.018,0,0,7);c.fill()}
   c.fillStyle='#fff';for(const s of[-1,1]){if(side&&s===-side)continue;c.beginPath();c.arc(fx+s*.085+.008,hy+.022,.007,0,7);c.fill()}}
  c.fillStyle='rgba(240,120,120,.35)';for(const s of[-1,1]){c.beginPath();c.ellipse(fx+s*.14,hy+.09,.04,.025,0,0,7);c.fill()}
  if(fz){const mo=.025+Math.abs(Math.sin(tt*9))*.015;c.fillStyle='#b8454a';c.beginPath();c.ellipse(fx,hy+.12,.04,mo,0,0,7);c.fill();c.lineWidth=.015;c.strokeStyle=OLc;c.stroke()}
  else{c.fillStyle='#d97a6a';c.beginPath();c.ellipse(fx,hy+.11,.025,.015,0,0,7);c.fill()}
  c.fillStyle=SKIN_S;c.beginPath();c.ellipse(fx,hy+.065,.014,.01,0,0,7);c.fill()}
 c.restore()};
// ---- shared state helpers ----
const st=()=>{const s=Game.state;s.skins=s.skins||{own:{},cur:'dog'};s.skins.own=s.skins.own||{};return s.skins};
window.babySkin=()=>{const s=Game.state.skins;return s&&s.cur&&SK[s.cur]&&s.own&&s.own[s.cur]?s.cur:'dog'};
const foodTotal=()=>FOODS.reduce((n,[k])=>n+(Game.state.inv[k]||0),0);
function pay(n){const inv=Game.state.inv;while(n>0){const top=FOODS.map(([k])=>k).sort((a,b)=>(inv[b]||0)-(inv[a]||0))[0];if(!(inv[top]>0))return false;inv[top]--;n--}return true}
function buy(id){const s=st();if(s.own[id])return equip(id);const have=foodTotal();if(have<PRICE)return Game.toast(`食物不够哦，还差${PRICE-have}个（现在${have}个）`);
 const before=Object.fromEntries(FOODS.map(([k])=>[k,Game.state.inv[k]||0]));pay(PRICE);const used=FOODS.filter(([k])=>before[k]>(Game.state.inv[k]||0)).map(([k,n])=>n+'×'+(before[k]-(Game.state.inv[k]||0))).join('，');
 s.own[id]=Date.now();s.cur=id;s.at=Date.now();Game.save();Game.refresh();render();Game.toast(`兑换成功！胖宝换上了${SK[id].name}✨（用了${used}）`)}
function equip(id){const s=st();if(id!=='dog'&&!s.own[id])return;s.cur=id;s.at=Date.now();Game.save();render();Game.toast(id==='dog'?'胖宝换回小狗装啦🐶':'胖宝换上了'+SK[id].name+'✨')}
// ---- UI (inside house rooms) ----
const el=document.createElement('div');el.id='shop';document.querySelector('#house .emptyRoom').replaceWith(el);el.className='emptyRoom shop';
function thumb(id){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.scale(96,96);if(id==='dog')S.puppy(g,0,0,false,'baby');else S.babyHuman(g,0,0,false,id);return c}
function render(){const s=st(),cur=babySkin(),have=foodTotal();
 el.innerHTML=`<h3>🔮 神秘商店</h3><p class="sub">用 ${PRICE} 个任意食物兑换胖宝皮肤（现有 ${have} 个）· 两个人看到的胖宝一样哦</p><div class="skins"></div>`;
 const box=el.querySelector('.skins');
 for(const k of[{id:'dog',name:'小狗装（默认）'},...SKINS]){const own=k.id==='dog'||!!s.own[k.id],on=cur===k.id,d=document.createElement('div');d.className='skin'+(on?' on':'');d.dataset.id=k.id;d.appendChild(thumb(k.id));
  d.insertAdjacentHTML('beforeend',`<b>${k.name}</b><span>${on?'✅ 穿着呢':own?'已拥有':'🍽️ '+PRICE+'食物'}</span><button data-skin="${k.id}" ${on?'disabled':''}>${on?'使用中':own?'切换':'兑换'}</button>`);box.appendChild(d)}}
el.addEventListener('click',e=>{const b=e.target.closest('[data-skin]');if(!b)return;const id=b.dataset.skin,s=st();if(id==='dog'||s.own[id])equip(id);else buy(id)});
window.shopRender=render;
const hEl=document.getElementById('house');new MutationObserver(()=>{if(!hEl.classList.contains('hidden')&&hEl.classList.contains('room'))render()}).observe(hEl,{attributes:true,attributeFilter:['class']});
window.Shop={buy,equip,PRICE,SKINS,foodTotal,render};
})();
