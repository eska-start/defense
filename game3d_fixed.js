import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = document.getElementById('canvas');
const ui = id => document.getElementById(id);
const show = id => ui(id).classList.remove('hidden');
const hide = id => ui(id).classList.add('hidden');
const hideAll = () => ['start','heroSelect','levelUp','shop','pause','gameover'].forEach(hide);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.domElement.id = 'gameCanvas';
root.replaceChildren(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111914);
scene.fog = new THREE.Fog(0x111914, 30, 54);

const camera = new THREE.OrthographicCamera(-14,14,10,-10,0.1,100);
camera.position.set(15,19,15);
camera.lookAt(0,0,0);

scene.add(new THREE.HemisphereLight(0xcfe7d8, 0x172019, 2.0));
const sun = new THREE.DirectionalLight(0xffe4b0, 2.2);
sun.position.set(8,22,10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(36,36),
  new THREE.MeshStandardMaterial({ color:0x2a4030, roughness:1 })
);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

const arena = new THREE.Mesh(
  new THREE.CircleGeometry(8.7,32),
  new THREE.MeshStandardMaterial({ color:0x38533d, roughness:1 })
);
arena.rotation.x = -Math.PI/2;
arena.position.y = 0.02;
scene.add(arena);

for (let i=-18;i<=18;i++) {
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,36), new THREE.MeshBasicMaterial({color:0x344b39}));
  a.position.set(i,0.025,0);
  scene.add(a);
  const b = new THREE.Mesh(new THREE.BoxGeometry(36,0.02,0.08), new THREE.MeshBasicMaterial({color:0x344b39}));
  b.position.set(0,0.025,i);
  scene.add(b);
}

function mat(color, emissive=0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness:0.85, emissive, emissiveIntensity: emissive ? 1.3 : 0 });
}
function addBox(pos,size,color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}
function addCylinder(pos,r,h,color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10), mat(color));
  m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}

// Central castle / objective
addBox([0,1.5,0],[5.6,3.0,5.0],0x687d69);
for (const p of [[-3.0,2.1,-2.4],[3.0,2.1,-2.4],[-3.0,2.1,2.4],[3.0,2.1,2.4]]) addCylinder(p,0.72,4.2,0x778e78);
addBox([0,1.15,2.72],[1.5,2.3,0.7],0x412d24);
const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4,2.0,4),mat(0x875947));
roof.position.set(0,3.95,0); roof.rotation.y=Math.PI/4; roof.castShadow=true; scene.add(roof);
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55),mat(0x59d8d0,0x144d4a));
crystal.position.set(0,3.0,2.95); scene.add(crystal);

const gates = [
  new THREE.Vector3(0,0,-15),
  new THREE.Vector3(15,0,0),
  new THREE.Vector3(0,0,15),
  new THREE.Vector3(-15,0,0)
];
const gateNames = ['북','동','남','서'];
for (const g of gates) {
  addBox([g.x,g.y+0.45,g.z],[2.5,0.9,1.0],0x5e755f);
}

const modelURLs = {
  warrior:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Knight.glb',
  mage:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Mage.glb',
  grunt:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Minion.glb',
  runner:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Rogue.glb',
  caster:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Mage.glb',
  tank:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Shield_Large_A.gltf'
};
const loader = new GLTFLoader();
const modelCache = new Map();

function loadModel(key) {
  if (!modelCache.has(key)) {
    modelCache.set(key, new Promise((resolve,reject)=>loader.load(modelURLs[key],g=>resolve(g.scene),undefined,reject)));
  }
  return modelCache.get(key);
}

function placeholder(color, height=1.5) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42,0.8,4,8),mat(color));
  body.position.y = height*0.5;
  body.castShadow=true;
  g.add(body);
  return g;
}
function cloneNormalized(source,height) {
  const o = source.clone(true);
  const box = new THREE.Box3().setFromObject(o);
  const h = Math.max(0.01,box.max.y-box.min.y);
  const s = height/h;
  o.scale.setScalar(s);
  const bb = new THREE.Box3().setFromObject(o);
  o.position.y -= bb.min.y;
  o.traverse(n=>{ if(n.isMesh){n.castShadow=true;n.receiveShadow=true;} });
  return o;
}

