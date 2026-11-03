// NPC baby pup 胖宝: wanders near the first house. Uses globals from game.js (state, blocked, ctx, T, W).
const BABY_SAY={
 walk:['开心的胖宝','兴奋的胖宝','胖宝在追蝴蝶','胖宝在散步','胖宝在巡逻小岛','胖宝闻到了香味','胖宝摇尾巴','胖宝在找宝藏','胖宝去探险啦','胖宝在追自己的尾巴','胖宝偷吃胡萝卜','胖宝踩到了小水坑'],
 idle:['胖宝在发呆','胖宝饿了','胖宝想爸爸了','胖宝想妈妈了','胖宝要抱抱','胖宝打了个哈欠','胖宝在看云','胖宝歪着头','胖宝在数星星','胖宝好奇地张望','胖宝想吃草莓','胖宝闻闻小花'],
 sit:['胖宝好舒服','胖宝累了','胖宝乖乖坐好','胖宝在晒太阳','胖宝在等爸爸妈妈','胖宝滚来滚去','胖宝挠挠耳朵','胖宝肚肚圆滚滚'],
 sleep:['胖宝睡着了','胖宝在做美梦','胖宝打呼噜','胖宝梦见了大骨头','胖宝梦见爸爸妈妈','嘘…胖宝在睡觉'],
 hop:['胖宝蹦蹦跳跳','胖宝超开心！','胖宝转圈圈','胖宝跳起来了'],
 carry:['放开我~','胖宝挣扎中','胖宝要下来','幸福的胖宝','胖宝蹬蹬腿','被抱住啦！','胖宝跑不掉了','胖宝在爸爸妈妈怀里'],
 dad:['爸爸的胡子扎扎的','爸爸举高高！','胖宝想爸爸好久了','爸爸什么时候回家呀','爸爸抱得好稳','胖宝抓爸爸头发','爸爸身上暖暖的','胖宝骑在爸爸肩上','爸爸讲故事给胖宝听','胖宝亲了爸爸一口','爸爸最厉害了','胖宝给爸爸摸摸头','爸爸的肚子软软的','爸爸不要走好不好','胖宝在爸爸怀里偷笑'],
 mom:['妈妈香香的','妈妈辛苦啦','胖宝要妈妈亲亲','妈妈最好了','胖宝在妈妈怀里睡着了','胖宝要妈妈摸摸头','妈妈的手软软的','胖宝蹭蹭妈妈','妈妈唱歌给胖宝听','胖宝最爱妈妈了','妈妈抱抱就不哭了','胖宝帮妈妈捶捶背','妈妈今天好漂亮','胖宝在妈妈怀里撒娇','妈妈陪胖宝玩'],
 hungry:['胖宝饿饿…','肚子咕噜咕噜','胖宝没力气了','胖宝想吃胡萝卜','胖宝闻到菜香了','胖宝肚肚瘪瘪的','给胖宝一点吃的嘛'],
 veryhungry:['胖宝好饿好饿…','肚子咕噜咕噜咕噜！','胖宝饿得走不动了','呜呜，要吃饭饭'],
 hdad:['爸爸，胖宝饿饿…','爸爸给胖宝种胡萝卜吧','爸爸的肚子也咕噜了吗','爸爸快去收菜菜'],
 hmom:['妈妈，胖宝饿饿…','妈妈给胖宝做好吃的','妈妈，肚子咕噜咕噜','妈妈喂胖宝吃菜菜'],
 fdad:['爸爸～胖宝饿了','爸爸抱抱，要吃的～','爸爸爸爸，看看胖宝嘛','胖宝跟着爸爸走','爸爸最好了，给胖宝吃菜菜','胖宝肚子咕噜咕噜，爸爸听到了吗'],
 fmom:['妈妈～胖宝饿了','妈妈抱抱，要吃的～','妈妈妈妈，胖宝乖乖的','胖宝跟着妈妈走','妈妈最好了，给胖宝吃菜菜','胖宝肚子咕噜咕噜，妈妈听到了吗'],
 full:['胖宝吃饱饱啦！','胖宝肚肚圆滚滚','好开心呀！','胖宝浑身是劲','胖宝想去探险！','吃饱了就要玩！'],
 tap:['最喜欢爸爸妈妈了！','胖宝爱你哦 ❤','抱抱～','嘿嘿，好痒','亲亲！','胖宝今天很乖哦','要一直在一起哦','爸爸妈妈辛苦啦']};
