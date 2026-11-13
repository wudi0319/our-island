// v47: 小岛赌场 — 幸运转盘. Bet food (20/50/100/200) or one fish from the shared 鱼篓; choose 赔食物 / 赔鱼 before spinning.
// Island-level shared state: state.casinoLog=[{id,by,at,stake,r,won}] (last 10, merged by id like other id-lists).
// Food goes through state.inv and fish through state.fishN (both additive counters in sync), so both phones' spins add up.
(()=>{
const FOODS=['carrot','tomato','strawberry'],BETS=[20,50,100,200],TV=[5,10,25,60,200],WARN=20,LOGN=10;
// outcome table (p in %). Order here = order on the wheel (clockwise from the top).
const SL=[
 {k:'lose',e:'💀',n:'血本无归',p:47.5,m:0,c:'#4b4a5e'},
 {k:'double',e:'🎉',n:'翻倍',p:14,m:2,c:'#ffb020'},
 {k:'half',e:'😅',n:'拿回一半',p:16,m:.5,c:'#6f9be0'},
 {k:'triple',e:'🔥',n:'三倍',p:7,m:3,c:'#ff5a4a'},
 {k:'even',e:'😐',n:'保本',p:13,m:1,c:'#4cbf6b'},
 {k:'five',e:'💎',n:'五倍',p:1.5,m:5,c:'#a05ce6'},
 {k:'fish',e:'🐟',n:'稀有鱼',p:1,m:1,c:'#2fc0e8'}];
const SK=Object.fromEntries(SL.map(s=>[s.k,s]));
// wheel slices: proportional to probability, tiny ones get a minimum so the emoji fits (display only)
const DW=SL.map(s=>Math.max(s.p,2.4)),DS=DW.reduce((a,b)=>a+b,0),ANG=[];{let a=0;for(const w of DW){const d=w/DS*Math.PI*2;ANG.push([a,a+d]);a+=d}}
const fs=()=>{const s=Game.state;s.fishN=s.fishN||{};s.fishDex=s.fishDex||{};if(!Array.isArray(s.casinoLog))s.casinoLog=[];return s};
const foodTotal=()=>FOODS.reduce((n,k)=>n+(Game.state.inv[k]||0),0);
function pay(n){const inv=Game.state.inv;while(n>0){const top=FOODS.slice().sort((a,b)=>(inv[b]||0)-(inv[a]||0))[0];if(!(inv[top]>0))return false;inv[top]--;n--}return true}
function addFood(n){const inv=Game.state.inv;for(let i=0;i<n;i++){const low=FOODS.slice().sort((a,b)=>(inv[a]||0)-(inv[b]||0))[0];inv[low]=(inv[low]||0)+1}}
const who=()=>typeof charKind!=='undefined'&&charKind==='white'?'小白':'鸡毛';
const Fh=()=>window.Fish,FM=()=>Object.fromEntries(Fh().FISH.map(f=>[f.id,f])),TN=t=>Fh().TIERS[t].k;
const pick=t=>{const pool=Fh().FISH.filter(f=>f.t===t);return pool[Math.random()*pool.length|0]};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ---- outcome ----
function roll(){if(C.force){const k=C.force;C.force=null;if(SK[k])return k}let r=Math.random()*100;for(const s of SL){if(r<s.p)return s.k;r-=s.p}return'lose'}
const bonusTier=v=>v>=60?'koi':v>=50?3:2; // stake value 20/25 -> 稀有, 50 -> 史诗, >=60 (food 100/200, 史诗/传说 fish) -> 50% 锦鲤 / 史诗
// value -> fish list (greedy 史诗60/稀有25/少见10/普通5; 传说 only from the 🐟 bonus), remainder as food
function fishFor(v){const out=[];let rem=v;for(const t of[3,2,1,0]){while(rem>=TV[t]){out.push(pick(t).id);rem-=TV[t]}}return{fish:out,food:rem}}
const stakeVal=b=>b.type==='food'?b.n:TV[FM()[b.id].t];
const stakeTxt=b=>b.type==='food'?`${b.n} 个食物`:`1 条${FM()[b.id].n}`;
// pure-ish calc (random fish picked here); returns what to give
function calc(bet,key,mode){const v=stakeVal(bet),s=SK[key],val=Math.floor(s.m*v);let give={food:0,fish:[]};
 if(val>0){if(mode==='fish'){const g=fishFor(val);give.fish=g.fish;give.food=g.food}else give.food=val}
 if(key==='fish'){const bt=bonusTier(v);let f;if(bt==='koi'){const koi=C.forceKoi!=null?C.forceKoi:Math.random()<.5;C.forceKoi=null;f=koi?'koi':pick(3).id}else f=pick(bt).id;give.bonus=f}
 give.val=val;return give}
function giveTxt(g){const parts=[];const cnt={};for(const id of g.fish){cnt[id]=(cnt[id]||0)+1}
 const byT={};for(const id in cnt){const t=FM()[id].t;(byT[t]=byT[t]||[]).push(FM()[id].n+(cnt[id]>1?'×'+cnt[id]:''))}
 for(const t of[4,3,2,1,0])if(byT[t]){const n=byT[t].reduce((a,x)=>a+(+(x.split('×')[1]||1)),0);parts.push(`${n} 条${TN(t)}鱼（${byT[t].join('、')}）`)}
 if(g.food)parts.push(`${g.food} 个食物`);return parts.join(' + ')}
// ---- UI ----
const el=document.createElement('div');el.id='casino';el.className='hidden';
el.innerHTML=`<div class="card"><b class="csnT">🎰 小岛赌场</b><p class="csnSub" id="cSub"></p>
<div class="wheelBox"><canvas id="cWheel" width="520" height="520"></canvas><div class="cPtr"></div></div>
<div id="cRes" class="cRes">选好押注和赔法，转一下试试手气！</div>
<div class="cLbl">押什么</div><div class="cTabs" id="cType"><button data-type="food">🥕 押食物</button><button data-type="fish">🐟 押鱼</button></div>
<div id="cBets"></div>
<div class="cLbl">赢了赔什么</div><div class="cTabs" id="cMode"><button data-mode="food">🍽️ 赔食物</button><button data-mode="fish">🐟 赔鱼</button></div>
<button id="cSpin">转！</button>
<div class="cLbl">📜 最近 ${LOGN} 次</div><ul id="cLog"></ul>
<p class="cOdds">💀47.5% · 😅16% · 😐13% · 🎉14% · 🔥7% · 💎1.5% · 🐟1%</p>
<button id="cClose">好的</button></div>
<div id="cWarn" class="hidden"><div class="card"><div class="big">🐶</div><b>留点给胖宝吃饭吧！🍚</b><p id="cWarnTxt"></p><div class="row"><button id="cWarnNo">算了</button><button id="cWarnOk">我知道，还是要转</button></div></div></div>`;
document.body.appendChild(el);
const $=id=>document.getElementById(id),cv=$('cWheel'),g=cv.getContext('2d');
let bet={type:'food',n:20},mode='food',busy=false,rot=0,pending=null,openedAt=0;
function drawWheel(){const S=520,cx=S/2,cy=S/2,R=238,t=performance.now()/1000;g.clearRect(0,0,S,S);
 // rim with bulbs
 g.beginPath();g.arc(cx,cy,R+18,0,7);g.fillStyle='#7a2a20';g.fill();g.lineWidth=6;g.strokeStyle='#3b2a20';g.stroke();
 for(let k=0;k<24;k++){const a=k/24*Math.PI*2,on=(k+Math.floor(t*(busy?10:3)))%2;g.beginPath();g.arc(cx+Math.cos(a)*(R+9),cy+Math.sin(a)*(R+9),6,0,7);g.fillStyle=on?'#fff7a0':'#ffb347';g.fill()}
 SL.forEach((s,i)=>{const[a0,a1]=ANG[i],b0=-Math.PI/2+rot+a0,b1=-Math.PI/2+rot+a1;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R,b0,b1);g.closePath();g.fillStyle=s.c;g.fill();g.lineWidth=3;g.strokeStyle='#fff8e7';g.stroke();
  const m=(b0+b1)/2,span=a1-a0;g.save();g.translate(cx,cy);g.rotate(m);g.textAlign='center';g.textBaseline='middle';
  const fz=Math.max(26,Math.min(46,span*R*.55));g.font=`${fz}px sans-serif`;g.save();g.translate(R*(span<.3?.86:.8),0);g.rotate(Math.PI/2);g.fillText(s.e,0,0);g.restore();
  if(span>.35){g.font='900 26px "PingFang SC",sans-serif';g.fillStyle='#fff';g.lineWidth=5;g.strokeStyle='rgba(0,0,0,.35)';g.save();g.translate(R*.52,0);g.rotate(Math.PI/2);g.strokeText(s.n,0,0);g.fillText(s.n,0,0);g.restore()}
  g.restore()});
 g.beginPath();g.arc(cx,cy,44,0,7);g.fillStyle='#ffd23f';g.fill();g.lineWidth=6;g.strokeStyle='#3b2a20';g.stroke();g.font='44px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🎰',cx,cy+3)}
