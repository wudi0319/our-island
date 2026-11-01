// Top-right info panel: both parents' local time + weather, and 胖宝's age. Config lives in state.config (editable/syncable later).
const CONFIG_DEFAULT={people:[{name:'鸡毛',tz:'Australia/Sydney',lat:-33.87,lon:151.21},{name:'小白',tz:'Asia/Shanghai',lat:31.72,lon:119.56}],baby:{birthday:'2026-04-08',tz:'Asia/Shanghai'}};
function infoCfg(){if(!state.config){state.config=JSON.parse(JSON.stringify(CONFIG_DEFAULT));save()}return state.config}
const WX_KEY='our-island-weather';let wx={};try{wx=JSON.parse(localStorage.getItem(WX_KEY))||{}}catch(e){}
const wxIcon=c=>c==null?'':c===0?'☀️':c<=2?'🌤️':c===3?'☁️':c<=48?'🌫️':c<=67?'🌧️':c<=77?'❄️':c<=82?'🌦️':c<=86?'🌨️':'⛈️';
const hm=tz=>new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
function ymd(tz){const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).split('-').map(Number);return p}
function babyAge(bd,tz){let[y,m,d]=ymd(tz);const[by,bm,bdd]=bd.split('-').map(Number);
 let Y=y-by,M=m-bm,D=d-bdd;if(D<0){M--;D+=new Date(y,m-1,0).getDate()}if(M<0){Y--;M+=12}if(Y<0)return'还没出生';
 return(Y>0?Y+'岁':'')+(Y>0||M>0?M+'个月':'')+D+'天'}
async function fetchWx(){const ppl=infoCfg().people;
 for(const p of ppl){const k=p.lat+','+p.lon;try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&timezone=auto`);
  const j=await r.json();wx[k]={t:Math.round(j.current.temperature_2m),c:j.current.weather_code,at:Date.now()}}catch(e){}}
 localStorage.setItem(WX_KEY,JSON.stringify(wx));renderInfo()}
const infoEl=document.getElementById('info');
function renderInfo(){const c=infoCfg(),bn=(state.baby&&state.baby.name)||'胖宝';
 const lines=c.people.map(p=>{const w=wx[p.lat+','+p.lon],fresh=w&&Date.now()-w.at<6*3600e3;return`<div><b>${p.name}时间</b>：${hm(p.tz)} · ${fresh?wxIcon(w.c)+w.t:'--'}°C</div>`});
 lines.push(`<div><b>${bn}时间</b>：${babyAge(c.baby.birthday,c.baby.tz)}</div>`);
 infoEl.innerHTML=infoEl.classList.contains('mini')?`<div>🕐 ${c.people.map(p=>hm(p.tz)).join(' / ')}</div>`:lines.join('')}
infoEl.addEventListener('click',()=>{infoEl.classList.toggle('mini');localStorage.setItem('our-island-info-mini',infoEl.classList.contains('mini')?'1':'');renderInfo()});
if(localStorage.getItem('our-island-info-mini'))infoEl.classList.add('mini');
renderInfo();setInterval(renderInfo,30e3);fetchWx();setInterval(fetchWx,15*60e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderInfo();const w=Object.values(wx)[0];if(!w||Date.now()-w.at>15*60e3)fetchWx()}});
window.Info={babyAge,renderInfo,fetchWx};