const pick=a=>a[Math.random()*a.length|0];
// ---- hunger: state.baby.fed[role]={full,at}; newest 'at' wins (each phone writes only its own key => no merge fights) ----
const FOOD={carrot:{name:'胡萝卜',ic:'🥕',amt:25},tomato:{name:'番茄',ic:'🍅',amt:30},strawberry:{name:'草莓',ic:'🍓',amt:35}};
const myRole=()=>window.Sync&&Sync.auth?Sync.auth.role:'me';
function feedRec(){babyName();const f=state.baby.fed||{};let b=null;for(const k in f){const v=f[k];if(v&&v.at&&(!b||v.at>b.at))b=v}return b}
function fullness(now=Date.now()){const b=feedRec();if(!b){state.baby.fed={[myRole()]:{full:80,at:now}};save();return 80}return Math.max(0,Math.min(100,b.full-(now-b.at)/36e5*7.5))}
const hunger=()=>{const f=fullness();return f>=80?0:f>=55?1:f>=10?2:3}; // 0 full,1 ok,2 hungry(~6h),3 very hungry(~12h)
function feedBaby(k){if(!(state.inv[k]>0))return toast('没有'+FOOD[k].name+'了');state.inv[k]--;const f=Math.min(100,fullness()+FOOD[k].amt);state.baby.fed=state.baby.fed||{};state.baby.fed[myRole()]={full:+f.toFixed(1),at:Date.now()};
 save();renderInv();baby.heart=1.6;say(f>=80?pick(['好好吃！胖宝吃饱饱啦','吧唧吧唧，好香！','谢谢爸爸妈妈～']):pick(['好好吃！还想要','吧唧吧唧','胖宝舔舔嘴巴']));toast('胖宝吃了'+FOOD[k].ic+FOOD[k].name);renderPick()}
function lineFor(kind){const h=hunger();if(h>=2){const dad=(localStorage.getItem('our-island-char')||'yellow')==='yellow';
  if((kind==='carry'||kind==='tap')&&Math.random()<.5)return pick(BABY_SAY[dad?'hdad':'hmom']);return pick(BABY_SAY[h===3?'veryhungry':'hungry'])}
 if(h===0&&Math.random()<.5)return pick(BABY_SAY.full);return null}
const pickEl=document.getElementById('foodPick'),feedBabyBtn=document.getElementById('feedBaby');
function renderPick(){const L=Object.keys(FOOD).filter(k=>state.inv[k]>0);
 document.getElementById('foodList').innerHTML=L.length?L.map(k=>`<button data-food="${k}">${FOOD[k].ic}<b>${FOOD[k].name}</b><small>×${state.inv[k]}</small></button>`).join(''):'<p class="empty">没有吃的了，快去种菜收获吧</p>';
 document.getElementById('foodFull').textContent='饱饱度 '+Math.round(fullness())+'%'}
feedBabyBtn.addEventListener('pointerdown',e=>{e.preventDefault();renderPick();pickEl.classList.remove('hidden')});
document.getElementById('foodList').addEventListener('click',e=>{const b=e.target.closest('[data-food]');if(b)feedBaby(b.dataset.food)});
document.getElementById('foodClose').onclick=()=>pickEl.classList.add('hidden');
const baby={x:0,y:0,dir:0,mode:'idle',t:1,tx:0,ty:0,phase:0,bub:'',bubT:0,nextBub:3,hop:0,heart:0,init:false,carried:false,sprint:0,puffs:[]};
function babySprint(){const p=state.player;for(let k=0;k<24;k++){const a=Math.atan2(baby.y-p.y,baby.x-p.x)+(Math.random()-.5)*1.6,d=4+Math.random()*2,tx=baby.x+Math.cos(a)*d,ty=baby.y+Math.sin(a)*d;
  if(babyFree(tx,ty)){baby.mode='walk';baby.t=2.6;baby.tx=tx;baby.ty=ty;baby.sprint=2.2;say('胖宝狂奔');return true}}return false}
