// Online mode: password login -> role, shared island in Supabase (RPC only), live dogs via Realtime.
(()=>{
const SB_URL='https://api.pangzaixiaodao.party',SB_KEY='sb_publishable_DqsCbDSeAxe26HP8XWFPIw_nCulbx0z';
const K_AUTH='our-island-auth',K_BAK='our-island-backup',K_BASE='our-island-cloud-base';
const ROLES={jimao:{name:'鸡毛',char:'yellow'},xiaobai:{name:'小白',char:'white'}};
const GAME=['js/sprites.js','js/game.js','js/baby.js','js/info.js','js/animals.js','js/intruders.js','js/shop.js','js/fishing.js'],VER='46';
const L=LocalStore,J=JSON.stringify,$=id=>document.getElementById(id);
let sb=null;try{sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}catch(e){console.warn('supabase lib',e)}
let auth=null;try{auth=JSON.parse(localStorage.getItem(K_AUTH))}catch(e){}
let base=null;try{base=JSON.parse(localStorage.getItem(K_BASE))}catch(e){} // {version,data}: last cloud copy we know
if(base&&auth&&base.role&&base.role!==auth.role)base=null;
let version=base?base.version:0,lastSig=base?J(base.data):'',online=false,started=false,muted=false,applyCb=null,timer=null,pushing=false,again=false,chan=null;
const others={};

// ---- Store used by game.js ----
const strip=s=>{const o=Object.assign({},s);delete o.player;delete o.updatedAt;return o};
const clone=x=>x===undefined?undefined:JSON.parse(J(x));
window.Store={key:L.key,clearOld(){},load:()=>L.load(),
 save(s){L.save(s);if(!muted&&auth)schedule(1200)},subscribe(cb){applyCb=cb}};
// base is deep-copied: it must never alias live game state
function setBase(data,v){data=clone(data);base={version:v,data,role:auth&&auth.role};try{localStorage.setItem(K_BASE,J(base))}catch(e){}}
function backup(){const raw=localStorage.getItem(L.key);if(raw&&!localStorage.getItem(K_BAK))localStorage.setItem(K_BAK,raw)}

// ---- 3-way merge (base, local, remote); conflicts: local wins ----
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
function m3(b,l,r,add){if(J(l)===J(b))return clone(r);if(J(r)===J(b))return clone(l);
 if(add&&typeof l==='number'&&typeof r==='number')return Math.max(0,+(l+r-(typeof b==='number'?b:0)).toFixed(2)); // counters: both phones' changes add up
 if(J(l)===J(r)&&!add&&!(isObj(l)&&(l.inv&&J(l.inv)!==J(isObj(b)?b.inv:undefined)||l.fishN&&J(l.fishN)!==J(isObj(b)?b.fishN:undefined))))return clone(l); // same edit on both phones -> keep once (except counters, which add up)
 if(Array.isArray(l)&&Array.isArray(r)){
  if([...l,...r].every(x=>isObj(x)&&x.id!=null)){const B={},Lm={},R={};(Array.isArray(b)?b:[]).forEach(x=>x&&(B[x.id]=x));l.forEach(x=>Lm[x.id]=x);r.forEach(x=>R[x.id]=x);
   const ids=[...r.map(x=>x.id),...l.map(x=>x.id).filter(i=>!(i in R))],out=[];for(const id of ids){const v=m3(B[id],Lm[id],R[id]);if(v!==undefined)out.push(v)}return out}
  if(Array.isArray(b)&&b.length===l.length&&l.length===r.length)return l.map((x,i)=>m3(b[i],x,r[i]));return clone(l)}
 if(isObj(l)&&isObj(r)){const B=isObj(b)?b:{},o={};for(const k of new Set([...Object.keys(r),...Object.keys(l)])){const v=m3(B[k],l[k],r[k],add||k==='inv'||k==='fishN');if(v!==undefined)o[k]=v}return o}
 return clone(l)}
window.IslandMerge=m3;

// ---- cloud ----
async function rpc(fn,args){if(!sb)throw new Error('no-lib');const{data,error}=await sb.rpc(fn,args);if(error){const e=new Error(error.message);e.code=error.code;throw e}return data}
const badPw=e=>e&&(e.code==='28P01'||/bad password/.test(e.message));
function schedule(ms){clearTimeout(timer);timer=setTimeout(push,ms)}
// "core" signature ignores things that change every frame (intruder/animal positions, fear decay, fence chip damage) — those travel by realtime broadcast instead
function coreSig(d){const c=Object.assign({},d);
 if(c.intr){c.intr={};for(const k in d.intr){const e=Object.assign({},d.intr[k]);delete e.x;delete e.y;delete e.dir;delete e.fdec;delete e.st;delete e.ph2;delete e.atk;c.intr[k]=e}}
 if(c.animals){c.animals={};for(const k in d.animals){const a=Object.assign({},d.animals[k]);delete a.x;delete a.y;c.animals[k]=a}}
 if(c.fhp){c.fhp={};for(const k in d.fhp){const f=d.fhp[k];c.fhp[k]={r:f.r,d:Object.fromEntries(Object.entries(f.d||{}).map(([a,v])=>[a,Math.round(v/20)]))}}}
 return J(c)}
let lastCore='',lastPushT=0;const VOLATILE_MS=15000;
async function push(){if(!started||!auth||!window.Game)return;if(pushing){again=true;return}
 const data=strip(Game.state),sig=J(data);if(sig===lastSig)return;
 const cs=coreSig(data),wait=lastPushT+VOLATILE_MS-Date.now();if(cs===lastCore&&wait>0&&!document.hidden){clearTimeout(timer);timer=setTimeout(push,wait);return}
 if(version===0&&auth.role!=='xiaobai')return; // never seed the island from 鸡毛's phone
 pushing=true;let retry=0;
 try{const r=await rpc('save_island',{pw:auth.pw,data,base_version:version});
  if(r&&r.ok){version=r.version;lastSig=sig;lastCore=cs;lastPushT=Date.now();setBase(data,version);net(true);bc('island-updated',sig.length<60000?{v:version,data}:{v:version})}
  else{await pull();retry=300}}
 catch(e){net(false);retry=8000;if(badPw(e))return logout('密码好像改了，请重新登录')}
 finally{pushing=false}
 if(again||retry){again=false;schedule(retry||300)}}
async function pull(){if(!started||!auth)return;const r=await rpc('get_island',{pw:auth.pw});net(true);lastPullT=Date.now();applyRemote(r)}
let lastPullT=0;
function applyRemote(r){
 if(!r||!r.data||r.version<=version)return;
 const cur=Game.state,loc=strip(cur),merged=base?m3(base.data,loc,r.data):clone(r.data);
 version=r.version;setBase(r.data,r.version);lastSig=J(r.data);
 const ns=Object.assign(merged,{player:cur.player,updatedAt:Date.now()});
 muted=true;try{L.save(ns);applyCb&&applyCb(ns);Game.refresh&&Game.refresh()}finally{muted=false}
 if(J(strip(ns))!==lastSig)schedule(500)}
function onUpdated(p){if(!p||p.v==null)return pullSafe();if(p.v<=version)return;if(p.data&&!pushing)applyRemote({version:p.v,data:p.data});else pullSafe()}
const pullSafe=()=>pull().catch(e=>{net(false);if(badPw(e))logout('密码好像改了，请重新登录')});

// ---- realtime: presence + positions + island-updated ----
function bc(event,payload){try{chan&&chan.send({type:'broadcast',event,payload})}catch(e){}}
let rtOk=false,rtRetry=0,rtT=null;const sim={a:{},i:{},t:0};window.SimIn=sim;
function rtDrop(){rtOk=false;try{chan&&sb.removeChannel(chan)}catch(e){}chan=null;clearTimeout(rtT);rtT=setTimeout(connectRT,Math.min(30000,1000*2**rtRetry++))}
function me(){return{role:auth.role,at:Date.now(),hidden:!!document.hidden}}
function connectRT(){if(!sb||chan||!auth)return;try{
 chan=sb.channel('our-island-main',{config:{broadcast:{self:false},presence:{key:auth.role}}});
 chan.on('broadcast',{event:'pos'},({payload:p})=>{if(!p||p.role===auth.role||!ROLES[p.role])return;const o=others[p.role]||(others[p.role]={x:p.x,y:p.y});const n=Date.now(),dtp=(n-(o.t||n))/1000;if(o.tx!=null&&dtp>0&&dtp<1){o.vx=(p.x-o.tx)/dtp;o.vy=(p.y-o.ty)/dtp}else o.vx=o.vy=0;if(!p.mv)o.vx=o.vy=0;Object.assign(o,{tx:p.x,ty:p.y,dir:p.dir,mv:p.mv,t:n})})
  .on('broadcast',{event:'island-updated'},({payload})=>onUpdated(payload))
  .on('broadcast',{event:'sim'},({payload:p})=>{if(!p)return;const t=performance.now();for(const k in p.a||{})sim.a[k]={v:p.a[k],t};for(const k in p.i||{})sim.i[k]={v:p.i[k],t};sim.t=t})
  .on('broadcast',{event:'drive'},({payload:p})=>{if(p&&window.Animals&&Animals.isHost())Animals.applyDrive(p)})
  .on('presence',{event:'sync'},()=>{const st=chan.presenceState();for(const k of Object.keys(ROLES))if(k!==auth.role){const o=others[k]||(others[k]={}),was=o.here&&!o.hidden;if(st[k]){o.here=true;o.hidden=st[k].some(m=>m.hidden)&&!st[k].some(m=>!m.hidden)}else o.here=false;if(was!==(o.here&&!o.hidden))schedule(200)}renderNet()})
  .subscribe(s=>{if(s==='SUBSCRIBED'){rtOk=true;rtRetry=0;chan.track(me());sendPos(true);pullSafe()}else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED')rtDrop()});
 }catch(e){console.warn('realtime',e)}}
let lastPos='',lastPosT=0;
function sendPos(force){if(!chan||!window.Game)return;const p=Game.state.player,mv=!!Game.moving,k=[p.x.toFixed(2),p.y.toFixed(2),p.dir,mv].join();const now=Date.now();
 if(!force&&k===lastPos&&now-lastPosT<3000)return;lastPos=k;lastPosT=now;bc('pos',{role:auth.role,x:+p.x.toFixed(2),y:+p.y.toFixed(2),dir:p.dir,mv})}
setInterval(()=>started&&auth&&sendPos(),120);
let simLast={},simKeyT=0;
function sendSim(){if(!chan||!rtOk||!window.Animals||!Animals.isHost()||document.hidden)return;const o=Object.values(others).some(x=>x.here&&!x.hidden);if(!o)return;
 const now=Date.now(),full=now-simKeyT>3000,out={a:{},i:{}};let n=0;const st=Game.state;
 for(const id in Animals.live){const l=Animals.live[id];if(l.fade)continue;const v=[+l.x.toFixed(2),+l.y.toFixed(2),l.dir|0,l.mv?1:0],k='a'+id,s2=v.join();if(full||simLast[k]!==s2){simLast[k]=s2;out.a[id]=v;n++}}
 for(const id in st.intr||{}){const e=st.intr[id];if(e.ph==='done')continue;const v=[+e.x.toFixed(2),+e.y.toFixed(2),e.dir|0,e.ph2||''],k='i'+id,s2=v.join();if(full||simLast[k]!==s2){simLast[k]=s2;out.i[id]=v;n++}}
 if(full)simKeyT=now;if(n)bc('sim',out)}
setInterval(()=>started&&auth&&sendSim(),160);
window.SyncDrive=p=>bc('drive',p);
// drawn by game.js row loop
window.drawOthers=row=>{const now=Date.now();for(const k in others){const o=others[k];if(!o.here||o.tx==null||now-o.t>20000)continue;
 const dt=Math.min(.1,(now-(o.lt||now))/1000);o.lt=now;if(o.x==null){o.x=o.tx;o.y=o.ty}const pr=o.mv?Math.min(.25,(now-o.t)/1000):0,gx=o.tx+(o.vx||0)*pr,gy=o.ty+(o.vy||0)*pr,a=1-Math.exp(-dt*10);if(Math.hypot(gx-o.x,gy-o.y)>6){o.x=gx;o.y=gy}else{o.x+=(gx-o.x)*a;o.y+=(gy-o.y)*a}o.ph=(o.ph||0)+(o.mv?.23:0);if(Math.floor(o.y)!==row)continue;
 ctx.save();ctx.translate((o.x-.7)*T,(o.y-1.2)*T);ctx.scale(T*1.4,T*1.4);S.puppy(ctx,o.dir||0,o.ph,o.mv,ROLES[k].char);ctx.restore();
 const X=o.x*T,Y=(o.y-1.25)*T,n=ROLES[k].name;ctx.font=`900 ${T*.26}px "Yuanti SC","PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(n).width+14;
 ctx.beginPath();ctx.roundRect(X-w/2,Y-11,w,22,11);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=k==='xiaobai'?'#9aa7b8':'#f5a623';ctx.stroke();ctx.fillStyle='#5a3a22';ctx.fillText(n,X,Y+1)}};

// ---- status pill ----
function net(ok){online=ok;renderNet()}
function renderNet(){const el=$('net');if(!el)return;if(!auth){el.textContent='📴 离线模式';return}
 const o=Object.keys(others).find(k=>others[k].here);el.textContent=!online?'📴 离线中，联网后自动同步':o?'🟢 '+ROLES[o].name+'在岛上':'☁️ 已同步'}

// ---- login / wait UI ----
function gate(html){const g=$('gate');g.classList.remove('hidden');$('gateBody').innerHTML=html;return g}
function hideGate(){$('gate').classList.add('hidden')}
function showLogin(msg){gate(`<div class="big">🏝️</div><b>欢迎回到我们的小岛</b><p>输入进岛密码</p><input id="pw" type="password" inputmode="numeric" autocomplete="current-password" enterkeyhint="go" maxlength="20"><button id="go">进岛</button><p id="err" class="err">${msg||''}</p><button id="offl" class="link hidden">先离线玩（不同步）</button>`);
 const go=async()=>{const pw=$('pw').value.trim();if(!pw)return;$('go').disabled=true;$('err').textContent='正在敲门…';
  try{const role=await rpc('login',{pw});if(!ROLES[role]){$('err').textContent='密码不对哦';$('go').disabled=false;return}
   auth={role,pw};localStorage.setItem(K_AUTH,J(auth));if(base&&base.role!==role){base=null;version=0;lastSig=''}enter()}
  catch(e){$('err').textContent=e.code==='PGRST202'||/function|schema cache/i.test(e.message)?'服务器还没准备好，稍后再试':'连不上服务器，检查一下网络';$('offl').classList.remove('hidden');$('go').disabled=false}};
 $('go').onclick=go;$('pw').addEventListener('keydown',e=>{if(e.key==='Enter')go()});$('offl').onclick=()=>{hideGate();startGame(false)}}
let waitT=null;
async function enter(){gate('<div class="big">🐾</div><b>正在上岛…</b>');let r;
 try{r=await rpc('get_island',{pw:auth.pw});net(true)}
 catch(e){if(badPw(e))return logout('密码不对哦，请重新输入');net(false);
  if(L.load()&&(version>0||auth.role==='xiaobai')){hideGate();return startGame(true)} // offline: play local copy, sync later
  return gate('<div class="big">📶</div><b>连不上服务器</b><p>检查一下网络再试试</p><button id="again">重试</button>'),$('again').onclick=enter}
 if(!r||!r.data){
  if(auth.role==='xiaobai'){const local=L.load();if(local){backup();try{const s=await rpc('save_island',{pw:auth.pw,data:strip(local),base_version:0});
     if(s&&s.ok){version=s.version;setBase(strip(local),version);lastSig=J(strip(local))}else return enter()}catch(e){return gate('<div class="big">📶</div><b>上传小岛失败</b><p>你的小岛还好好地存在手机里</p><button id="again">重试</button>'),$('again').onclick=enter}}
   hideGate();return startGame(true)}
  gate(`<div class="big">🐶</div><b>等小白先上岛哦</b><p>小白登录后，你们的小岛就会出现在这里～</p><button id="lo" class="link">换个密码</button>`);$('lo').onclick=()=>logout();
  clearTimeout(waitT);waitT=setTimeout(enter,5000);return}
 clearTimeout(waitT);
 const local=L.load();
 if(!started){ // first load from cloud: keep a backup of whatever was on this phone
  if(local&&J(strip(local))!==J(r.data))backup();
  let st;if(base&&local&&base.version===r.version)st=strip(local);else if(base&&local)st=m3(base.data,strip(local),r.data);else st=clone(r.data);
  const pl=(base&&local&&local.player)||r.data.player;
  st.player=pl||spawn(st);st.updatedAt=Date.now();L.save(st);version=r.version;setBase(r.data,r.version);lastSig=J(r.data);
  hideGate();startGame(true)}}
function spawn(st){const w=st.w||64,h=st.h||64,ok=i=>st.ter&&st.ter[i]!==0&&!(st.obj||{})[i];
 for(let r=0;r<30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=(w>>1)+dx,y=(h>>1)+dy+2,i=y*w+x;if(x>0&&y>0&&x<w-1&&y<h-1&&ok(i)&&ok(i-1)&&ok(i+1))return{x:x+.5,y:y+.5,dir:0}}
 return{x:w/2+.5,y:h/2+.5,dir:0}}
function logout(msg){localStorage.removeItem(K_AUTH);if(started)return location.reload();auth=null;showLogin(msg)}

// ---- boot the game scripts once data is ready ----
function startGame(isOnline){if(started)return;started=true;document.body.classList.toggle('online',!!isOnline&&!!auth);
 if(!isOnline)auth=null;else localStorage.setItem('our-island-char',ROLES[auth.role].char);
 const who=$('who');if(who&&auth)who.textContent='我是'+ROLES[auth.role].name+(auth.role==='jimao'?'（黄狗）':'（白狗）');
 renderNet();let i=0;const next=()=>{if(i>=GAME.length)return afterGame();const s=document.createElement('script');s.src=GAME[i++]+'?v='+VER;s.onload=next;s.onerror=next;document.body.appendChild(s)};next()}
function afterGame(){if(!auth)return;connectRT();schedule(800);
 document.addEventListener('visibilitychange',()=>{try{rtOk&&chan.track(me())}catch(e){}if(document.hidden){clearTimeout(timer);push()}else{pullSafe();if(!rtOk&&!chan)connectRT();schedule(500)}});
 addEventListener('online',()=>{pullSafe();schedule(300)});setInterval(()=>{if(!document.hidden&&Date.now()-lastPullT>(rtOk?300000:60000))pullSafe()},20000)}
$('logout').onclick=()=>{if(confirm('退出登录？（手机里的小岛不会删除）'))logout()};
if(auth&&ROLES[auth.role])enter();else showLogin();
window.Sync={get version(){return version},get auth(){return auth},push,pull,others};
})();
