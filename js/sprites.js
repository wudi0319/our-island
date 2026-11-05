// Cartoon sprites: drawn with vector shapes in a unit tile (0..1), outlined.
const OL='#3b2a20';
function rr(c,x,y,w,h,r,fill,ol=true){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}}
function circ(c,x,y,r,fill,ol=true){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}}
function shadow(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill()}
const S={};
S.tree=c=>{shadow(c,.5,.92,.32,.09);rr(c,.42,.55,.16,.38,.06,'#c08a5a');circ(c,.5,.4,.33,'#8fc96b');circ(c,.36,.36,.14,'#b5dd8a',false);circ(c,.66,.5,.06,'#f08a7a');circ(c,.4,.55,.05,'#f08a7a')};
S.flower=c=>{c.strokeStyle='#3f9a3a';c.lineWidth=.06;c.beginPath();c.moveTo(.5,.85);c.lineTo(.5,.5);c.stroke();
 [[0,-1],[1,0],[0,1],[-1,0],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].slice(0,5).forEach(([dx,dy],i)=>circ(c,.5+dx*.12,.42+dy*.12,.1,'#f7b2c0'));circ(c,.5,.42,.08,'#ffd84a')};
S.house=c=>{shadow(c,.5,.95,.45,.08);rr(c,.12,.42,.76,.52,.06,'#fbecd2');c.beginPath();c.moveTo(.02,.48);c.quadraticCurveTo(.5,-.08,.98,.48);c.closePath();c.fillStyle='#e8a36a';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();
 rr(c,.42,.64,.18,.3,.08,'#b98257');rr(c,.18,.56,.17,.15,.04,'#ffe6a8');rr(c,.67,.56,.15,.15,.04,'#ffe6a8');};
S.rock=c=>{shadow(c,.5,.85,.3,.07);c.beginPath();c.ellipse(.5,.66,.3,.22,0,0,7);c.fillStyle='#b9bfc8';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();circ(c,.42,.6,.06,'#d8dde3',false)};
// fence autotile: n,e,s,w booleans
S.fence=(c,n,e,s,w)=>{const rail=(x1,y1,x2,y2)=>{c.lineCap='round';c.strokeStyle=OL;c.lineWidth=.16;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='#e0a96d';c.lineWidth=.08;c.stroke()};
 const cx=.5,cy=.55;if(w)rail(0,cy,cx,cy);if(e)rail(cx,cy,1,cy);if(n)rail(cx,-.05,cx,cy);if(s)rail(cx,cy,cx,1.05);
 shadow(c,cx,cy+.2,.12,.04);rr(c,cx-.08,cy-.25,.16,.42,.06,'#c98b52');circ(c,cx,cy-.25,.08,'#e8b47c')};
const CROP_COL={carrot:'#ff8a2a',tomato:'#ff4a3d',strawberry:'#ff4d7d'};
S.crop=(c,type,stage)=>{const g='#8cc66a';
 const leaf=(x,y,r,a)=>{c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,r*.5,r,0,0,7);c.fillStyle=g;c.fill();c.lineWidth=.035;c.strokeStyle=OL;c.stroke();c.restore()};
 if(stage===0){leaf(.43,.6,.1,-.6);leaf(.57,.6,.1,.6);return}
 if(stage===1){leaf(.38,.5,.15,-.7);leaf(.62,.5,.15,.7);leaf(.5,.42,.16,0);return}
 const col=CROP_COL[type];
 if(type==='carrot'){leaf(.42,.3,.13,-.4);leaf(.58,.3,.13,.4);c.beginPath();c.moveTo(.32,.45);c.quadraticCurveTo(.5,1.05,.68,.45);c.closePath();c.fillStyle=col;c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}
 else if(type==='tomato'){circ(c,.5,.58,.24,col);leaf(.42,.36,.08,-1.2);leaf(.58,.36,.08,1.2);circ(c,.42,.5,.05,'#ffb3a8',false)}
 else{leaf(.4,.32,.1,-.8);leaf(.6,.32,.1,.8);c.beginPath();c.moveTo(.3,.42);c.quadraticCurveTo(.5,.32,.7,.42);c.quadraticCurveTo(.6,.88,.5,.86);c.quadraticCurveTo(.4,.88,.3,.42);c.fillStyle=col;c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();[[.42,.52],[.56,.56],[.48,.68]].forEach(([x,y])=>circ(c,x,y,.02,'#ffe08a',false))}};