const grabBtn=document.getElementById('grab');
function setGrab(show,txt){if(grabBtn.classList.contains('hidden')===show)grabBtn.classList.toggle('hidden',!show);if(grabBtn.textContent!==txt)grabBtn.textContent=txt}
grabBtn.addEventListener('pointerdown',e=>{e.preventDefault();baby.carried?babyDrop():babyGrab()});
function carryLine(){const h=lineFor('carry');if(h)return h;return Math.random()<.4?pick(BABY_SAY[(localStorage.getItem('our-island-char')||'yellow')==='yellow'?'dad':'mom']):pick(BABY_SAY.carry)}
function babyGrab(){feedBabyBtn.classList.remove('hidden');baby.carried=true;baby.mode='carry';baby.nextBub=1.5;say(carryLine())}
function babyDrop(){const p=state.player,d=[[0,1],[0,-1],[-1,0],[1,0]][p.dir];const c=[d,[0,1],[1,0],[-1,0],[0,-1]];
 for(const[dx,dy]of c){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5;if(babyFree(x,y)){baby.x=x;baby.y=y;baby.carried=false;feedBabyBtn.classList.add('hidden');pickEl.classList.add('hidden');if(Math.random()<.5&&babySprint())return;babyMode('hop',1.2);say(pick(['胖宝自由啦～','胖宝落地啦','胖宝开心地蹦了蹦','胖宝站稳啦']));return}}toast('这里放不下胖宝')}
function babyHome(){for(const k in state.obj)if(state.obj[k]==='house'||state.obj[k]==='canteen')return[k%W+.5,(k/W|0)+2.5];return[state.player.x,state.player.y+1]}
function babyFree(x,y){const r=.2;return![[x-r,y-.05],[x+r,y-.05],[x-r,y+.15],[x+r,y+.15]].some(([a,b])=>blocked(Math.floor(a),Math.floor(b)))}
function babyName(){state.baby=state.baby||{name:'胖宝'};return state.baby.name||'胖宝'}
function say(m){baby.bub=m.replace(/胖宝/g,babyName());baby.bubT=3.5;baby.nextBub=6+Math.random()*9}
function babyMode(m,t){baby.mode=m;baby.t=t;if(m==='walk'){const[hx,hy]=babyHome();for(let k=0;k<20;k++){const a=Math.random()*7,d=1+Math.random()*3;let tx=baby.x+Math.cos(a)*d,ty=baby.y+Math.sin(a)*d;
  if(Math.hypot(tx-hx,ty-hy)>8){tx=hx+(Math.random()-.5)*4;ty=hy+(Math.random()-.5)*3}if(babyFree(tx,ty)){baby.tx=tx;baby.ty=ty;return}}baby.mode='idle'}
 if(m==='hop')baby.hop=0}
function babyUpdate(dt){if(!baby.init){const[hx,hy]=babyHome();baby.x=hx+1;baby.y=hy;if(!babyFree(baby.x,baby.y)){baby.x=state.player.x;baby.y=state.player.y}baby.init=true;if(!state.baby){babyName();save()}}
 baby.sprint=Math.max(0,baby.sprint-dt);baby.puffs=baby.puffs.filter(f=>(f.t-=dt)>0);
 baby.phase+=dt*(baby.mode==='walk'?(baby.sprint>0?30:12):baby.mode==='hop'?14:3);baby.t-=dt;baby.bubT-=dt;baby.heart=Math.max(0,baby.heart-dt);baby.nextBub-=dt;
 const p=state.player;
 if(baby.carried){baby.x=p.x;baby.y=p.y;baby.phase+=dt*40;setGrab(true,'放下胖宝');if(baby.nextBub<0){say(carryLine());baby.nextBub=3+Math.random()*4}return}
 const dp=Math.hypot(p.x-baby.x,p.y-baby.y);setGrab(dp<1.5,'抓住胖宝');
 if(dp<.6&&baby.mode!=='walk'){babyMode('walk',4)}
 if(babyFollow(dt))return;
 if(baby.mode==='walk'){const dx=baby.tx-baby.x,dy=baby.ty-baby.y,d=Math.hypot(dx,dy),sp=1.6*dt*(baby.sprint>0?2.7:1)*[1.25,1,.6,.4][hunger()];if(baby.sprint>0&&Math.random()<dt*12)baby.puffs.push({x:baby.x,y:baby.y+.1,t:.5});
  if(d<.1||baby.t<0){const r=Math.random();const h=hunger();if(h>=2)babyMode(r<.35?'idle':r<.85?'sit':'sleep',h===3?5+Math.random()*6:3+Math.random()*4);else if(h===0&&r<.35)babyMode('hop',1.5);else babyMode(r<.45?'idle':r<.65?'sit':r<.8?'sleep':'hop',r<.65?2+Math.random()*4:r<.8?6+Math.random()*6:1.5)}
  else{const vx=dx/d*sp,vy=dy/d*sp;baby.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);let moved=false;
   if(babyFree(baby.x+vx,baby.y)){baby.x+=vx;moved=true}if(babyFree(baby.x,baby.y+vy)){baby.y+=vy;moved=true}if(!moved)babyMode('walk',3)}}
 else{if(baby.mode==='hop')baby.hop+=dt;if(baby.t<0){const h=hunger();babyMode(Math.random()<[.85,.75,.45,.25][h]?'walk':h>=2?'sit':'hop',2+Math.random()*3)}}
 if(baby.nextBub<0)say(lineFor(baby.mode)||pick(BABY_SAY[baby.mode]||BABY_SAY.idle))}