function animLoop(){drawWheel();if(!el.classList.contains('hidden')||busy)requestAnimationFrame(animLoop);else looping=false}
let looping=false;const kick=()=>{if(!looping){looping=true;requestAnimationFrame(animLoop)}};
function render(){const s=fs(),have=foodTotal(),fishTot=Object.values(s.fishN).reduce((a,b)=>a+(b>0?b:0),0);
 $('cSub').textContent=`现有食物 ${have} 个 · 鱼篓 ${fishTot} 条 · 全岛共用`;
 $('cType').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.type===bet.type));
 $('cMode').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));
 const box=$('cBets');
 if(bet.type==='food')box.innerHTML='<div class="cAmt">'+BETS.map(n=>`<button data-n="${n}" class="${bet.n===n?'on':''}${have<n?' poor':''}">${n}<small>个食物</small></button>`).join('')+'</div>';
 else{const own=Fh().FISH.filter(f=>s.fishN[f.id]>0);
  box.innerHTML=own.length?'<div class="cFish">'+own.map(f=>`<button data-fish="${f.id}" class="${bet.id===f.id?'on':''}"><b>${f.n}</b><span style="color:${Fh().TIERS[f.t].c}">${TN(f.t)}·值${TV[f.t]}</span><em>×${s.fishN[f.id]}</em></button>`).join('')+'</div>':'<p class="empty">鱼篓还是空的，先去码头钓鱼吧 🎣</p>'}
 const ok=bet.type==='food'||(bet.id&&s.fishN[bet.id]>0);
 $('cSpin').textContent=busy?'转盘转动中…':ok?`转！（押 ${stakeTxt(bet)}）`:'先选一条鱼';$('cSpin').disabled=busy;
 const L=s.casinoLog.slice().sort((a,b)=>b.at-a.at).slice(0,LOGN);
 $('cLog').innerHTML=L.length?L.map(x=>{const d=new Date(x.at),sl=SK[x.r]||SK.lose;return`<li><span class="t">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</span><b>${esc(x.by)}</b> 押 ${esc(x.stake)} → ${sl.e}${sl.n}${x.won?'，得 '+esc(x.won):''}</li>`}).join(''):'<li class="empty">还没有人转过，来第一把吧！</li>'}
