(()=>{
'use strict';
const canvas=document.createElement('canvas');canvas.id='gameCanvas';document.getElementById('canvas').replaceChildren(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const VW=960,VH=720,TAU=Math.PI*2;
let scale=1,last=0,running=false,paused=false,over=false,wave=0,waveTime=0,spawnTimer=0,kills=0,gold=120,level=1,xp=0,nextXp=80,shake=0,anim=0;
const tower={x:480,y:360,hp:1000,maxHp:1000,flash:0};
const hero={x:480,y:475,hp:260,maxHp:260,spd:210,damage:34,rate:.42,cool:0,skill:0,skillCd:7,skillPower:120,crit:.08,dir:0};
let enemies=[],drops=[],particles=[],texts=[],keys={},touch={x:0,y:0,active:false},pickupRadius=55,goldBonus=0;
const upgrades=[
 ['⚔','날카로운 칼날','기본 공격력 +18',()=>hero.damage+=18],
 ['✦','광전사 회로','공격 속도 +22%',()=>hero.rate=Math.max(.16,hero.rate*.78)],
 ['♥','강화 갑옷','최대 HP +90 / HP 회복',()=>{hero.maxHp+=90;hero.hp=hero.maxHp}],
 ['➤','질주','이동 속도 +40',()=>hero.spd+=40],
 ['⚡','과부하 코어','전격 피해 +45% / 재사용 대기 -20%',()=>{hero.skillPower*=1.45;hero.skillCd*=.8}],
 ['◈','탐욕','획득 골드 +25%',()=>goldBonus+=.25],
 ['◎','자력 코어','아이템 획득 범위 +55',()=>pickupRadius+=55],
 ['◆','급소','치명타 확률 +12%',()=>hero.crit+=.12]
];
const TYPES={
 grunt:{hp:46,spd:48,dmg:8,gold:5,xp:10,scale:2,color:'grunt'},
 runner:{hp:30,spd:86,dmg:6,gold:7,xp:13,scale:2,color:'runner'},
 tank:{hp:180,spd:27,dmg:18,gold:16,xp:27,scale:3,color:'tank'},
 elite:{hp:340,spd:36,dmg:25,gold:32,xp:55,scale:3,color:'elite'},
 boss:{hp:1800,spd:20,dmg:45,gold:180,xp:300,scale:4,color:'boss'}
};
const gates=[{x:480,y:58},{x:805,y:88},{x:900,y:360},{x:805,y:632},{x:480,y:662},{x:155,y:632},{x:60,y:360},{x:155,y:88}];
const PAL={
 outline:'#10171b',dark:'#202b30',steel:'#52636b',steel2:'#71828a',skin:'#d69b70',skin2:'#f0bc88',blue:'#315d78',blue2:'#4f88a3',gold:'#e4b64e',gold2:'#ffe18a',red:'#a9494b',red2:'#db6660',green:'#3d8b68',cyan:'#55cfe0',cyan2:'#b4f6f5',purple:'#6e5aa8',white:'#e9f0eb'
};
const SPR={
 hero:[
 '......1111......','.....122221.....','....12222221....','....12222221....','....13333331....','....13344331....','....11111111....','...122555221....','..12222555221...','..12222222221...','..11222222211...','....122221......','....122221......','...11....11.....','...11....11.....','...44....44.....','...44....44.....','..111....111....','..1........1....','................'],
 grunt:[
 '.....111111.....','....12222221....','...1223333221...','...1231111321...','...1231111321...','...1222222221...','....12222221....','...1122442211...','..122222222221..','..122211112221..','..122111111221..','...1222222221...','...122....221...','..1122....2211..','..11........11..','................'],
 runner:[
 '......1111......','.....122221.....','....12222221....','....12311321....','....12222221....','.....122221.....','....11224411....','...1222222221...','...1222111221...','....12211221....','....12222221....','...11.1221.11...','...11..11..11...','..11...11...11..','................','................'],
 tank:[
 '....11111111....','...1222222221...','..122333333221..','..123111111321..','..123111111321..','..122222222221..','...1224442221...','..1122222222211.','..1222111122221.','..1221111112221.','..1222222222221.','..1222222222221.','...12222222221...','..1122....2211..','..11........11..','................'],
 elite:[
 '......1111......','....11222211....','...1223333221...','...1231111321...','...1231111321...','...1223333221...','....12222221....','..111224422111..','..122222222221..','..122211112221..','..122111111221..','...1222222221...','...122....221...','..1122....2211..','..11........11..','................'],
 boss:[
 '........111111........','......1122222211......','.....122333333221.....','....1223111133221....','....1231111111321....','....1233333333321....','.....122222222221.....','...111224444222111...','..12222222222222221..','..12222111111222221..','..12221111111112221..','..12222222222222221..','...122222222222221...','...1222..11..22221...','..11222..1111..22211..','..11....1221....11...','..11....1221....11...','........1221..........','........1221..........','.......111111.........']
};
function resize(){const r=document.getElementById('canvas').getBoundingClientRect();scale=Math.min(r.width/VW,r.height/VH);canvas.width=VW;canvas.height=VH;canvas.style.width=VW*scale+'px';canvas.style.height=VH*scale+'px';canvas.style.left=(r.width-VW*scale)/2+'px';canvas.style.top=(r.height-VH*scale)/2+'px'}
addEventListener('resize',resize);resize();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(k==='q')useSkill();if(k==='escape'&&running&&!over){paused=!paused;document.getElementById('pause').classList.toggle('hidden',!paused)}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}}
canvas.addEventListener('pointerdown',e=>{const p=pointer(e);touch={x:p.x,y:p.y,active:true};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(touch.active){const p=pointer(e);touch.x=p.x;touch.y=p.y}});canvas.addEventListener('pointerup',()=>touch.active=false);canvas.addEventListener('pointercancel',()=>touch.active=false);
function rnd(a,b){return a+Math.random()*(b-a)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function choose(a){return a[(Math.random()*a.length)|0]}
function pixelRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(x,y,s,size=14,c='#fff',align='center'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle='#081014';ctx.fillText(s,Math.round(x+2),Math.round(y+2));ctx.fillStyle=c;ctx.fillText(s,Math.round(x),Math.round(y))}
function bar(x,y,w,h,p,bg,fg){pixelRect(x,y,w,h,bg);pixelRect(x+2,y+2,(w-4)*clamp(p,0,1),h-4,fg)}
function spawnParticle(x,y,c,n=8){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(20,100);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.25,.65),max:.65,c,size:Math.random()<.6?3:5})}}
function dmgText(x,y,s,c='#ffd66b'){texts.push({x,y,s,life:.7,c})}
function gainXP(v){xp+=v;while(xp>=nextXp){xp-=nextXp;level++;nextXp=Math.floor(nextXp*1.24);showUpgrade()}}
function showUpgrade(){paused=true;document.getElementById('upgrade').classList.remove('hidden');const box=document.getElementById('upgradeChoices');box.innerHTML='';const arr=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);arr.forEach(u=>{const b=document.createElement('button');b.className='upgradeChoice';b.innerHTML=`<span>${u[0]}</span><strong>${u[1]}</strong><small>${u[2]}</small>`;b.onclick=()=>{u[3]();paused=false;document.getElementById('upgrade').classList.add('hidden');toast(u[1])};box.appendChild(b)})}
function toast(s){const e=document.getElementById('toast');e.textContent=s;e.classList.remove('show');void e.offsetWidth;e.classList.add('show')}
function spawnEnemy(){let type;if(wave%10===0&&enemies.filter(e=>!e.dead).length===0&&waveTime>2)type='boss';else{const r=Math.random();type=r<.12?'runner':r<.22?'tank':r<.28?'elite':'grunt'}const t=TYPES[type],g=choose(gates);enemies.push({type,x:g.x+rnd(-10,10),y:g.y+rnd(-10,10),hp:t.hp*(1+wave*.07),max:t.hp*(1+wave*.07),spd:t.spd*(1+Math.min(.5,wave*.012)),dmg:t.dmg*(1+wave*.055),dead:false,hit:0,slow:0,phase:Math.random()*TAU})}
function kill(e){if(e.dead)return;e.dead=true;kills++;const t=TYPES[e.type];gold+=Math.max(1,Math.floor(t.gold*(1+goldBonus)));gainXP(t.xp);if(Math.random()<.28||e.type==='boss')drops.push({x:e.x,y:e.y,type:Math.random()<.72?'gold':'orb',life:14});spawnParticle(e.x,e.y,e.type==='boss'?'#ff7b7b':'#f4c95d',12);dmgText(e.x,e.y-24,'+'+t.gold,'#ffd66b');if(e.type==='boss')toast('보스 처치!')}
function attack(){if(hero.cool>0)return;let target=null,md=999;for(const e of enemies){if(e.dead)continue;const dd=dist(hero,e);if(dd<145&&dd<md){md=dd;target=e}}if(!target)return;hero.cool=hero.rate;hero.dir=Math.atan2(target.y-hero.y,target.x-hero.x);const crit=Math.random()<hero.crit,v=hero.damage*(crit?2:1);target.hp-=v;target.hit=.1;dmgText(target.x,target.y-24,(crit?'CRIT ':'')+Math.round(v),crit?'#fff1a1':'#ffffff');spawnParticle(target.x,target.y,crit?'#ffe16b':'#c9d5df',crit?7:4);if(target.hp<=0)kill(target)}
function useSkill(){if(!running||paused||over||hero.skill>0)return;hero.skill=hero.skillCd;const radius=165;let n=0;for(const e of enemies){if(e.dead)continue;if(dist(hero,e)<radius){const v=hero.skillPower*(1+level*.035);e.hp-=v;e.slow=.8;n++;dmgText(e.x,e.y-24,Math.round(v),'#73e6ff');if(e.hp<=0)kill(e)}}spawnParticle(hero.x,hero.y,'#67dff7',34);shake=.22;toast('전격 발동! '+n+'명 타격')}
function move(dt){let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if(touch.active){const tx=touch.x-hero.x,ty=touch.y-hero.y;if(Math.hypot(tx,ty)>16){const n=Math.hypot(tx,ty);dx=tx/n;dy=ty/n}}const n=Math.hypot(dx,dy)||1;if(dx||dy){hero.x+=dx/n*hero.spd*dt;hero.y+=dy/n*hero.spd*dt;hero.x=clamp(hero.x,35,925);hero.y=clamp(hero.y,35,685)}}
function update(dt){if(!running||paused||over)return;waveTime+=dt;spawnTimer-=dt;hero.cool=Math.max(0,hero.cool-dt);hero.skill=Math.max(0,hero.skill-dt);tower.flash=Math.max(0,tower.flash-dt);if(waveTime>3&&spawnTimer<=0&&enemies.filter(e=>!e.dead).length<Math.min(14+wave*2,42)){spawnEnemy();spawnTimer=Math.max(.25,1.15-wave*.012)}move(dt);attack();for(const e of enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.phase+=dt*5;const dx=tower.x-e.x,dy=tower.y-e.y,dd=Math.hypot(dx,dy);if(dd<46){if(Math.random()<dt){tower.hp-=e.dmg;tower.flash=.08;shake=.08}continue}const sp=e.spd*(e.slow>0?.48:1),n=dd||1;e.x+=dx/n*sp*dt;e.y+=dy/n*sp*dt}
for(const d of drops){if(d.life<=0)continue;const dd=dist(hero,d);if(dd<pickupRadius){d.x+=(hero.x-d.x)*dt*5;d.y+=(hero.y-d.y)*dt*5}if(dist(hero,d)<18){d.life=0;if(d.type==='gold'){const v=Math.floor(12*(1+goldBonus));gold+=v;dmgText(hero.x,hero.y-25,'+'+v+'G','#ffd66b')}else{gainXP(20);dmgText(hero.x,hero.y-25,'+20 XP','#76b7ff')}}d.life-=dt}
for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt}particles=particles.filter(p=>p.life>0);for(const t of texts){t.y-=22*dt;t.life-=dt}texts=texts.filter(t=>t.life>0);enemies=enemies.filter(e=>!e.dead&&e.hp>0&&e.x>-50&&e.x<1010&&e.y>-50&&e.y<770);if(tower.hp<=0){tower.hp=0;gameOver();return}if(waveTime>28+(wave%10===0?8:0)&&enemies.length===0){wave++;waveTime=0;spawnTimer=1.2;tower.hp=Math.min(tower.maxHp,tower.hp+55);toast(wave%10===0?'보스 웨이브!':'웨이브 '+wave)}}
function drawSprite(name,x,y,s,flip=false,flash=false){const m=SPR[name];if(!m)return;const h=m.length,w=m[0].length,px=s;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);for(let r=0;r<h;r++){const row=m[r];for(let c=0;c<w;c++){const v=row[c];if(v==='.'||v==='0')continue;let col=PAL.outline;if(v==='1')col=PAL.outline;else if(v==='2')col=flash?'#ffffff':(name==='boss'?'#5a202f':name==='elite'?'#356f76':name==='tank'?'#596871':name==='runner'?'#9f6b27':'#71383c');else if(v==='3')col=flash?'#fff':PAL.skin;else if(v==='4')col=flash?'#fff':PAL.gold;else if(v==='5')col=flash?'#fff':PAL.steel2;pixelRect((c-w/2)*px,(r-h/2)*px,px,px,col)}}ctx.restore()}
function drawGround(){ctx.fillStyle='#0a1212';ctx.fillRect(0,0,VW,VH);for(let y=0;y<VH;y+=24)for(let x=0;x<VW;x+=24){const n=(x*13+y*7)%11;pixelRect(x,y,24,24,n<6?'#13201d':n<9?'#16241f':'#182820');if(n===1||n===8)pixelRect(x+5,y+7,2,2,'#294036');if(n===4)pixelRect(x+16,y+15,3,2,'#22372e')}
// stone paths
for(const g of gates){ctx.strokeStyle='#273630';ctx.lineWidth=46;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(tower.x,tower.y);ctx.stroke();ctx.strokeStyle='#1d2926';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(tower.x,tower.y);ctx.stroke()}
// outer ruins and trees
for(let i=0;i<24;i++){const x=(i*173)%900+30,y=(i*97)%620+45;if(Math.hypot(x-480,y-360)<245)continue;pixelRect(x,y,5,12,'#29473a');pixelRect(x-6,y-5,17,8,'#1d3b30');pixelRect(x-3,y-10,11,7,'#244c39')}}
function drawGate(g,i){const dx=g.x-tower.x,dy=g.y-tower.y,n=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx);ctx.save();ctx.translate(g.x,g.y);ctx.rotate(ang);pixelRect(-22,-24,44,48,'#10171b');pixelRect(-18,-20,36,40,'#596970');pixelRect(-13,-15,26,31,'#303f45');for(let k=-9;k<=9;k+=9)pixelRect(k,-14,3,25,'#74858a');pixelRect(-20,-27,40,6,'#172126');pixelRect(-16,-32,7,5,'#d2a34c');pixelRect(9,-32,7,5,'#d2a34c');ctx.restore()}
function drawCastle(){
 // shadow and moat
 ctx.strokeStyle='#0a1012';ctx.lineWidth=26;ctx.beginPath();ctx.arc(tower.x,tower.y,152,0,TAU);ctx.stroke();
 ctx.strokeStyle='#34545a';ctx.lineWidth=22;ctx.beginPath();ctx.arc(tower.x,tower.y,174,0,TAU);ctx.stroke();
 ctx.strokeStyle='#16272a';ctx.lineWidth=7;ctx.beginPath();ctx.arc(tower.x,tower.y,174,0,TAU);ctx.stroke();
 // eight wall segments
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=tower.x+Math.cos(a)*184,y=tower.y+Math.sin(a)*184;ctx.save();ctx.translate(x,y);ctx.rotate(a);pixelRect(-22,-15,44,30,'#4b5a5e');pixelRect(-17,-10,34,20,'#69777a');pixelRect(-12,-5,24,10,'#3b484d');ctx.restore()}
 // keep
 pixelRect(413,290,134,132,'#111a1e');pixelRect(423,280,114,142,'#4e5d62');pixelRect(433,292,94,116,'#69787b');pixelRect(445,306,70,102,'#35454a');
 // battlements
 for(let x=429;x<531;x+=17)pixelRect(x,273,10,18,'#7d8988');
 // roof
 pixelRect(441,256,78,17,'#26363b');pixelRect(450,247,60,10,'#405258');pixelRect(459,237,42,10,'#5d6b6d');
 // tower windows
 pixelRect(456,314,18,29,'#17262b');pixelRect(486,314,18,29,'#17262b');pixelRect(460,318,10,20,tower.flash>0?'#fff3a0':'#4fc6d6');pixelRect(490,318,10,20,tower.flash>0?'#fff3a0':'#4fc6d6');
 // central door / crystal
 pixelRect(454,352,52,56,'#10191d');pixelRect(462,360,36,48,'#1e5561');pixelRect(469,368,22,40,tower.flash>0?'#fff3a0':'#63dbe5');pixelRect(474,373,12,28,'#b6ffff');
 // flag
 pixelRect(478,220,4,28,'#8a9a9c');pixelRect(482,221,28,13,'#a9494b');pixelRect(482,224,20,7,'#df6c60');
 bar(390,205,180,13,tower.hp/tower.maxHp,'#11191c','#62d28a');text(480,190,'중앙 수호탑',16,'#edf5ef');
}
function drawHero(){const bob=Math.sin(anim*7)*1.5;drawSprite('hero',hero.x,hero.y+bob,3,hero.dir>Math.PI/2||hero.dir<-Math.PI/2,false);if(hero.skill<=0){ctx.strokeStyle='#5be0ef';ctx.lineWidth=2;ctx.beginPath();ctx.arc(hero.x,hero.y,25+Math.sin(anim*5)*2,0,TAU);ctx.stroke()}}
function draw(){ctx.clearRect(0,0,VW,VH);drawGround();for(let i=0;i<gates.length;i++)drawGate(gates[i],i);drawCastle();
 for(const e of enemies){if(e.dead)continue;const t=TYPES[e.type],sc=t.scale;const bob=Math.sin(e.phase)*1.2;drawSprite(t.color,e.x,e.y+bob,sc,e.x<tower.x,e.hit>0);const bw=e.type==='boss'?76:t.scale*16;bar(e.x-bw/2,e.y-t.scale*12-10,bw,6,e.hp/e.max,'#24191d',e.type==='boss'?'#d75b61':'#e36b64');if(e.type==='boss')text(e.x,e.y-58,'BOSS',11,'#ff8b8b')}
 drawHero();for(const d of drops){if(d.life<=0)continue;const c=d.type==='gold'?PAL.gold:PAL.cyan;pixelRect(d.x-7,d.y-7,14,14,'#0b1518');pixelRect(d.x-5,d.y-5,10,10,c);pixelRect(d.x-2,d.y-8,4,3,c);pixelRect(d.x-2,d.y-2,4,4,'#fff1a1')}
 for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);pixelRect(p.x,p.y,p.size,p.size,p.c);ctx.globalAlpha=1}for(const t of texts){ctx.globalAlpha=clamp(t.life/.7,0,1);text(t.x,t.y,t.s,13,t.c);ctx.globalAlpha=1}
 // HUD
 pixelRect(12,12,270,78,'#0a1317');pixelRect(12,12,270,3,'#d2a44d');text(26,31,'WAVE '+wave,18,'#f4d06f','left');text(26,57,'LV '+level+'  XP '+Math.floor(xp)+' / '+nextXp,12,'#b8ccc8','left');bar(26,70,235,7,xp/nextXp,'#1e2930','#6fa8ff');
 pixelRect(682,12,266,78,'#0a1317');text(704,31,'탑 HP  '+Math.ceil(tower.hp)+' / '+tower.maxHp,12,'#e0ece8','left');bar(704,44,220,9,tower.hp/tower.maxHp,'#292426','#63d18a');text(704,70,'G '+gold+'   처치 '+kills,12,'#ffd66b','left');
 if(hero.skill>0){pixelRect(396,104,168,28,'#0b171a');text(480,118,'전격 재사용  '+hero.skill.toFixed(1)+'초',12,'#70dff4')}else{text(480,118,'Q  전격 준비 완료',12,'#70dff4')}
 if(touch.active){ctx.strokeStyle='#69d7e4';ctx.lineWidth=2;ctx.strokeRect(touch.x-18,touch.y-18,36,36)}
 if(shake>0){shake=Math.max(0,shake-.016)}
}
function gameOver(){over=true;running=false;document.getElementById('gameover').classList.remove('hidden');document.getElementById('gameoverDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · 처치 ${kills}`}
function reset(){wave=1;waveTime=0;spawnTimer=1;gold=120;level=1;xp=0;nextXp=80;kills=0;over=false;paused=false;running=true;goldBonus=0;pickupRadius=55;Object.assign(tower,{hp:1000,flash:0});Object.assign(hero,{x:480,y:475,hp:260,maxHp:260,spd:210,damage:34,rate:.42,cool:0,skill:0,skillCd:7,skillPower:120,crit:.08,dir:0});enemies=[];drops=[];particles=[];texts=[];document.querySelectorAll('.overlay').forEach(e=>e.classList.add('hidden'));toast('중앙 수호탑을 지켜라!')}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;anim+=dt;update(dt);draw();requestAnimationFrame(loop)}
document.getElementById('startBtn').onclick=reset;document.getElementById('restartBtn').onclick=reset;document.getElementById('resumeBtn').onclick=()=>{paused=false;document.getElementById('pause').classList.add('hidden')};requestAnimationFrame(loop);
})();