// tool icons (unit square)
S.hoe=c=>{rr(c,.45,.15,.1,.75,.05,'#b98257');rr(c,.2,.12,.4,.16,.05,'#b9c4cf')};
S.can=c=>{rr(c,.2,.38,.5,.42,.1,'#5ab8f0');c.lineWidth=.08;c.strokeStyle=OL;c.beginPath();c.moveTo(.68,.48);c.lineTo(.88,.3);c.stroke();circ(c,.88,.3,.05,'#5ab8f0')};
S.seed=c=>{rr(c,.25,.18,.5,.66,.08,'#f2cf98');rr(c,.25,.18,.5,.16,.06,'#e0a96d');circ(c,.5,.58,.08,'#8b5a2b')};
S.basket=c=>{rr(c,.15,.45,.7,.4,.12,'#d99a5b');circ(c,.38,.42,.11,'#ff5a4a');circ(c,.6,.4,.1,'#ff9a2a')};
S.axe=c=>{rr(c,.45,.15,.1,.75,.05,'#b98257');c.beginPath();c.moveTo(.5,.15);c.quadraticCurveTo(.15,.2,.2,.45);c.lineTo(.5,.4);c.closePath();c.fillStyle='#b9c4cf';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()};
S.erase=c=>{circ(c,.5,.5,.32,'#ff8f8f');c.strokeStyle='#fff';c.lineWidth=.1;c.lineCap='round';c.beginPath();c.moveTo(.36,.36);c.lineTo(.64,.64);c.moveTo(.64,.36);c.lineTo(.36,.64);c.stroke()};
S.fenceIcon=c=>S.fence(c,0,1,0,1);
// gate: two posts + swinging plank door; vert = runs north-south; open 0..1
S.gate=(c,vert,open)=>{const cx=.5,cy=.55,post=(x,y)=>{shadow(c,x,y+.2,.1,.035);rr(c,x-.07,y-.3,.14,.46,.05,'#c98b52');circ(c,x,y-.3,.075,'#e8b47c')};
 const door=(x0,y0,len,horiz)=>{const k=Math.cos(open*Math.PI/2*.92);c.save();c.translate(x0,y0);if(horiz)c.scale(k,1);else c.scale(1,k);
  if(horiz){rr(c,0,-.2,len,.12,.04,'#f2c28a');rr(c,0,.02,len,.12,.04,'#f2c28a');c.lineWidth=.06;c.strokeStyle=OL;c.beginPath();c.moveTo(.04,.1);c.lineTo(len-.04,-.16);c.stroke()}
  else{rr(c,-.17,0,.12,len,.04,'#f2c28a');rr(c,.05,0,.12,len,.04,'#f2c28a')}c.restore()};
 if(!vert){door(.08,cy,.42,1);c.save();c.translate(1,0);c.scale(-1,1);door(.08,cy,.42,1);c.restore();post(.06,cy);post(.94,cy)}
 else{post(cx,.08);door(cx,.0,.48,0);c.save();c.translate(0,1.1);c.scale(1,-1);door(cx,.0,.48,0);c.restore();post(cx,.98)}};
S.gateIcon=c=>S.gate(c,0,0);
// farm animals (unit tile, drawn ~1.2 tiles wide by caller); dir 2=left 3=right
S.pig=(c,dir,ph,mv)=>{const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.04:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 shadow(c,.5,.92,.32,.07);[.3,.42,.58,.7].forEach((x,i)=>rr(c,x-.05,.72+(mv&&i%2?-.03:0),.1,.17,.04,'#f59ab0'));
 c.beginPath();c.ellipse(.48,.6-b,.32,.22,0,0,7);c.fillStyle='#ffc2cf';c.fill();c.lineWidth=.065;c.strokeStyle=OL;c.stroke();
 c.beginPath();c.moveTo(.16,.55);c.quadraticCurveTo(.06,.5,.12,.44);c.lineWidth=.04;c.stroke();
 circ(c,.74,.48-b,.18,'#ffc2cf');c.beginPath();c.moveTo(.64,.36-b);c.lineTo(.66,.24-b);c.lineTo(.74,.33-b);c.closePath();c.fillStyle='#f59ab0';c.fill();c.lineWidth=.05;c.stroke();
 rr(c,.82,.46-b,.13,.11,.05,'#f59ab0');circ(c,.86,.515-b,.015,OL,false);circ(c,.91,.515-b,.015,OL,false);circ(c,.75,.43-b,.025,OL,false);circ(c,.7,.53-b,.03,'#ff8fa8',false);c.restore()};