let sig='';function syncTick(){if(el.classList.contains('hidden'))return;const s=Game.state,k=JSON.stringify([s.inv,s.fishN,s.casinoLog]);if(k!==sig){sig=k;render()}}
setInterval(syncTick,800);
function open(){fs();if(bet.type==='fish'&&!(Game.state.fishN[bet.id]>0))bet={type:'fish',id:null};render();el.classList.remove('hidden');openedAt=performance.now();kick()}
function close(){$('cWarn').classList.add('hidden');el.classList.add('hidden')}
function setBet(b){if(busy)return;bet=b;render()}
function setMode(m){if(busy)return;mode=m==='fish'?'fish':'food';render()}
// press spin: checks, low-food warning, then go
function spin(confirmed){if(busy)return false;const s=fs();
 if(bet.type==='food'){const have=foodTotal();if(have<bet.n){Game.toast(`食物不够啦，现在只有 ${have} 个`);return false}}
 else{if(!bet.id){Game.toast('先选一条要押的鱼');return false}if(!(s.fishN[bet.id]>0)){Game.toast('鱼篓里没有这条鱼了');render();return false}}
 const left=foodTotal()-(bet.type==='food'?bet.n:0);
 if(!confirmed&&left<WARN){$('cWarnTxt').textContent=(bet.type==='food'?`押完这把，全岛只剩 ${Math.max(0,left)} 个食物了`:`全岛现在只剩 ${left} 个食物了`)+'，胖宝和小动物还要吃饭哦～';$('cWarn').classList.remove('hidden');return'warn'}
 // pay the stake
 const b=Object.assign({},bet);if(b.type==='food'){if(!pay(b.n))return false}else s.fishN[b.id]=s.fishN[b.id]-1;
 Game.save();Game.refresh();
 const key=roll(),give=calc(b,key,mode);busy=true;pending={b,key,give,mode};
 $('cRes').className='cRes';$('cRes').textContent='转啊转…🤞';render();const cd=el.querySelector('.card');if(cd.scrollTop>0)cd.scrollTo({top:0,behavior:'smooth'});
 // animate to land inside the chosen slice
 const i=SL.findIndex(x=>x.k===key),[a0,a1]=ANG[i],aim=a0+(a1-a0)*(.2+Math.random()*.6),TAU=Math.PI*2;
 const cur=((rot%TAU)+TAU)%TAU,target=rot+(TAU*5)+((TAU-aim-cur)%TAU+TAU)%TAU,from=rot,dur=C.dur,t0=performance.now();
 const anim=()=>{if(!pending)return;const k=dur?Math.min(1,(performance.now()-t0)/dur):1,e=1-Math.pow(1-k,3);rot=from+(target-from)*e;if(k<1)requestAnimationFrame(anim)};
 requestAnimationFrame(anim);kick();clearTimeout(C._tm);C._tm=setTimeout(()=>{rot=target;settle()},dur);
 return key}
