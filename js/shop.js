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
// v36: full animated sprite sets per skin (img/baby/<id>-<frame>.png), generated from the approved sheets.
const FR=['m0','m1','m2','m3','idle0','idle1','laugh0','laugh1','sleep0','sleep1','cry0','cry1','torso','arm','leg','eat'],IMG={};
for(const k of SKINS){IMG[k.id]={};for(const f of FR){const i=new Image();i.src=`img/baby/${k.id}-${f}.png?v=36`;IMG[k.id][f]=i}}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
function blit(c,im,u,ax,ay,px,py){c.drawImage(im,-px*im.naturalWidth*u+ax,-py*im.naturalHeight*u+ay,im.naturalWidth*u,im.naturalHeight*u)}
// held: front-facing armless crying torso + 4 separate limbs on irregular circular paths, body wobble
function struggle(c,set,u,t){const T=set.torso,A=set.arm,L=set.leg;if(!ok(T)||!ok(A)||!ok(L))return false;
 const tw=T.naturalWidth*u,th=T.naturalHeight*u,bot=.9+Math.sin(t*13)*.02,cx=.5;
 const ka=.42*th/(A.naturalHeight*u),kl=.46*th/(L.naturalHeight*u);
 const limb=(im,k,sx,sy,side,base,w,ph,amp)=>{c.save();c.translate(sx+side*.035*Math.cos(t*w*1.3+ph),sy+.03*Math.sin(t*w*1.3+ph));if(side>0)c.scale(-1,1);
  c.rotate(base+amp*Math.sin(t*w+ph)+amp*.5*Math.sin(t*w*2.3+ph*1.7));c.scale(k,k);blit(c,im,u,0,0,.72,.12);c.restore()};
 c.save();c.translate(cx,bot);c.rotate(Math.sin(t*7.3)*.09+Math.sin(t*15.1)*.03);c.translate(-cx,-bot);
 limb(A,ka,cx-tw*.4,bot-th*.38,-1,.5,9.1,0,.9);limb(A,ka,cx+tw*.4,bot-th*.38,1,.5,11.7,2.1,.9);
 c.save();c.translate(cx,bot);c.scale(1+Math.sin(t*17)*.02,1-Math.sin(t*17)*.02);blit(c,T,u,0,0,.5,1);c.restore();
 limb(L,kl,cx-tw*.2,bot-th*.08,-1,.2,7.3,1,.75);limb(L,kl,cx+tw*.2,bot-th*.08,1,.2,13.2,3.3,.75);
 c.restore();return true}
// unit-box draw, feet at ~.96. Flags: S.fussy (held), S.closedEyes (sleep), S.happy (laugh), S.eating, S.cry
S.babyHuman=(c,dir,phase,moving,id)=>{const set=IMG[id]||IMG.pink,t=performance.now()/1000;if(!ok(set.idle0))return;const u=1.6/set.idle0.naturalHeight;
 if(S.fussy&&ok(set.torso)&&struggle(c,set,.95/set.torso.naturalHeight,t))return;
 let f,flip=false,br=0;
 if(S.fussy||S.cry)f=t%1<.5?'cry0':'cry1';
 else if(S.closedEyes){f=t%2.4<1.2?'sleep0':'sleep1';br=.02*Math.sin(t*2.6)}
 else if(S.eating)f='eat';
 else if(S.happy)f=t%.5<.25?'laugh0':'laugh1';
 else if(moving){f='m'+(Math.floor(phase*.55)%4);flip=dir===2}
 else{f=t%3.2<.16?'idle1':'idle0';br=.015*Math.sin(t*2.2)}
 let im=set[f];if(!ok(im))im=set.idle0;
 c.save();c.translate(.5,.96);if(S.fussy)c.rotate(Math.sin(t*22)*.07);if(flip)c.scale(-1,1);c.scale(1-br*.5,1+br);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';blit(c,im,u,0,0,.5,1);c.restore()};
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
function thumb(id){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.scale(96,96);if(id==='dog')S.puppy(g,0,0,false,'baby');else{const i=document.createElement('img');i.src=`img/baby/${id}-laugh0.png?v=36`;i.className='thumb';return i}return c}
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