S.cow=(c,dir,ph,mv)=>{const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.03:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 shadow(c,.5,.93,.36,.07);[.24,.36,.6,.72].forEach((x,i)=>rr(c,x-.05,.68+(mv&&i%2?-.03:0),.1,.22,.04,'#fffaf0'));
 rr(c,.12,.36-b,.66,.38,.17,'#fffaf0');circ(c,.33,.48-b,.08,'#4a3a32',false);circ(c,.55,.6-b,.06,'#4a3a32',false);
 c.lineWidth=.04;c.strokeStyle=OL;c.beginPath();c.moveTo(.13,.45);c.quadraticCurveTo(.04,.55,.08,.66);c.stroke();
 c.beginPath();c.moveTo(.76,.26-b);c.lineTo(.74,.14-b);c.moveTo(.92,.26-b);c.lineTo(.95,.14-b);c.lineWidth=.06;c.strokeStyle='#e8c98f';c.stroke();
 circ(c,.84,.38-b,.16,'#fffaf0');rr(c,.74,.44-b,.2,.12,.06,'#ffc2cf');circ(c,.79,.335-b,.022,OL,false);circ(c,.9,.335-b,.022,OL,false);
 c.beginPath();c.ellipse(.68,.3-b,.06,.035,-.4,0,7);c.fillStyle='#fffaf0';c.fill();c.lineWidth=.04;c.strokeStyle=OL;c.stroke();c.restore()};
// player: dir 0 down 1 up 2 left 3 right, step animation phase
S.player=(c,dir,phase,moving)=>{const b=moving?Math.sin(phase)*.04:0,l=moving?Math.sin(phase)*.08:0;
 shadow(c,.5,.95,.24,.06);rr(c,.36+l*0.3,.78,.12,.16,.05,'#5a6fb8');rr(c,.52-l*0.3,.78,.12,.16,.05,'#5a6fb8');
 rr(c,.3,.48+b,.4,.36,.14,dir===1?'#ff9a6a':'#ff8c5a');
 circ(c,.5,.32+b,.24,'#ffe0c2');
 c.beginPath();c.arc(.5,.28+b,.25,Math.PI,0);c.fillStyle='#6b4226';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();
 if(dir!==1){const ox=dir===2?-.08:dir===3?.08:0;circ(c,.42+ox,.36+b,.03,'#3a2a1a',false);circ(c,.58+ox,.36+b,.03,'#3a2a1a',false);circ(c,.36+ox,.42+b,.035,'#ffaaaa',false);circ(c,.64+ox,.42+b,.035,'#ffaaaa',false)}};
window.S=S;window.rr=rr;window.circ=circ;
// Original "line-puppy style" pup: round fluffy body, bold black hand-drawn outline.

// 小白 v16: one merged fluffy blob, small even scallops (two-pass: outline then fill)
function scallopPath(c,x,y,rx,ry,b=.028){const per=Math.PI*(rx+ry),n=Math.max(8,Math.round(per/b/1.9));c.moveTo(x+rx,y);
 for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,am=(a0+a1)/2,k=1+b/Math.min(rx,ry)*.75;
  c.quadraticCurveTo(x+Math.cos(am)*rx*k,y+Math.sin(am)*ry*k,x+Math.cos(a1)*rx,y+Math.sin(a1)*ry)}c.closePath()}