function settle(){if(!pending)return;const{b,key,give,mode:md}=pending;pending=null;const s=fs(),sl=SK[key],news=[];
 const addFish=id=>{s.fishN[id]=(s.fishN[id]||0)+1;if(!s.fishDex[id]){s.fishDex[id]={by:who(),at:Date.now()};news.push(id)}};
 if(give.food)addFood(give.food);give.fish.forEach(addFish);if(give.bonus)addFish(give.bonus);
 const wonTxt=giveTxt(give),bonusF=give.bonus&&FM()[give.bonus];
 let msg;if(key==='lose')msg=`💀 血本无归…押的 ${stakeTxt(b)}没了`;
 else if(key==='fish')msg=`🐟 稀有鱼！押的 ${stakeTxt(b)}退回${wonTxt?'（'+wonTxt+'）':''}，还送了一条【${TN(bonusF.t)}】${bonusF.n}！`;
 else msg=`${sl.e} ${sl.n}！押 ${stakeTxt(b)}，${key==='half'||key==='even'?'拿回':'赢回'} ${wonTxt||'0'}`;
 if(news.length)msg+=' 🆕图鉴解锁：'+news.map(id=>FM()[id].n).join('、')+'！';
 const won=[wonTxt,bonusF?'送'+bonusF.n:''].filter(Boolean).join(' + ');
 s.casinoLog.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),by:who(),at:Date.now(),stake:stakeTxt(b),r:key,won});
 s.casinoLog=s.casinoLog.sort((a,b)=>b.at-a.at).slice(0,LOGN);
 busy=false;Game.save();Game.refresh();C.last={key,give,msg,mode:md};
 $('cRes').className='cRes '+(key==='lose'?'bad':key==='half'?'meh':'good');$('cRes').textContent=msg;render();
 if(el.classList.contains('hidden'))Game.toast(msg)}
addEventListener('pagehide',()=>{if(pending){clearTimeout(C._tm);settle()}});
el.addEventListener('click',e=>{const t=e.target;let b;
 if(b=t.closest('[data-type]'))setBet(b.dataset.type==='food'?{type:'food',n:bet.type==='food'?bet.n:20}:{type:'fish',id:bet.type==='fish'?bet.id:null});
 else if(b=t.closest('[data-n]'))setBet({type:'food',n:+b.dataset.n});
 else if(b=t.closest('[data-fish]'))setBet({type:'fish',id:b.dataset.fish});
 else if(b=t.closest('[data-mode]'))setMode(b.dataset.mode);
 else if(t.id==='cSpin')spin(false);
 else if(t.id==='cWarnNo'){$('cWarn').classList.add('hidden')}
 else if(t.id==='cWarnOk'){$('cWarn').classList.add('hidden');spin(true)}
 else if(t.id==='cClose'||t===el&&performance.now()-openedAt>400)close()});
const C=window.Casino={open,close,spin,setBet,setMode,roll,calc,fishFor,bonusTier,SLICES:SL,ANG,BETS,TV,WARN,force:null,forceKoi:null,dur:3000,last:null,
 get busy(){return busy},get bet(){return bet},get mode(){return mode},render,foodTotal,stakeVal};
})();