const HERO = {
  warrior:{name:'전사',hp:600,speed:6.0,damage:58,range:2.6,rate:0.34,skill:7,color:0xc17d3f,model:'warrior'},
  mage:{name:'마법사',hp:380,speed:5.2,damage:74,range:5.2,rate:0.55,skill:6,color:0x5d9bd7,model:'mage'},
  ranger:{name:'궁수',hp:430,speed:6.8,damage:48,range:6.6,rate:0.23,skill:8,color:0x6eaa72,model:'warrior'}
};
const ENEMY = {
  grunt:{hp:72,speed:1.55,dmg:8,gold:8,xp:10,height:1.25,color:0x98725c,model:'grunt'},
  runner:{hp:50,speed:2.95,dmg:6,gold:10,xp:14,height:1.15,color:0xb4a256,model:'runner'},
  tank:{hp:250,speed:0.92,dmg:22,gold:28,xp:34,height:1.8,color:0x718469,model:'tank'},
  caster:{hp:125,speed:1.25,dmg:16,gold:26,xp:30,height:1.4,color:0x8062a5,model:'caster'},
  boss:{hp:3400,speed:0.66,dmg:65,gold:520,xp:450,height:3.3,color:0xb9424b,model:'tank'}
};

const hero = { type:'warrior', pos:new THREE.Vector3(0,0,7), hp:600,maxHp:600,speed:6,damage:58,range:2.6,rate:0.34,attack:0,skill:0,crit:0.08,power:1,lifesteal:0,obj:null };
const tower = {hp:3400,maxHp:3400,armor:0};
let state='menu', wave=1, side=0, spawned=0, spawnClock=0.5, gold=500, xp=0, level=1, nextXP=100;
const keys = new Set();
const enemies = [];
const projectiles = [];
const effects = [];
const upgrades = [
  ['공격력 +22',()=>hero.damage+=22],
  ['최대 HP +120',()=>{hero.maxHp+=120;hero.hp+=120}],
  ['이동속도 +0.35',()=>hero.speed+=0.35],
  ['치명타 +5%',()=>hero.crit+=0.05]
];
const books = {str:0,agi:0,int:0};
const items = [
  ['강철검','공격력 +35',180,()=>hero.damage+=35],
  ['질주화','이동속도 +0.9',220,()=>hero.speed+=0.9],
  ['수호갑옷','최대 HP +180',260,()=>{hero.maxHp+=180;hero.hp+=180}],
  ['흡혈부적','타격 회복 +3',320,()=>hero.lifesteal+=3],
  ['마력핵','스킬 피해 +60%',360,()=>hero.power+=0.6],
  ['용사의 반지','공격력 +20 · 치명 +8%',420,()=>{hero.damage+=20;hero.crit+=0.08}]
];

function enemyTotal(){return 7+wave*2+Math.floor(wave/3);}
function notify(text){
  const n=ui('notice'); n.textContent=text; n.classList.add('show');
  clearTimeout(window.__noticeTimer); window.__noticeTimer=setTimeout(()=>n.classList.remove('show'),1200);
}
function barFor(e){
  const group=new THREE.Group();
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.15,0.12),new THREE.MeshBasicMaterial({color:0x281516}));
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(1.10,0.08),new THREE.MeshBasicMaterial({color:0x63d579}));
  fg.position.z=0.02; group.add(bg,fg);
  group.position.y=e.kind==='boss'?3.5:2.0; group.rotation.x=-0.35; group.userData.fg=fg;
  e.obj.add(group); e.bar=group;
}

