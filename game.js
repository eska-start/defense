(()=>{
'use strict';
const canvas=document.createElement('canvas');canvas.id='gameCanvas';document.getElementById('canvas').replaceChildren(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const VW=960,VH=720,TAU=Math.PI*2;
let scale=1,ox=0,oy=0,last=0,running=false,paused=false,over=false,wave=0,waveTime=0,spawnTimer=0,kills=0,gold=120,level=1,xp=0,nextXp=80,shake=0,selectedUpgrade=null;
const tower={x:480,y:360,hp:1000,maxHp:1000,flash:0};
const hero={x:480,y:470,hp:260,maxHp:260,spd:210,damage:34,rate:.42,cool:0,skill:0,skillCd:7,skillPower:120,crit:.08,r:13,dir:0};
let enemies=[],drops=[],particles=[],texts=[],keys={},touch={x:0,y:0,active:false};
const upgrades=[
 ['⚔','날카로운 칼날','기본 공격력 +18',()=>hero.damage+=18],
 ['✦','광전사 회로','공격 속도 +22%',()=>hero.rate=Math.max(.16,hero.rate*.78)],
 ['♥','강화 갑옷','최대 HP +90 / HP 회복',()=>{hero.maxHp+=90;hero.hp=hero.maxHp}],
 ['➤','질주','이동 속도 +40',()=>hero.spd+=40],
 ['⚡','과부하 코어','전격 피해 +45% / 재사용 대기 -20%',()=>{hero.skillPower*=1.45;hero.skillCd*=.8}],
 ['◈','탐욕','획득 골드 +25%',()=>gold=Math.floor(gold*1.25)],
 ['◎','자력 코어','아이템 획득 범위 +55',()=>pickupRadius+=55],
 ['◆','급소','치명타 확률 +12%',()=>hero.crit+=.12]
];
let pickupRadius=55;
const TYPES={grunt:{hp:46,spd:48,dmg:8,gold:5,xp:10,size:11,color:'#9b5147'},runner:{hp:30,spd:86,dmg:6,gold:7,xp:13,size:9,color:'#d19b43'},tank:{hp:180,spd:27,dmg:18,gold:16,xp:27,size:16,color:'#65717c'},elite:{hp:340,spd:36,dmg:25,gold:32,xp:55,size:18,color:'#3c9290'},boss:{hp:1800,spd:20,dmg:45,gold:180,xp:300,size:31,color:'#9d4354'}};
const gates=[{x:480,y:55},{x:805,y:85},{x:900,y:360},{x:805,y:635},{x:480,y:665},{x:155,y:635},{x:60,y:360},{x:155,y:85}];
function resize(){const r=document.getElementById('canvas').getBoundingClientRect();scale=Math.min(r.width/VW,r.height/VH);canvas.width=VW;canvas.height=VH;canvas.style.width=VW*scale+'px';canvas.style.height=VH*scale+'px';canvas.style.left=(r.width-VW*scale)/2+'px';canvas.style.top=(r.height-VH*scale)/2+'px'}
addEventListener('resize',resize);resize();
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='q')useSkill();if(e.key.toLowerCase()==='escape'&&running&&!over){paused=!paused;document.getElementById('pause').classList.toggle('hidden',!paused)}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}}
canvas.addEventListener('pointerdown',e=>{const p=pointer(e);touch={x:p.x,y:p.y,active:true};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(touch.active){const p=pointer(e);touch.x=p.x;touch.y=p.y}});canvas.addEventListener('pointerup',()=>touch.active=false);
function rnd(a,b){return a+Math.random()*(b-a)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function choose(a){return a[(Math.random()*a.length)|0]}
function pixelRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(x,y,s,size=14,c='#fff',align='center'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle='#0b1015';ctx.fillText(s,Math.round(x+2),Math.round(y+2));ctx.fillStyle=c;ctx.fillText(s,Math.round(x),Math.round(y))}
function bar(x,y,w,h,p,bg,fg){pixelRect(x,y,w,h,bg);pixelRect(x+2,y+2,(w-4)*clamp(p,0,1),h-4,fg)}
function spawnParticle(x,y,c,n=8){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(20,100);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.25,.65),max:.65,c,size:Math.random()<.6?3:5})}}
function dmgText(x,y,s,c='#ffd66b'){texts.push({x,y,s,life:.7,c})}
function gainXP(v){xp+=v;while(xp>=nextXp){xp-=nextXp;level++;nextXp=Math.floor(nextXp*1.24);showUpgrade()}}
function showUpgrade(){paused=true;document.getElementById('upgrade').classList.remove('hidden');const box=document.getElementById('upgradeChoices');box.innerHTML='';const arr=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);arr.forEach(u=>{const b=document.createElement('button');b.className='upgradeChoice';b.innerHTML=`<span>${u[0]}</span><strong>${u[1]}</strong><small>${u[2]}</small>`;b.onclick=()=>{u[3]();paused=false;document.getElementById('upgrade').classList.add('hidden');toast(u[1]);};box.appendChild(b)})}
function toast(s){const e=document.getElementById('toast');e.textContent=s;e.classList.remove('show');void e.offsetWidth;e.classList.add('show')}
function spawnEnemy(){let type;if(wave%10===0&&enemies.filter(e=>!e.dead).length===0&&waveTime>2)type='boss';else{const r=Math.random();type=r<.12?'runner':r<.22?'tank':r<.28?'elite':'grunt'}const t=TYPES[type],g=choose(gates),ang=Math.atan2(tower.y-g.y,tower.x-g.x);const e={type,x:g.x+rnd(-12,12),y:g.y+rnd(-12,12),hp:t.hp*(1+wave*.07),max:t.hp*(1+wave*.07),spd:t.spd*(1+Math.min(.5,wave*.012)),dmg:t.dmg*(1+wave*.055),size:t.size,dead:false,hit:0,slow:0};enemies.push(e)}
function kill(e){if(e.dead)return;e.dead=true;kills++;const t=TYPES[e.type];gold+=Math.max(1,Math.floor(t.gold*(1+goldBonus)));gainXP(t.xp);if(Math.random()<.28||e.type==='boss')drops.push({x:e.x,y:e.y,type:Math.random()<.72?'gold':'orb',life:14});spawnParticle(e.x,e.y,e.type==='boss'?'#ff7b7b':'#f4c95d',12);dmgText(e.x,e.y-18,'+'+t.gold,'#ffd66b');if(e.type==='boss')toast('보스 처치!')}
let goldBonus=0;
function attack(){if(hero.cool>0)return;let target=null,md=999;for(const e of enemies){if(e.dead)continue;const dd=dist(hero,e);if(dd<135&&dd<md){md=dd;target=e}}if(!target)return;hero.cool=hero.rate;hero.dir=Math.atan2(target.y-hero.y,target.x-hero.x);const crit=Math.random()<hero.crit;const v=hero.damage*(crit?2:1);target.hp-=v;target.hit=.1;dmgText(target.x,target.y-18,(crit?'CRIT ':'')+Math.round(v),crit?'#fff1a1':'#ffffff');spawnParticle(target.x,target.y,crit?'#ffe16b':'#c9d5df',crit?7:4);if(target.hp<=0)kill(target)}
function useSkill(){if(!running||paused||over||hero.skill>0)return;hero.skill=hero.skillCd;const radius=155;let n=0;for(const e of enemies){if(e.dead)continue;if(dist(hero,e)<radius){const v=hero.skillPower*(1+level*.035);e.hp-=v;e.slow=.8;n++;dmgText(e.x,e.y-18,Math.round(v),'#73e6ff');if(e.hp<=0)kill(e)}}spawnParticle(hero.x,hero.y,'#67dff7',34);shake=.22;toast('전격 발동! '+n+'명 타격')}
function move(dt){let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if(touch.active){const tx=touch.x-hero.x,ty=touch.y-hero.y;if(Math.hypot(tx,ty)>16){const n=Math.hypot(tx,ty);dx=tx/n;dy=ty/n}}const n=Math.hypot(dx,dy)||1;if(dx||dy){hero.x+=dx/n*hero.spd*dt;hero.y+=dy/n*hero.spd*dt;hero.x=clamp(hero.x,35,925);hero.y=clamp(hero.y,35,685)}}
function update(dt){if(!running||paused||over)return;waveTime+=dt;spawnTimer-=dt;hero.cool=Math.max(0,hero.cool-dt);hero.skill=Math.max(0,hero.skill-dt);tower.flash=Math.max(0,tower.flash-dt);if(waveTime>3&&spawnTimer<=0&&enemies.filter(e=>!e.dead).length<Math.min(14+wave*2,42)){spawnEnemy();spawnTimer=Math.max(.25,1.15-wave*.012)}move(dt);attack();for(const e of enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);const dx=tower.x-e.x,dy=tower.y-e.y,dd=Math.hypot(dx,dy);if(dd<42){e.hit=0;if(Math.random()<dt){tower.hp-=e.dmg;tower.flash=.08;shake=.08}continue}const sp=e.spd*(e.slow>0?.48:1),n=dd||1;e.x+=dx/n*sp*dt;e.y+=dy/n*sp*dt}
for(const d of drops){if(d.life<=0)continue;const dd=dist(hero,d);if(dd<pickupRadius){d.x+=(hero.x-d.x)*dt*5;d.y+=(hero.y-d.y)*dt*5}if(dist(hero,d)<18){d.life=0;if(d.type==='gold'){gold+=Math.floor(12*(1+goldBonus));dmgText(hero.x,hero.y-22,'+12G','#ffd66b')}else{gainXP(20);dmgText(hero.x,hero.y-22,'+20 XP','#76b7ff')}}d.life-=dt}
for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt}particles=particles.filter(p=>p.life>0);for(const t of texts){t.y-=22*dt;t.life-=dt}texts=texts.filter(t=>t.life>0);enemies=enemies.filter(e=>!e.dead&&e.hp>0&&e.x>-40&&e.x<1000&&e.y>-40&&e.y<760);if(tower.hp<=0){tower.hp=0;gameOver();return}if(waveTime>28+(wave%10===0?8:0)&&enemies.length===0){wave++;waveTime=0;spawnTimer=1.2;tower.hp=Math.min(tower.maxHp,tower.hp+45);toast(wave%10===0?'보스 웨이브!':'웨이브 '+wave)}}
function drawPixelCharacter(x,y,type,size,color,flash=false){if(flash)color='#fff';const s=size;pixelRect(x-s*.55,y-s*.8,s*1.1,s*1.5,color);pixelRect(x-s*.7,y-s*.1,s*.28,s*.72,color);pixelRect(x+s*.42,y-s*.1,s*.28,s*.72,color);pixelRect(x-s*.35,y-s*1.18,s*.7,s*.48,type==='boss'?'#d98678':'#e0b078');pixelRect(x-s*.28,y-s*1.04,s*.12,s*.12,'#1a2229');pixelRect(x+s*.16,y-s*1.04,s*.12,s*.12,'#1a2229');pixelRect(x-s*.4,y+s*.65,s*.27,s*.5,'#252e36');pixelRect(x+s*.13,y+s*.65,s*.27,s*.5,'#252e36')}
function draw(){ctx.clearRect(0,0,VW,VH);ctx.fillStyle='#091015';ctx.fillRect(0,0,VW,VH);for(let x=0;x<VW;x+=32)for(let y=0;y<VH;y+=32){ctx.fillStyle=((x/32+y/32)%2?'#101b1b':'#0e1918');ctx.fillRect(x,y,32,32)}for(let i=0;i<90;i++){const x=(i*137)%VW,y=(i*83)%VH;pixelRect(x,y,2,2,i%3?'#1d3430':'#28433b')}
// central defensive ring
ctx.strokeStyle='#293e38';ctx.lineWidth=3;ctx.beginPath();ctx.arc(tower.x,tower.y,190,0,TAU);ctx.stroke();ctx.strokeStyle='#182923';ctx.lineWidth=10;ctx.beginPath();ctx.arc(tower.x,tower.y,218,0,TAU);ctx.stroke();
// lanes and gates
for(const g of gates){ctx.strokeStyle='#263a35';ctx.lineWidth=28;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(tower.x,tower.y);ctx.stroke();pixelRect(g.x-12,g.y-12,24,24,'#5a3d3d');pixelRect(g.x-7,g.y-7,14,14,'#a04b4b')}
// tower
pixelRect(408,303,144,114,'#17242b');pixelRect(420,290,120,130,'#30404a');pixelRect(434,270,92,32,'#52616b');pixelRect(448,250,64,20,'#3d4d57');pixelRect(446,330,68,58,'#10181d');pixelRect(460,344,40,44,'#2d6571');pixelRect(470,354,20,34,tower.flash>0?'#fff0a0':'#70d8e8');pixelRect(438,392,84,16,'#65737c');bar(405,230,150,12,tower.hp/tower.maxHp,'#202a31','#65d18c');text(480,216,'중앙 수호탑',15,'#dce9ed');
for(const e of enemies){const t=TYPES[e.type];drawPixelCharacter(e.x,e.y,e.type,e.size,t.color,e.hit>0);bar(e.x-t.size,e.y-t.size*1.8,e.size*2,5,e.hp/e.max,'#241a1e','#e36b64');if(e.type==='boss')text(e.x,e.y-t.size*2.2,'BOSS',11,'#ff8b8b')}
// hero
ctx.save();ctx.translate(hero.x,hero.y);ctx.rotate(hero.dir);pixelRect(-11,-13,22,27,'#315a74');pixelRect(-7,-21,14,11,'#e0b27a');pixelRect(-5,-19,3,3,'#20252a');pixelRect(2,-19,3,3,'#20252a');pixelRect(-16,-4,6,17,'#d8a66f');pixelRect(10,-4,6,17,'#d8a66f');pixelRect(11,-2,22,4,'#d9e4eb');pixelRect(29,-3,5,6,'#ffd16b');pixelRect(-8,13,7,12,'#202c34');pixelRect(2,13,7,12,'#202c34');ctx.restore();
for(const d of drops){if(d.life<=0)continue;const c=d.type==='gold'?'#ffd05a':'#70b7ff';pixelRect(d.x-5,d.y-5,10,10,c);pixelRect(d.x-2,d.y-8,4,3,c)}
for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);pixelRect(p.x,p.y,p.size,p.size,p.c);ctx.globalAlpha=1}for(const t of texts){ctx.globalAlpha=clamp(t.life/.7,0,1);text(t.x,t.y,t.s,13,t.c);ctx.globalAlpha=1}
// top hud
pixelRect(12,12,250,72,'#0b141a');pixelRect(12,12,250,2,'#6b8990');text(26,29,'WAVE '+wave,17,'#f4d06f','left');text(26,54,'LV '+level+'  XP '+Math.floor(xp)+'/'+nextXp,12,'#a8c5d4','left');bar(26,66,220,7,xp/nextXp,'#1e2930','#6fa8ff');pixelRect(700,12,248,72,'#0b141a');text(722,29,'탑 HP '+Math.ceil(tower.hp)+' / '+tower.maxHp,12,'#d6e3e7','left');bar(722,42,205,8,tower.hp/tower.maxHp,'#2a2528','#63d18a');text(722,68,'G '+gold+'   처치 '+kills,12,'#ffd66b','left');if(hero.skill>0)text(480,112,'전격 '+hero.skill.toFixed(1)+'초',13,'#70dff4');else text(480,112,'Q  전격 준비 완료',13,'#70dff4');if(touch.active){ctx.strokeStyle='#5aa6b8';ctx.lineWidth=2;ctx.strokeRect(touch.x-18,touch.y-18,36,36)}if(shake>0){shake=Math.max(0,shake-.016)} }
function gameOver(){over=true;running=false;document.getElementById('gameover').classList.remove('hidden');document.getElementById('gameoverDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · 처치 ${kills}`}
function reset(){wave=1;waveTime=0;spawnTimer=1;gold=120;level=1;xp=0;nextXp=80;kills=0;over=false;paused=false;running=true;Object.assign(tower,{hp:1000,flash:0});Object.assign(hero,{x:480,y:470,hp:260,maxHp:260,spd:210,damage:34,rate:.42,cool:0,skill:0,skillCd:7,skillPower:120,crit:.08,dir:0});goldBonus=0;pickupRadius=55;enemies=[];drops=[];particles=[];texts=[];document.querySelectorAll('.overlay').forEach(e=>e.classList.add('hidden'));toast('중앙 수호탑을 지켜라!')}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
document.getElementById('startBtn').onclick=reset;document.getElementById('restartBtn').onclick=reset;document.getElementById('resumeBtn').onclick=()=>{paused=false;document.getElementById('pause').classList.add('hidden')};
requestAnimationFrame(loop);
})();