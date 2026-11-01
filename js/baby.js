// NPC baby pup 胖宝: wanders near the first house. Uses globals from game.js (state, blocked, ctx, T, W).
const BABY_SAY={
 walk:['开心的胖宝','兴奋的胖宝','胖宝在追蝴蝶','胖宝在散步','胖宝在巡逻小岛','胖宝闻到了香味','胖宝摇尾巴','胖宝在找宝藏','胖宝去探险啦','胖宝在追自己的尾巴','胖宝偷吃胡萝卜','胖宝踩到了小水坑'],
 idle:['胖宝在发呆','胖宝饿了','胖宝想爸爸了','胖宝想妈妈了','胖宝要抱抱','胖宝打了个哈欠','胖宝在看云','胖宝歪着头','胖宝在数星星','胖宝好奇地张望','胖宝想吃草莓','胖宝闻闻小花'],
 sit:['胖宝好舒服','胖宝累了','胖宝乖乖坐好','胖宝在晒太阳','胖宝在等爸爸妈妈','胖宝滚来滚去','胖宝挠挠耳朵','胖宝肚肚圆滚滚'],
 sleep:['胖宝睡着了','胖宝在做美梦','胖宝打呼噜','胖宝梦见了大骨头','胖宝梦见爸爸妈妈','嘘…胖宝在睡觉'],
 hop:['胖宝蹦蹦跳跳','胖宝超开心！','胖宝转圈圈','胖宝跳起来了'],
 carry:['放开我~','胖宝挣扎中','胖宝要下来','幸福的胖宝','胖宝蹬蹬腿','被抱住啦！','胖宝跑不掉了','胖宝在爸爸妈妈怀里'],
 tap:['最喜欢爸爸妈妈了！','胖宝爱你哦 ❤','抱抱～','嘿嘿，好痒','亲亲！','胖宝今天很乖哦','要一直在一起哦','爸爸妈妈辛苦啦']};
const pick=a=>a[Math.random()*a.length|0];
const baby={x:0,y:0,dir:0,mode:'idle',t:1,tx:0,ty:0,phase:0,bub:'',bubT:0,nextBub:3,hop:0,heart:0,init:false,carried:false,sprint:0,puffs:[]};
function babySprint(){const p=state.player;for(let k=0;k<24;k++){const a=Math.atan2(baby.y-p.y,baby.x-p.x)+(Math.random()-.5)*1.6,d=4+Math.random()*2,tx=baby.x+Math.cos(a)*d,ty=baby.y+Math.sin(a)*d;
  if(babyFree(tx,ty)){baby.mode='walk';baby.t=2.6;baby.tx=tx;baby.ty=ty;baby.sprint=2.2;say('胖宝狂奔');return true}}return false}
const grabBtn=document.getElementById('grab');
function setGrab(show,txt){if(grabBtn.classList.contains('hidden')===show)grabBtn.classList.toggle('hidden',!show);if(grabBtn.textContent!==txt)grabBtn.textContent=txt}
grabBtn.addEventListener('pointerdown',e=>{e.preventDefault();baby.carried?babyDrop():babyGrab()});
function babyGrab(){baby.carried=true;baby.mode='carry';baby.nextBub=1.5;say(pick(BABY_SAY.carry))}
function babyDrop(){const p=state.player,d=[[0,1],[0,-1],[-1,0],[1,0]][p.dir];const c=[d,[0,1],[1,0],[-1,0],[0,-1]];
 for(const[dx,dy]of c){const x=Math.floor(p.x)+dx+.5,y=Math.floor(p.y)+dy+.5;if(babyFree(x,y)){baby.x=x;baby.y=y;baby.carried=false;if(Math.random()<.5&&babySprint())return;babyMode('hop',1.2);say(pick(['胖宝自由啦～','胖宝落地啦','胖宝开心地蹦了蹦','胖宝站稳啦']));return}}toast('这里放不下胖宝')}
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
 if(baby.carried){baby.x=p.x;baby.y=p.y;baby.phase+=dt*40;setGrab(true,'放下胖宝');if(baby.nextBub<0){say(pick(BABY_SAY.carry));baby.nextBub=3+Math.random()*4}return}
 const dp=Math.hypot(p.x-baby.x,p.y-baby.y);setGrab(dp<1.5,'抓住胖宝');
 if(dp<.6&&baby.mode!=='walk'){babyMode('walk',4)}
 if(baby.mode==='walk'){const dx=baby.tx-baby.x,dy=baby.ty-baby.y,d=Math.hypot(dx,dy),sp=1.6*dt*(baby.sprint>0?2.7:1);if(baby.sprint>0&&Math.random()<dt*12)baby.puffs.push({x:baby.x,y:baby.y+.1,t:.5});
  if(d<.1||baby.t<0){const r=Math.random();babyMode(r<.45?'idle':r<.65?'sit':r<.8?'sleep':'hop',r<.65?2+Math.random()*4:r<.8?6+Math.random()*6:1.5)}
  else{const vx=dx/d*sp,vy=dy/d*sp;baby.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);let moved=false;
   if(babyFree(baby.x+vx,baby.y)){baby.x+=vx;moved=true}if(babyFree(baby.x,baby.y+vy)){baby.y+=vy;moved=true}if(!moved)babyMode('walk',3)}}
 else{if(baby.mode==='hop')baby.hop+=dt;if(baby.t<0)babyMode(Math.random()<.75?'walk':'hop',2+Math.random()*3)}
 if(baby.nextBub<0)say(pick(BABY_SAY[baby.mode]||BABY_SAY.idle))}