function makeHeroObject() {
  if (hero.obj) { scene.remove(hero.obj); hero.obj=null; }
  const d=HERO[hero.type];
  const p=hero.pos.clone();
  loadModel(d.model).then(src=>{
    if(hero.type!==hero.type) return;
    if (hero.obj) scene.remove(hero.obj);
    hero.obj=cloneNormalized(src,2.35); hero.obj.position.copy(p); scene.add(hero.obj);
  }).catch(()=>{
    if(hero.obj) return;
    hero.obj=placeholder(d.color,2.0); hero.obj.position.copy(p); scene.add(hero.obj);
  });
  hero.obj=hero.obj||placeholder(d.color,2.0);
  hero.obj.position.copy(p);
  if(!hero.obj.parent) scene.add(hero.obj);
}

function resetRun() {
  wave=1; side=0; spawned=0; spawnClock=0.5; gold=500; xp=0; level=1; nextXP=100;
  tower.hp=tower.maxHp;
  enemies.splice(0).forEach(e=>e.obj&&scene.remove(e.obj));
  projectiles.splice(0).forEach(p=>p.obj&&scene.remove(p.obj));
  effects.splice(0).forEach(f=>f.obj&&scene.remove(f.obj));
  hero.pos.set(0,0,7);
  const d=HERO[hero.type];
  Object.assign(hero,{hp:d.hp,maxHp:d.hp,speed:d.speed,damage:d.damage,range:d.range,rate:d.rate,attack:0,skill:0,crit:hero.type==='ranger'?0.16:0.08,power:1,lifesteal:0});
  makeHeroObject();
  books.str=books.agi=books.int=0;
  notify('웨이브 1 · 북쪽 적습');
  syncHud();
}

function beginHero(type) {
  hero.type=type;
  resetRun();
  hideAll();
  state='play';
}

function spawnEnemy() {
  if (spawned>=enemyTotal()) return;
  let kind='grunt',r=Math.random();
  if (wave%5===0 && spawned===enemyTotal()-1) kind='boss';
  else if(r<0.15) kind='runner';
  else if(r<0.30) kind='tank';
  else if(r<0.42) kind='caster';
  const d=ENEMY[kind];
  const g=gates[side];
  const e={kind,pos:new THREE.Vector3(g.x+(Math.random()-0.5)*1.5,0,g.z+(Math.random()-0.5)*1.5),hp:d.hp*(1+wave*0.13),maxHp:d.hp*(1+wave*0.13),speed:d.speed*(1+wave*0.008),dmg:d.dmg*(1+wave*0.05),gold:d.gold,xp:d.xp,obj:null,bar:null,dead:false,bob:Math.random()*Math.PI*2};
  e.obj=placeholder(d.color,d.height); e.obj.position.copy(e.pos); scene.add(e.obj); barFor(e);
  enemies.push(e); spawned++;
  loadModel(d.model).then(src=>{
    if(e.dead) return;
    const old=e.obj, obj=cloneNormalized(src,d.height); obj.position.copy(e.pos); scene.add(obj); e.obj=obj; barFor(e); scene.remove(old);
  }).catch(()=>{});
}