function babyTap(wx,wy){if(baby.carried)return false;if(Math.hypot(wx-baby.x,wy-(baby.y-.35))>.7)return false;babyMode('hop',1.2);baby.heart=1.6;say(lineFor('tap')||pick(BABY_SAY.tap));return true}
function babyDraw(){const b=baby;if(b.carried)return drawCarried();for(const f of b.puffs){ctx.globalAlpha=f.t*1.6;ctx.beginPath();ctx.arc(f.x*T,f.y*T,(1-f.t)*T*.35+4,0,7);ctx.fillStyle='#f3e6cc';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#d8c39a';ctx.stroke()}ctx.globalAlpha=1;const sleeping=b.mode==='sleep',sit=b.mode==='sit'||sleeping;let jump=0;
 if(b.mode==='hop')jump=Math.abs(Math.sin(b.hop*7))*.35;
 const X=b.x*T,Y=(b.y-jump)*T,sz=T*1.05;
 ctx.save();ctx.translate(X,Y);if(sit)ctx.scale(1.08,.9);ctx.scale(1.15,1);ctx.translate(-sz/2,-sz*.94);ctx.scale(sz,sz);
 S.closedEyes=sleeping;S.puppy(ctx,sit?0:b.dir,b.phase,b.mode==='walk'||(!sit&&b.mode==='hop'),'baby');S.closedEyes=false;ctx.restore();
 const font=`900 ${T*.26}px "Yuanti SC","PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 // name label
 const name=babyName(),ny=Y-sz*1.0;ctx.font=font;const nw=ctx.measureText(name).width+14;
 ctx.beginPath();ctx.roundRect(X-nw/2,ny-11,nw,22,11);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f5a623';ctx.stroke();ctx.fillStyle='#d9822b';ctx.fillText(name,X,ny+1);babyBar(X,ny+13);
 // zzz
 if(sleeping){ctx.fillStyle='#6b8fd6';ctx.font=`900 ${T*.24}px sans-serif`;for(let k=0;k<3;k++){const ph=(performance.now()/900+k/3)%1;ctx.globalAlpha=1-ph;ctx.fillText('z',X+sz*.35+ph*14,ny-6-ph*22);}ctx.globalAlpha=1}
 // heart
 if(b.heart>0){ctx.globalAlpha=Math.min(1,b.heart);ctx.font=`${T*.4}px sans-serif`;ctx.fillText('❤️',X+sz*.3,ny-18-(1.6-b.heart)*20);ctx.globalAlpha=1}
 // bubble
 if(b.bubT>0){ctx.font=`800 ${T*.27}px "PingFang SC",sans-serif`;const tw=ctx.measureText(b.bub).width+20,by=ny-34;ctx.globalAlpha=Math.min(1,b.bubT*2);
  ctx.beginPath();ctx.roundRect(X-tw/2,by-15,tw,30,15);ctx.moveTo(X-6,by+15);ctx.lineTo(X,by+23);ctx.lineTo(X+6,by+15);ctx.fillStyle='#fff8e7';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#e0a96d';ctx.stroke();
  ctx.fillStyle='#7a4b1d';ctx.fillText(b.bub,X,by+1);ctx.globalAlpha=1}}
function drawCarried(){const b=baby,p=state.player,X=p.x*T,Y=(p.y-.12)*T,sz=T*.82;
 ctx.save();ctx.translate(X+(p.dir===2?-.18:p.dir===3?.18:0)*T,Y);ctx.rotate(Math.sin(performance.now()/90)*.08);ctx.scale(1.15,1);ctx.translate(-sz/2,-sz*.94);ctx.scale(sz,sz);
 S.puppy(ctx,p.dir===1?1:0,b.phase,true,'baby');ctx.restore();
 // arms hugging
 ctx.fillStyle=charKind==='yellow'?'#f6dfb4':'#fff';ctx.strokeStyle='#1e1a18';ctx.lineWidth=2.5;[-1,1].forEach(s=>{ctx.beginPath();ctx.ellipse(X+s*T*.26,Y-T*.32,T*.09,T*.07,0,0,7);ctx.fill();ctx.stroke()});
 const ny=Y-sz*1.05;ctx.textAlign='center';ctx.textBaseline='middle';
 if(b.bubT>0){ctx.font=`800 ${T*.27}px "PingFang SC",sans-serif`;const tw=ctx.measureText(b.bub).width+20,by=ny-40;ctx.globalAlpha=Math.min(1,b.bubT*2);
  ctx.beginPath();ctx.roundRect(X-tw/2,by-15,tw,30,15);ctx.moveTo(X-6,by+15);ctx.lineTo(X,by+23);ctx.lineTo(X+6,by+15);ctx.fillStyle='#fff8e7';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#e0a96d';ctx.stroke();ctx.fillStyle='#7a4b1d';ctx.fillText(b.bub,X,by+1);ctx.globalAlpha=1}
 const name=babyName();ctx.font=`900 ${T*.26}px "Yuanti SC","PingFang SC",sans-serif`;const nw=ctx.measureText(name).width+14;ctx.beginPath();ctx.roundRect(X-nw/2,ny-11-T*.35,nw,22,11);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f5a623';ctx.stroke();ctx.fillStyle='#d9822b';ctx.fillText(name,X,ny+1-T*.35);babyBar(X,ny+13-T*.35)}
function babyBar(X,Y){const f=fullness()/100,h=hunger(),w=T*.7;ctx.beginPath();ctx.roundRect(X-w/2,Y,w,8,4);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.stroke();
 if(f>0){ctx.beginPath();ctx.roundRect(X-w/2+2,Y+2,(w-4)*f,4,2);ctx.fillStyle=h>=2?'#ff6b6b':h===1?'#ffc94a':'#6fd07a';ctx.fill()}
 if(h>=2){ctx.font=`${T*.3}px sans-serif`;ctx.textAlign='center';ctx.fillText(h===3?'💦':'💧',X+w/2+10,Y-8+Math.sin(performance.now()/300)*2)}else if(h===0&&(performance.now()/700|0)%3===0){ctx.font=`${T*.26}px sans-serif`;ctx.textAlign='center';ctx.fillText('✨',X+w/2+10,Y-6)}}

// hungry: trail the nearest parent (local or online dog) ~1.2 tiles behind and beg; stick with them until fed or far apart
function parents(){const L=[{k:'me',x:state.player.x,y:state.player.y,dad:(localStorage.getItem('our-island-char')||'yellow')==='yellow'}],o=window.Sync&&Sync.others;
 if(o)for(const k in o){const d=o[k];if(d.here&&d.x!=null&&Date.now()-d.t<20000)L.push({k,x:d.x,y:d.y,dad:k==='jimao'})}return L}
function babyFollow(dt){const h=hunger();if(h<2){baby.follow=null;return false}const P=parents();let t=P.find(q=>q.k===baby.follow);
 if(!t||Math.hypot(t.x-baby.x,t.y-baby.y)>10){t=null;let bd=10;for(const q of P){const d=Math.hypot(q.x-baby.x,q.y-baby.y);if(d<bd){bd=d;t=q}}baby.follow=t?t.k:null;if(t)say(pick(BABY_SAY[t.dad?'fdad':'fmom']))}
 if(!t)return false;const dx=t.x-baby.x,dy=t.y-baby.y,d=Math.hypot(dx,dy);
 if(d>1.6){baby.mode='walk';baby.t=1;const sp=1.6*dt*(h===3?.75:1.05),vx=dx/d*sp,vy=dy/d*sp;baby.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);
  if(babyFree(baby.x+vx,baby.y))baby.x+=vx;if(babyFree(baby.x,baby.y+vy))baby.y+=vy}
 else if(baby.mode==='walk'||baby.t<0)babyMode(h===3?'sit':Math.random()<.5?'sit':'idle',2+Math.random()*2);else if(baby.mode==='hop')baby.hop+=dt;
 if(baby.nextBub<0){say(Math.random()<.7?pick(BABY_SAY[t.dad?'fdad':'fmom']):pick(BABY_SAY[h===3?'veryhungry':'hungry']));baby.nextBub=5+Math.random()*4}return true}
window.BabyHunger={babyFollow,fullness,hunger,feedBaby,feedRec,lineFor};