function babyTap(wx,wy){if(baby.carried)return false;if(Math.hypot(wx-baby.x,wy-(baby.y-.35))>.7)return false;babyMode('hop',1.2);baby.heart=1.6;say(pick(BABY_SAY.tap));return true}
function babyDraw(){const b=baby;if(b.carried)return drawCarried();for(const f of b.puffs){ctx.globalAlpha=f.t*1.6;ctx.beginPath();ctx.arc(f.x*T,f.y*T,(1-f.t)*T*.35+4,0,7);ctx.fillStyle='#f3e6cc';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#d8c39a';ctx.stroke()}ctx.globalAlpha=1;const sleeping=b.mode==='sleep',sit=b.mode==='sit'||sleeping;let jump=0;
 if(b.mode==='hop')jump=Math.abs(Math.sin(b.hop*7))*.35;
 const X=b.x*T,Y=(b.y-jump)*T,sz=T*1.05;
 ctx.save();ctx.translate(X,Y);if(sit)ctx.scale(1.08,.9);ctx.scale(1.15,1);ctx.translate(-sz/2,-sz*.94);ctx.scale(sz,sz);
 S.closedEyes=sleeping;S.puppy(ctx,sit?0:b.dir,b.phase,b.mode==='walk'||(!sit&&b.mode==='hop'),'baby');S.closedEyes=false;ctx.restore();
 const font=`900 ${T*.26}px "Yuanti SC","PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 // name label
 const name=babyName(),ny=Y-sz*1.0;ctx.font=font;const nw=ctx.measureText(name).width+14;
 ctx.beginPath();ctx.roundRect(X-nw/2,ny-11,nw,22,11);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f5a623';ctx.stroke();ctx.fillStyle='#d9822b';ctx.fillText(name,X,ny+1);
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
 ctx.fillStyle=charKind==='yellow'?'#ffe9b0':'#fff';ctx.strokeStyle='#1e1a18';ctx.lineWidth=2.5;[-1,1].forEach(s=>{ctx.beginPath();ctx.ellipse(X+s*T*.26,Y-T*.32,T*.09,T*.07,0,0,7);ctx.fill();ctx.stroke()});
 const ny=Y-sz*1.05;ctx.textAlign='center';ctx.textBaseline='middle';
 if(b.bubT>0){ctx.font=`800 ${T*.27}px "PingFang SC",sans-serif`;const tw=ctx.measureText(b.bub).width+20,by=ny-40;ctx.globalAlpha=Math.min(1,b.bubT*2);
  ctx.beginPath();ctx.roundRect(X-tw/2,by-15,tw,30,15);ctx.moveTo(X-6,by+15);ctx.lineTo(X,by+23);ctx.lineTo(X+6,by+15);ctx.fillStyle='#fff8e7';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#e0a96d';ctx.stroke();ctx.fillStyle='#7a4b1d';ctx.fillText(b.bub,X,by+1);ctx.globalAlpha=1}
 const name=babyName();ctx.font=`900 ${T*.26}px "Yuanti SC","PingFang SC",sans-serif`;const nw=ctx.measureText(name).width+14;ctx.beginPath();ctx.roundRect(X-nw/2,ny-11-T*.35,nw,22,11);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f5a623';ctx.stroke();ctx.fillStyle='#d9822b';ctx.fillText(name,X,ny+1-T*.35)}