function killEnemy(e) {
  if(e.dead) return;
  e.dead=true; gold+=e.gold; gainXP(e.xp); spawnBurst(e.pos,e.kind==='boss'?0xeac05d:0xdce7dc,e.kind==='boss'?28:8);
}
function gainXP(v) {
  xp+=v;
  if(xp>=nextXP){
    xp-=nextXP; level++; nextXP=Math.floor(nextXP*1.28); openLevel();
  }
}
function openLevel() {
  state='level'; const box=ui('levelChoices'); box.replaceChildren();
  upgrades.slice().sort(()=>Math.random()-0.5).slice(0,3).forEach(a=>{
    const b=document.createElement('button'); b.className='upgradeChoice'; b.innerHTML='<b>▣</b><span>'+a[0]+'</span>';
    b.onclick=()=>{a[1]();hide('levelUp');state='play';notify('레벨 '+level);syncHud();}; box.appendChild(b);
  }); show('levelUp');
}
function hit(e,dmg){if(e.dead)return;e.hp-=dmg;if(e.hp<=0)killEnemy(e);}
function attack() {
  if(hero.attack>0) return;
  let target=null,best=hero.range;
  for(const e of enemies) if(!e.dead){const d=hero.pos.distanceTo(e.pos);if(d<best){best=d;target=e;}}
  if(!target)return;
  hero.attack=hero.rate;
  const dmg=hero.damage*(Math.random()<hero.crit?2:1);
  if(hero.type==='warrior') hit(target,dmg); else {
    const obj=new THREE.Mesh(new THREE.SphereGeometry(0.11,6,6),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x68dff0:0xf0d46d}));
    obj.position.copy(hero.pos); scene.add(obj); projectiles.push({obj,target,dmg});
  }
  if(hero.lifesteal) hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
}
function skill() {
  if(state!=='play'||hero.skill>0)return;
  hero.skill=HERO[hero.type].skill;
  const radius=hero.type==='warrior'?4.2:5.8;
  const mult=(hero.type==='warrior'?6:hero.type==='mage'?5:4)*hero.power;
  for(const e of enemies) if(!e.dead && hero.pos.distanceTo(e.pos)<radius) hit(e,hero.damage*mult);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.5,radius,40),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x68d9ef:hero.type==='ranger'?0x87d670:0xf0b94c,transparent:true,opacity:0.85,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(hero.pos.x,0.06,hero.pos.z); scene.add(ring); effects.push({obj:ring,life:0.45,max:0.45}); notify('필살기 발동');
}
function move(dt) {
  let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  let z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if(!x&&!z)return;
  const v=new THREE.Vector3(x,0,z).normalize().multiplyScalar(hero.speed*dt); hero.pos.add(v);
  hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-13.2,13.2); hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-13.2,13.2);
  if(hero.obj){hero.obj.position.copy(hero.pos);hero.obj.rotation.y=Math.atan2(v.x,v.z);}
}
function update(dt) {
  if(state!=='play') return;
  hero.attack=Math.max(0,hero.attack-dt); hero.skill=Math.max(0,hero.skill-dt);
  move(dt); attack();
  spawnClock-=dt; if(spawnClock<=0){spawnClock=Math.max(0.28,0.62-wave*0.008);spawnEnemy();}
  for(const p of projectiles){
    if(!p.target||p.target.dead){p.obj.visible=false;continue;}
    const to=new THREE.Vector3(p.target.pos.x,0.8,p.target.pos.z); p.obj.position.lerp(to,Math.min(1,dt*16));
    if(p.obj.position.distanceTo(to)<0.22){hit(p.target,p.dmg);p.obj.visible=false;}
  }
  for(let i=projectiles.length-1;i>=0;i--) if(!projectiles[i].obj.visible){scene.remove(projectiles[i].obj);projectiles.splice(i,1);}
  let alive=0;
  for(const e of enemies) if(!e.dead){
    alive++; const dir=new THREE.Vector3(-e.pos.x,0,-e.pos.z); const dist=dir.length();
    if(dist<2.65) tower.hp-=e.dmg*dt; else {dir.normalize();e.pos.addScaledVector(dir,e.speed*dt);}
    if(e.obj){e.obj.position.copy(e.pos);e.obj.position.y += Math.sin(performance.now()*0.006+e.bob)*0.035;}
    if(e.bar){e.bar.position.y=e.kind==='boss'?3.5:2.0;e.bar.userData.fg.scale.x=Math.max(0.02,e.hp/e.max);}
  }
  for(const f of effects){f.life-=dt;f.obj.scale.setScalar(1+(f.max-f.life)*1.8);}
  for(let i=effects.length-1;i>=0;i--) if(effects[i].life<=0){scene.remove(effects[i].obj);effects.splice(i,1);}
  for(let i=enemies.length-1;i>=0;i--) if(enemies[i].dead){scene.remove(enemies[i].obj);enemies.splice(i,1);}
  if(spawned>=enemyTotal()&&alive===0){
    side=(side+1)%4; spawned=0; spawnClock=0.5;
    if(side===0){wave++;gold+=100;tower.hp=Math.min(tower.maxHp,tower.hp+160);notify('웨이브 '+wave+' 시작');}
    else notify(gateNames[side]+' 방향 적습');
  }
  if(tower.hp<=0){tower.hp=0;state='over';ui('overDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · ${gold} G · ${HERO[hero.type].name}`;show('gameover');}
  syncHud();
}
function spawnBurst(pos,color,n){
  for(let i=0;i<n;i++){
    const o=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.08),new THREE.MeshBasicMaterial({color}));
    o.position.set(pos.x,pos.y+0.5,pos.z); scene.add(o);
    effects.push({obj:o,life:0.45,max:0.45,v:new THREE.Vector3((Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5)});
  }
}
function updateFX(dt){for(const f of effects)if(f.v){f.obj.position.addScaledVector(f.v,dt);f.v.multiplyScalar(0.91);}}

let shopState=false;
function toggleShop(){
  if(state==='menu'||state==='over'||state==='level')return;
  shopState=!shopState; state=shopState?'shop':'play'; ui('shop').classList.toggle('hidden',!shopState); if(shopState)renderShop();
}
function renderShop(){
  ui('shopGold').textContent=gold+' G'; const box=ui('shopItems'); box.replaceChildren();
  items.forEach((a,i)=>{const b=document.createElement('button');b.className='shopItem';b.innerHTML=`<strong>${a[0]}</strong><span>${a[1]}</span><em>${a[2]} G</em>`;b.onclick=()=>{if(gold<a[2])return;gold-=a[2];a[3]();renderShop();syncHud();};box.appendChild(b);});
  const bb=ui('bookLine');bb.replaceChildren();[['str','힘 +8 공격','damage',8],['agi','민첩 +0.3 속도','speed',0.3],['int','지능 +8% 스킬','power',0.08]].forEach(a=>{const b=document.createElement('button');b.className='bookBtn';const cost=100+books[a[0]]*50;b.textContent=a[1]+' · '+cost+'G';b.onclick=()=>{if(gold<cost)return;gold-=cost;books[a[0]]++;hero[a[2]]+=a[3];renderShop();};bb.appendChild(b);});
}
function syncHud(){
  ui('wave').textContent='WAVE '+wave; ui('direction').textContent=gateNames[side]+' 방향'; ui('waveCount').textContent=spawned+' / '+enemyTotal(); ui('heroName').textContent=HERO[hero.type].name; ui('level').textContent='LV '+level; ui('xp').textContent=xp+' / '+nextXP; ui('gold').textContent=gold+' G';
  ui('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp; ui('heroHpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp; ui('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%'; ui('heroBar').style.width=Math.max(0,hero.hp/hero.maxHp*100)+'%'; ui('skillText').textContent=hero.skill>0?hero.skill.toFixed(1)+'s':'READY';
}

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(); keys.add(k);
  if(k==='q')skill();
  if(k==='i')toggleShop();
  if(k==='escape'){
    if(state==='play'){state='pause';show('pause');}
    else if(state==='pause'){state='play';hide('pause');}
    else if(state==='shop')toggleShop();
  }
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
ui('startBtn').onclick=()=>{hide('start');show('heroSelect');};
ui('warriorBtn').onclick=()=>beginHero('warrior');
ui('mageBtn').onclick=()=>beginHero('mage');
ui('rangerBtn').onclick=()=>beginHero('ranger');
ui('shopClose').onclick=toggleShop;
ui('resumeBtn').onclick=()=>{state='play';hide('pause');};
ui('restartBtn').onclick=()=>{state='menu';hideAll();show('start');};

function resize(){
  renderer.setSize(innerWidth,innerHeight,false);
  const aspect=Math.max(0.5,innerWidth/innerHeight); const h=10,w=h*aspect;
  camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize); resize(); syncHud();

// Preload common assets without blocking gameplay.
for(const k of ['warrior','mage','grunt','runner','caster','tank']) loadModel(k).catch(()=>{});

let last=performance.now();
function animate(now){
  const dt=Math.min(0.033,Math.max(0,(now-last)/1000)); last=now;
  update(dt); updateFX(dt); crystal.rotation.y+=dt*1.2; crystal.position.y=3+Math.sin(now*0.003)*0.08;
  renderer.render(scene,camera); requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
