// Cartoon sprites: drawn with vector shapes in a unit tile (0..1), outlined.
const OL='#5a3a22';
function rr(c,x,y,w,h,r,fill,ol=true){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.045;c.strokeStyle=OL;c.stroke()}}
function circ(c,x,y,r,fill,ol=true){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.045;c.strokeStyle=OL;c.stroke()}}
function shadow(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle='rgba(60,40,20,.18)';c.fill()}
const S={};
S.tree=c=>{shadow(c,.5,.92,.32,.09);rr(c,.42,.55,.16,.38,.06,'#a8693a');circ(c,.5,.4,.33,'#4fb84a');circ(c,.36,.36,.14,'#6fd062',false);circ(c,.66,.5,.06,'#ff5a5a');circ(c,.4,.55,.05,'#ff5a5a')};
S.flower=c=>{c.strokeStyle='#3f9a3a';c.lineWidth=.06;c.beginPath();c.moveTo(.5,.85);c.lineTo(.5,.5);c.stroke();
 [[0,-1],[1,0],[0,1],[-1,0],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].slice(0,5).forEach(([dx,dy],i)=>circ(c,.5+dx*.12,.42+dy*.12,.1,'#ff8fb8'));circ(c,.5,.42,.08,'#ffd84a')};
S.house=c=>{shadow(c,.5,.95,.45,.08);rr(c,.12,.42,.76,.52,.06,'#fff1d6');c.beginPath();c.moveTo(.02,.48);c.quadraticCurveTo(.5,-.08,.98,.48);c.closePath();c.fillStyle='#ff7a4d';c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke();
 rr(c,.42,.64,.18,.3,.08,'#b5703c');rr(c,.18,.56,.17,.15,.04,'#9be0ff');rr(c,.67,.56,.15,.15,.04,'#9be0ff');circ(c,.5,.3,.06,'#fff3a0')};
S.rock=c=>{shadow(c,.5,.85,.3,.07);c.beginPath();c.ellipse(.5,.66,.3,.22,0,0,7);c.fillStyle='#b9bfc8';c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke();circ(c,.42,.6,.06,'#d8dde3',false)};
// fence autotile: n,e,s,w booleans
S.fence=(c,n,e,s,w)=>{const rail=(x1,y1,x2,y2)=>{c.lineCap='round';c.strokeStyle=OL;c.lineWidth=.16;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='#e0a96d';c.lineWidth=.08;c.stroke()};
 const cx=.5,cy=.55;if(w)rail(0,cy,cx,cy);if(e)rail(cx,cy,1,cy);if(n)rail(cx,-.05,cx,cy);if(s)rail(cx,cy,cx,1.05);
 shadow(c,cx,cy+.2,.12,.04);rr(c,cx-.08,cy-.25,.16,.42,.06,'#c98b52');circ(c,cx,cy-.25,.08,'#e8b47c')};
const CROP_COL={carrot:'#ff8a2a',tomato:'#ff4a3d',strawberry:'#ff4d7d'};
S.crop=(c,type,stage)=>{const g='#4cb83f';
 const leaf=(x,y,r,a)=>{c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,r*.5,r,0,0,7);c.fillStyle=g;c.fill();c.lineWidth=.035;c.strokeStyle=OL;c.stroke();c.restore()};
 if(stage===0){leaf(.43,.6,.1,-.6);leaf(.57,.6,.1,.6);return}
 if(stage===1){leaf(.38,.5,.15,-.7);leaf(.62,.5,.15,.7);leaf(.5,.42,.16,0);return}
 const col=CROP_COL[type];
 if(type==='carrot'){leaf(.42,.3,.13,-.4);leaf(.58,.3,.13,.4);c.beginPath();c.moveTo(.32,.45);c.quadraticCurveTo(.5,1.05,.68,.45);c.closePath();c.fillStyle=col;c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke()}
 else if(type==='tomato'){circ(c,.5,.58,.24,col);leaf(.42,.36,.08,-1.2);leaf(.58,.36,.08,1.2);circ(c,.42,.5,.05,'#ffb3a8',false)}
 else{leaf(.4,.32,.1,-.8);leaf(.6,.32,.1,.8);c.beginPath();c.moveTo(.3,.42);c.quadraticCurveTo(.5,.32,.7,.42);c.quadraticCurveTo(.6,.88,.5,.86);c.quadraticCurveTo(.4,.88,.3,.42);c.fillStyle=col;c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke();[[.42,.52],[.56,.56],[.48,.68]].forEach(([x,y])=>circ(c,x,y,.02,'#ffe08a',false))}};
// tool icons (unit square)
S.hoe=c=>{rr(c,.45,.15,.1,.75,.05,'#b5703c');rr(c,.2,.12,.4,.16,.05,'#b9c4cf')};
S.can=c=>{rr(c,.2,.38,.5,.42,.1,'#5ab8f0');c.lineWidth=.08;c.strokeStyle=OL;c.beginPath();c.moveTo(.68,.48);c.lineTo(.88,.3);c.stroke();circ(c,.88,.3,.05,'#5ab8f0')};
S.seed=c=>{rr(c,.25,.18,.5,.66,.08,'#f2cf98');rr(c,.25,.18,.5,.16,.06,'#e0a96d');circ(c,.5,.58,.08,'#8b5a2b')};
S.basket=c=>{rr(c,.15,.45,.7,.4,.12,'#d99a5b');circ(c,.38,.42,.11,'#ff5a4a');circ(c,.6,.4,.1,'#ff9a2a')};
S.axe=c=>{rr(c,.45,.15,.1,.75,.05,'#b5703c');c.beginPath();c.moveTo(.5,.15);c.quadraticCurveTo(.15,.2,.2,.45);c.lineTo(.5,.4);c.closePath();c.fillStyle='#b9c4cf';c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke()};
S.erase=c=>{circ(c,.5,.5,.32,'#ff8f8f');c.strokeStyle='#fff';c.lineWidth=.1;c.lineCap='round';c.beginPath();c.moveTo(.36,.36);c.lineTo(.64,.64);c.moveTo(.64,.36);c.lineTo(.36,.64);c.stroke()};
S.fenceIcon=c=>S.fence(c,0,1,0,1);
// player: dir 0 down 1 up 2 left 3 right, step animation phase
S.player=(c,dir,phase,moving)=>{const b=moving?Math.sin(phase)*.04:0,l=moving?Math.sin(phase)*.08:0;
 shadow(c,.5,.95,.24,.06);rr(c,.36+l*0.3,.78,.12,.16,.05,'#5a6fb8');rr(c,.52-l*0.3,.78,.12,.16,.05,'#5a6fb8');
 rr(c,.3,.48+b,.4,.36,.14,dir===1?'#ff9a6a':'#ff8c5a');
 circ(c,.5,.32+b,.24,'#ffe0c2');
 c.beginPath();c.arc(.5,.28+b,.25,Math.PI,0);c.fillStyle='#6b4226';c.fill();c.lineWidth=.045;c.strokeStyle=OL;c.stroke();
 if(dir!==1){const ox=dir===2?-.08:dir===3?.08:0;circ(c,.42+ox,.36+b,.03,'#3a2a1a',false);circ(c,.58+ox,.36+b,.03,'#3a2a1a',false);circ(c,.36+ox,.42+b,.035,'#ffaaaa',false);circ(c,.64+ox,.42+b,.035,'#ffaaaa',false)}};
window.S=S;window.rr=rr;window.circ=circ;