S.whitePup=(c,dir,phase,moving)=>{const K='#221813',W=.03,s=moving?Math.sin(phase):0,sq=Math.abs(s);
 c.save();c.translate(.5,.94);c.scale(1+sq*.06,1-sq*.08);c.translate(0,-sq*.05);c.translate(-.5,-.94);
 c.beginPath();c.ellipse(.5,.955,.25,.045,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill();
 const side=dir>=2,f=dir===2?-1:1,hx=side?.5+.04*f:.5,hy=.43,lg=moving?s*.035:0;
 const parts=[];const P=(x,y,rx,ry,b)=>parts.push([x,y,rx,ry,b]);
 // tail tuft
 if(dir===1)P(.5,.74,.06,.05,.02);else if(side)P(.5-.2*f,.75,.045,.04,.016);
 // legs
 if(side){P(.42+lg,.89,.06,.05,.018);P(.58-lg,.89,.06,.05,.018)}else{P(.4,.89+lg,.065,.05,.018);P(.6,.89-lg,.065,.05,.018)}
 // body + ears + head
 P(.5,.745,.185,.165,.024);
 P(hx,hy,.28,.225,.024);
 if(side)P(hx-.27*f,hy+.12,.075,.14,.018);else{P(hx-.285,hy+.12,.08,.14,.018);P(hx+.285,hy+.12,.08,.14,.018)}
 c.lineJoin='round';
 for(const q of parts){c.beginPath();scallopPath(c,...q);c.lineWidth=W*2;c.strokeStyle=K;c.stroke()}
 for(const q of parts){c.beginPath();scallopPath(c,...q);c.fillStyle='#fff';c.fill()}
 if(!side&&dir!==1)[[-1],[1]].forEach(([q])=>{c.beginPath();c.arc(.5+q*.1,.73,.045,q<0?-.3:Math.PI*.6,q<0?Math.PI*.4:Math.PI+.3);c.strokeStyle=K;c.lineWidth=.022;c.lineCap='round';c.stroke()});
 if(!side&&dir!==1){c.strokeStyle=K;c.lineWidth=.022;c.lineCap='round';c.beginPath();c.moveTo(.5,.87);c.lineTo(.5,.93);c.stroke()}
 if(dir===1){c.restore();return}
 const fx=side?hx+.09*f:hx,dx=side?0:.13,dot=(x,y,r,col)=>{c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=col;c.fill()};
 c.globalAlpha=.75;dot(fx-dx-.045,hy+.08,.038,'#ffb3c0');if(!side)dot(fx+dx+.045,hy+.08,.038,'#ffb3c0');c.globalAlpha=1;
 if(S.closedEyes){c.strokeStyle=K;c.lineWidth=.028;[fx-dx,side?null:fx+dx].forEach(x=>{if(x==null)return;c.beginPath();c.arc(x,hy+.02,.026,.25,Math.PI-.25);c.stroke()})}
 else{dot(side?fx+.02*f:fx-dx,hy+.025,.019,K);if(!side)dot(fx+dx,hy+.025,.019,K)}
 const nx=side?fx+.11*f:fx;c.beginPath();c.ellipse(nx,hy+.06,.026,.018,0,0,7);c.fillStyle=K;c.fill();
 // open mouth with tongue
 const mp=()=>{c.beginPath();c.moveTo(nx-.04,hy+.1);c.lineTo(nx+.04,hy+.1);c.quadraticCurveTo(nx+.042,hy+.175,nx,hy+.175);c.quadraticCurveTo(nx-.042,hy+.175,nx-.04,hy+.1);c.closePath()};
 mp();c.fillStyle='#5a221c';c.fill();c.save();c.clip();dot(nx,hy+.18,.04,'#ff8597');c.restore();mp();c.strokeStyle=K;c.lineWidth=.022;c.lineJoin='round';c.stroke();
 c.restore()};
const PUP={white:{fur:'#ffffff',shade:'#f1ece4',fluffy:1},yellow:{fur:'#ecca92',shade:'#c99a62',collar:1},baby:{fur:'#ffdb7a',shade:'#f2b85a',bow:1}};
S.puppy=(c,dir,phase,moving,kind='white')=>{if(kind==='white')return S.whitePup(c,dir,phase,moving);const P=PUP[kind]||PUP.white,K='#2a1d16';
 const s=moving?Math.sin(phase):0,sq=Math.abs(s);
 c.save();c.translate(.5,.94);c.scale(1+sq*.07,1-sq*.09);c.translate(0,-sq*.06);c.translate(-.5,-.94);
 const line=(w=.06)=>{c.lineWidth=w;c.strokeStyle=K;c.lineJoin=c.lineCap='round';c.stroke()};
 const ell=(x,y,rx,ry,fill,w,rot=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fillStyle=fill;c.fill();if(w!==0)line(w)};
 // fluffy blob: scalloped outline
 const fluff=(x,y,rx,ry,fill,n=11,w=.065)=>{c.beginPath();for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,am=(a0+a1)/2;
   const p0=[x+Math.cos(a0)*rx,y+Math.sin(a0)*ry],p1=[x+Math.cos(a1)*rx,y+Math.sin(a1)*ry],pm=[x+Math.cos(am)*rx*1.09,y+Math.sin(am)*ry*1.09];
   if(i===0)c.moveTo(...p0);c.quadraticCurveTo(pm[0],pm[1],p1[0],p1[1])}c.closePath();c.fillStyle=fill;c.fill();line(w)};
 const blob=(x,y,rx,ry,fill,w)=>P.fluffy?fluff(x,y,rx*1.04,ry*1.04,fill,Math.round(rx*72),w):ell(x,y,rx,ry,fill,w);
 c.beginPath();c.ellipse(.5,.95,.26,.05,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill();
 const side=dir>=2,f=dir===2?-1:1;
 if(P.fluffy&&dir!==1&&!side)fluff(.64,.7,.06,.05,P.fur,7);if(dir===1)(P.fluffy?fluff(.5,.68,.07,.06,P.fur,7):ell(.5,.68,.06,.05,P.fur));else if(side)ell(.5-.25*f,.66,.065,.045,P.fur,.055,f*-.6);
 const lg=moving?s*.03:0;
 if(side){ell(.5-.12*f+lg,.9,.06,.05,P.fur);ell(.5+.1*f-lg,.9,.06,.05,P.fur)}else{ell(.41,.9+lg,.065,.05,P.fur);ell(.59,.9-lg,.065,.05,P.fur)}
 blob(.5,.73,.2,.17,P.fur);
 const hx=side?.5+.06*f:.5,hy=.42;
 if(P.collar&&dir!==1){c.beginPath();c.ellipse(hx,hy+.2,.15,.045,0,0,Math.PI);line(.08);c.strokeStyle='#e0574f';c.lineWidth=.04;c.stroke();ell(hx+(side?.06*f:0),hy+.26,.03,.03,'#ffd36b',.035)}
 blob(hx,hy,.25,.215,P.fur);
 // ears: white = small round, yellow/baby = floppy
 const ear=(ex,rot)=>P.fluffy?fluff(ex,hy-.19,.09,.08,P.fur,7,.045):ell(ex,hy+(P.collar?.03:-.02),P.collar?.085:.07,P.collar?.16:.13,P.shade,.06,rot);
 if(side)ear(hx-.12*f,f*.5);else{ear(hx-(P.fluffy?.16:.25),P.collar?.15:.3);ear(hx+(P.fluffy?.16:.25),P.collar?-.15:-.3)}
 if(P.bow){ell(hx+.08,hy-.2,.045,.03,'#ff8fa3',.035,.5);ell(hx+.15,hy-.2,.045,.03,'#ff8fa3',.035,-.5);ell(hx+.115,hy-.2,.02,.02,'#ff6b86',.03)}
 if(dir===1){c.restore();return}
 const fx=side?hx+.1*f:hx;
 if(S.closedEyes){const ce=ex=>{c.beginPath();c.arc(ex,hy+.01,.03,.2,Math.PI-.2);line(.035)};ce(fx-(side?0:.1));if(!side)ce(fx+.1)}
 else{const er=P.baby?.025:.019;ell(fx-(side?0:.1),hy+.02,er,er*1.15,K,0);if(!side)ell(fx+.1,hy+.02,er,er*1.15,K,0)}
 const nx=side?fx+.1*f:fx;ell(nx,hy+.08,.032,.022,K,0);
 if((P.fluffy||P.collar)&&!S.closedEyes){c.beginPath();c.moveTo(nx-.055,hy+.11);c.quadraticCurveTo(nx,hy+.21,nx+.055,hy+.11);c.closePath();c.fillStyle='#5a2a24';c.fill();line(.035);ell(nx,hy+.155,.025,.018,'#ff8a9a',0)}else{c.beginPath();c.moveTo(nx-.04,hy+.12);c.quadraticCurveTo(nx-.02,hy+.15,nx,hy+.12);c.quadraticCurveTo(nx+.02,hy+.15,nx+.04,hy+.12);line(.035)}
 if(side)ell(fx-.03*f,hy+.1,.045,.028,'#ff9eae',0);else{ell(fx-.16,hy+.09,.05,.03,'#ff9eae',0);ell(fx+.16,hy+.09,.05,.03,'#ff9eae',0)}
 c.restore()};

// 胖仔食堂: cream walls, striped awning, big bowl sign on the roof
S.canteen=c=>{const sh=(x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill()};sh(.5,.95,.47,.08);
 rr(c,.08,.36,.84,.58,.06,'#fff6e0');
 c.beginPath();c.moveTo(.02,.4);c.lineTo(.12,.14);c.lineTo(.88,.14);c.lineTo(.98,.4);c.closePath();c.fillStyle='#e8b07a';c.fill();c.lineWidth=.035;c.strokeStyle=OL;c.stroke();
 // awning stripes + scallops
 for(let k=0;k<7;k++){const x=.08+k*.12;c.beginPath();c.arc(x+.06,.52,.06,0,Math.PI);c.fillStyle=k%2?'#fff':'#f08a7a';c.fill();c.lineWidth=.025;c.strokeStyle=OL;c.stroke();rr(c,x,.42,.12,.1,0,k%2?'#fff':'#f08a7a',false)}
 c.beginPath();c.moveTo(.08,.42);c.lineTo(.92,.42);c.lineWidth=.03;c.strokeStyle=OL;c.stroke();
 // window with counter + door
 rr(c,.14,.62,.2,.18,.04,'#ffe6a8');rr(c,.68,.62,.2,.18,.04,'#ffe6a8');c.beginPath();c.moveTo(.14,.71);c.lineTo(.34,.71);c.moveTo(.68,.71);c.lineTo(.88,.71);c.lineWidth=.02;c.strokeStyle=OL;c.stroke();
 rr(c,.42,.6,.18,.34,.08,'#b98257');circ(c,.56,.78,.02,'#ffd84a',false);
 // bowl sign on roof edge
 c.beginPath();c.arc(.5,.08,.11,0,Math.PI);c.closePath();c.fillStyle='#fff';c.fill();c.lineWidth=.03;c.strokeStyle=OL;c.stroke();
 c.beginPath();c.moveTo(.42,.0);c.lineTo(.56,-.08);c.moveTo(.47,.0);c.lineTo(.6,-.06);c.lineWidth=.025;c.stroke();
 circ(c,.5,.13,.025,'#f7b2c0',false)};
S.canteenIcon=c=>{c.save();c.translate(.02,.12);c.scale(.96,.86);S.canteen(c);c.restore()};

S.dockIcon=c=>{c.fillStyle='#9fd6e0';c.fillRect(.05,.55,.9,.4);c.fillStyle='#6b4a32';c.fillRect(.22,.5,.08,.42);c.fillRect(.7,.5,.08,.42);for(let k=0;k<3;k++){c.fillStyle=k%2?'#b97f48':'#d59d62';c.fillRect(.12,.2+k*.12,.76,.11)}c.lineWidth=.05;c.strokeStyle=OL;c.strokeRect(.12,.2,.76,.36)};
// v40 码头小屋: chunky pixel hut (12x17 px grid in a 1x1 unit box)
S.dockhut=c=>{const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x/12,y/17,w/12+.002,h/17+.002)};
 c.fillStyle='rgba(60,40,20,.25)';c.beginPath();c.ellipse(.5,.97,.46,.05,0,0,7);c.fill();
 P(5,0,1,3,'#6b4a32');P(6,0,3,2,'#ff6b6b');P(6,1,2,1,'#ffd23f'); // flag
 P(2,3,8,1,'#3b2a20');P(1,4,10,1,'#3b2a20');P(0,5,12,1,'#3b2a20'); // roof outline
 P(2,4,8,1,'#5ab8f0');P(1,5,10,1,'#3fa0e0');P(0,6,12,2,'#5ab8f0');P(0,7,12,1,'#3b88c8');for(let k=0;k<6;k++)P(k*2,6,1,1,'#fff');
 P(1,8,10,8,'#3b2a20');P(2,8,8,7,'#e8b27a');for(let y=9;y<15;y+=2)P(2,y,8,1,'#d59d62');
 P(3,9,3,3,'#3b2a20');P(4,10,1,1,'#bfe9f5');P(3.5,9.5,2,2,'#9fd6e0');P(4.3,9.8,.7,.7,'#fff'); // round-ish window
 P(7,10,3,5,'#3b2a20');P(7.5,10.5,2,4.5,'#a5683c');P(9,12.5,.5,.5,'#ffd23f'); // door
 P(2.4,12.6,1.6,1.6,'#ff9ab0');P(4.6,13,1.2,1.2,'#ff9ab0'); // little fish-shaped buoys
 P(0,15,12,1.6,'#6b4a32');P(1,15.3,10,.6,'#8a5f3c')};
S.dockhutIcon=c=>{c.save();c.translate(.18,.02);c.scale(.64,.96);S.dockhut(c);c.restore()};
