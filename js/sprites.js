// Tiny pixel sprites drawn on a 16x16 grid.
const S={};
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
S.grass=(c,v)=>{px(c,0,0,16,16,v?'#8fd16a':'#86c95f');px(c,3,4,1,2,'#6fb34a');px(c,11,10,1,2,'#6fb34a');px(c,7,13,1,1,'#a5e07f')};
S.sand=c=>{px(c,0,0,16,16,'#f3dea0');px(c,4,5,1,1,'#e2c67f');px(c,11,11,1,1,'#e2c67f')};
S.soil=(c,wet)=>{px(c,0,0,16,16,wet?'#6b4428':'#9b6a3f');for(let y=2;y<16;y+=4)px(c,1,y,14,1,wet?'#56351e':'#83552f')};
S.fence=c=>{px(c,2,3,2,11,'#c48a4a');px(c,12,3,2,11,'#c48a4a');px(c,0,6,16,2,'#d9a066');px(c,0,10,16,2,'#d9a066');px(c,2,3,2,1,'#e8b97f');px(c,12,3,2,1,'#e8b97f')};
S.flower=c=>{px(c,7,8,2,6,'#4f9a3a');px(c,5,10,2,2,'#5fb146');[[6,3],[9,3],[6,6],[9,6]].forEach(([x,y])=>px(c,x,y,2,2,'#ff7aa8'));px(c,7,4,2,3,'#ffd54a')};
S.tree=c=>{px(c,7,10,3,6,'#8a5a32');px(c,3,2,10,9,'#3f9a45');px(c,2,4,12,5,'#3f9a45');px(c,5,3,3,2,'#62bb5a');px(c,10,6,2,2,'#e84b4b')};
S.house=c=>{px(c,1,1,14,6,'#e8743b');px(c,0,6,16,1,'#c45a28');px(c,2,7,12,9,'#fff1d6');px(c,7,10,3,6,'#a4683a');px(c,3,9,3,3,'#8ed0f0');px(c,11,9,2,2,'#ff7aa8')};
S.erase=c=>{px(c,3,3,10,10,'#ff9a9a');px(c,4,7,8,2,'#fff')};
S.hoe=c=>{px(c,3,2,8,3,'#9aa3ad');px(c,9,4,2,11,'#a4683a')};
S.can=c=>{px(c,3,6,8,7,'#5ab0e8');px(c,10,4,4,2,'#5ab0e8');px(c,4,4,4,2,'#3a8fc8');px(c,13,3,2,1,'#8ed0f0')};
S.seed=c=>{px(c,4,3,8,11,'#e8c28a');px(c,4,3,8,2,'#c48a4a');px(c,7,8,2,2,'#6b4428')};
S.basket=c=>{px(c,2,7,12,7,'#c48a4a');px(c,4,3,8,1,'#a4683a');px(c,4,3,1,4,'#a4683a');px(c,11,3,1,4,'#a4683a');px(c,4,6,3,2,'#ff7a3d');px(c,8,5,3,3,'#e84b4b')};
S.water=(c,t)=>{px(c,0,0,16,16,'#6cc3e8');px(c,(t*3)%14,5,3,1,'#a8e0f5');px(c,(t*5+7)%14,11,3,1,'#a8e0f5')};
// crop stages 0 sprout,1 growing,2 ripe
const CROP_COL={carrot:'#ff8a2a',tomato:'#e83b3b',strawberry:'#ff4d6d'};
S.crop=(c,type,stage)=>{const g='#4fae3c';
 if(stage===0){px(c,7,9,2,4,g);px(c,5,8,2,2,g);px(c,9,8,2,2,g);return}
 if(stage===1){px(c,7,5,2,9,g);px(c,4,6,3,2,g);px(c,9,4,3,2,g);px(c,5,10,2,2,g);return}
 const col=CROP_COL[type];
 if(type==='carrot'){px(c,5,2,2,5,g);px(c,9,2,2,5,g);px(c,7,1,2,5,g);px(c,5,7,6,3,col);px(c,6,10,4,3,col);px(c,7,13,2,2,col)}
 else if(type==='tomato'){px(c,7,1,2,4,g);px(c,4,5,8,8,col);px(c,3,7,10,4,col);px(c,5,6,2,2,'#ff9b9b');px(c,6,4,4,1,g)}
 else{px(c,5,2,6,3,g);px(c,4,5,8,5,col);px(c,5,10,6,2,col);px(c,7,12,2,2,col);[[5,6],[9,7],[7,9]].forEach(([x,y])=>px(c,x,y,1,1,'#ffe08a'))}};
window.S=S;
