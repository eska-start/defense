import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const root = document.getElementById('canvas');
const $ = id => document.getElementById(id);
const show = id => $(id)?.classList.remove('hidden');
const hide = id => $(id)?.classList.add('hidden');
const hideOverlays = () => ['start','heroSelect','levelUp','shop','pause','gameover'].forEach(hide);

const renderer = new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.25));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.domElement.id = 'gameCanvas';
root.replaceChildren(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121a15);
scene.fog = new THREE.Fog(0x121a15,34,62);
const camera = new THREE.OrthographicCamera(-14,14,10,-10,0.1,100);
camera.position.set(15,19,15);
camera.lookAt(0,0,0);

scene.add(new THREE.HemisphereLight(0xd6e8dc,0x182019,2.0));
const sun = new THREE.DirectionalLight(0xffe6b8,2.25);
sun.position.set(9,22,7); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-25; sun.shadow.camera.right=25;
sun.shadow.camera.top=25; sun.shadow.camera.bottom=-25;
scene.add(sun);

const mat = (color, emissive=0x000000) => new THREE.MeshStandardMaterial({color,roughness:.88,emissive,emissiveIntensity:emissive?1.2:0});
const addBox = (x,y,z,sx,sy,sz,color) => {const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
const addCyl = (x,y,z,r,h,color) => {const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};

// Clean ground: intentionally no GridHelper or hand-drawn grid lines.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(38,38),mat(0x2b4030));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const arena = new THREE.Mesh(new THREE.CircleGeometry(9.2,40),mat(0x38523d));
arena.rotation.x=-Math.PI/2;arena.position.y=.015;scene.add(arena);
// Four broad attack lanes, no visible grid.
addBox(0,.035,-8.6,4.0,.06,14.0,0x304938);
addBox(8.6,.04,0,14.0,.07,4.0,0x304938);
addBox(0,.045,8.6,4.0,.08,14.0,0x304938);
addBox(-8.6,.04,0,14.0,.07,4.0,0x304938);

// Central keep.
addBox(0,1.35,0,5.8,2.7,5.0,0x667a67);
for(const [x,z] of [[-3.1,-2.4],[3.1,-2.4],[-3.1,2.4],[3.1,2.4]]) addCyl(x,2.0,z,.72,4.1,0x758a74);
addBox(0,1.15,2.75,1.55,2.3,.7,0x412d25);
const roof=new THREE.Mesh(new THREE.ConeGeometry(3.5,2.0,4),mat(0x855845));roof.position.set(0,3.9,0);roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);
const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.58),mat(0x55d8d0,0x154946));crystal.position.set(0,3.0,2.98);scene.add(crystal);
const towerRing=new THREE.Mesh(new THREE.RingGeometry(3.3,3.7,40),new THREE.MeshBasicMaterial({color:0xcda95d,transparent:true,opacity:.55,side:THREE.DoubleSide}));towerRing.rotation.x=-Math.PI/2;towerRing.position.y=.065;scene.add(towerRing);

const gates=[new THREE.Vector3(0,0,-15),new THREE.Vector3(15,0,0),new THREE.Vector3(0,0,15),new THREE.Vector3(-15,0,0)];
const gateNames=['북','동','남','서'];
for(const g of gates){addBox(g.x,.45,g.z,2.7,.9,1.2,0x5c725d);addCyl(g.x-.95,1.3,g.z,.22,1.7,0x7f987f);addCyl(g.x+.95,1.3,g.z,.22,1.7,0x7f987f);}

const modelURLs={
  warrior:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Knight.glb',
  mage:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Mage.glb',
  ranger:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Rogue.glb',
  grunt:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Minion.glb',
  runner:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Rogue.glb',
  caster:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Mage.glb',
  tank:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Shield_Large_A.gltf'
};
const loader=new GLTFLoader();
const modelCache=new Map();

async function loadModel(key){
  if(modelCache.has(key)) return modelCache.get(key);
  const promise=loader.loadAsync(modelURLs[key]).then(g=>g);
  modelCache.set(key,promise);
  return promise;
}
function fitModel(source,height){
  const o=SkeletonUtils.clone(source.scene);
  const box=new THREE.Box3().setFromObject(o);
  const h=Math.max(.01,box.max.y-box.min.y);
  o.scale.setScalar(height/h);
  const b2=new THREE.Box3().setFromObject(o);
  o.position.y-=b2.min.y;
  o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  return o;
}
function placeholder(color,height=1.5){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.8,4,8),mat(color));
  body.position.y=height*.5;body.castShadow=true;g.add(body);
  return g;
}
function makeBow(){
  const g=new THREE.Group();
  const wood=mat(0x8c5733);
  const curve=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,6,14,Math.PI*1.35),wood);
  curve.rotation.z=Math.PI/2;curve.scale.set(1,1.25,1);g.add(curve);
  const string=new THREE.Mesh(new THREE.BoxGeometry(.035,1.35,.035),new THREE.MeshBasicMaterial({color:0xd7c9a3}));
  string.position.x=.02;g.add(string);
  g.rotation.set(0,0,0);g.position.set(.5,1.0,.15);return g;
}

const HERO={
  warrior:{name:'전사',hp:600,speed:6.0,damage:58,range:2.8,rate:.42,skill:7,color:0xc17d3f,model:'warrior'},
  mage:{name:'마법사',hp:380,speed:5.3,damage:72,range:5.6,rate:.50,skill:6,color:0x5d9bd7,model:'mage'},
  ranger:{name:'궁수',hp:430,speed:6.7,damage:52,range:6.6,rate:.36,skill:8,color:0x6eaa72,model:'ranger'}
};
const ENEMY={
  grunt:{hp:72,speed:1.55,dmg:8,gold:8,xp:10,height:1.25,color:0x98725c,model:'grunt'},
  runner:{hp:50,speed:2.95,dmg:6,gold:10,xp:14,height:1.15,color:0xb4a256,model:'runner'},
  tank:{hp:250,speed:.92,dmg:22,gold:28,xp:34,height:1.8,color:0x718469,model:'tank'},
  caster:{hp:125,speed:1.25,dmg:16,gold:26,xp:30,height:1.4,color:0x8062a5,model:'caster'},
  boss:{hp:3400,speed:.66,dmg:65,gold:520,xp:450,height:3.3,color:0xb9424b,model:'tank'}
};

const hero={type:'warrior',pos:new THREE.Vector3(0,0,7),hp:600,maxHp:600,speed:6,damage:58,range:2.8,rate:.42,attack:0,skill:0,crit:.08,power:1,lifesteal:0,obj:null,mixer:null,token:0};
const tower={hp:3400,maxHp:3400,armor:0};
const enemies=[];const projectiles=[];const effects=[];const mixers=[];
const keys=new Set();
let state='menu',wave=1,side=0,spawned=0,spawnClock=.5,gold=500,xp=0,level=1,nextXP=100;
const books={str:0,agi:0,int:0};let inventory=[];
const items=[
  ['강철검','공격력 +35',180,()=>hero.damage+=35],
  ['질주화','이동속도 +0.9',220,()=>hero.speed+=.9],
  ['수호갑옷','최대 HP +180',260,()=>{hero.maxHp+=180;hero.hp+=180}],
  ['흡혈부적','타격 회복 +3',320,()=>hero.lifesteal+=3],
  ['마력핵','스킬 피해 +60%',360,()=>hero.power+=.6],
  ['용사의 반지','공격력 +20 · 치명 +8%',420,()=>{hero.damage+=20;hero.crit+=.08}]
];
const upgrades=[
  ['공격력 +22',()=>hero.damage+=22],
  ['최대 HP +120',()=>{hero.maxHp+=120;hero.hp+=120}],
  ['이동속도 +0.35',()=>hero.speed+=.35],
  ['치명타 +5%',()=>hero.crit+=.05]
];

function enemyTotal(){return 8+wave*2+Math.floor(wave/3);}
function notify(text){const n=$('notice');if(!n)return;n.textContent=text;n.classList.add('show');clearTimeout(window.__notice);window.__notice=setTimeout(()=>n.classList.remove('show'),1200);}
function syncHud(){
  $('wave').textContent='WAVE '+wave;$('direction').textContent=gateNames[side]+' 방향';$('waveCount').textContent=spawned+' / '+enemyTotal();
  $('heroName').textContent=HERO[hero.type].name;$('level').textContent='LV '+level;$('xp').textContent=xp+' / '+nextXP;$('gold').textContent=gold+' G';
  $('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp;$('heroHpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;
  $('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';$('heroBar').style.width=Math.max(0,hero.hp/hero.maxHp*100)+'%';$('skillText').textContent=hero.skill>0?hero.skill.toFixed(1)+'s':'READY';
  $('inventoryText').textContent=inventory.length+' / 6';
}

function setupHeroVisual(){
  const token=++hero.token;if(hero.obj)scene.remove(hero.obj);hero.obj=null;hero.mixer=null;
  const d=HERO[hero.type];const p=hero.pos.clone();
  const fallback=placeholder(d.color,2.15);fallback.position.copy(p);scene.add(fallback);hero.obj=fallback;
  loadModel(d.model).then(g=>{
    if(token!==hero.token)return;
    const old=hero.obj;const obj=fitModel(g,2.35);obj.position.copy(hero.pos);if(hero.type==='ranger')obj.add(makeBow());scene.add(obj);hero.obj=obj;if(old)scene.remove(old);
    if(g.animations?.length){hero.mixer=new THREE.AnimationMixer(obj);const action=hero.mixer.clipAction(g.animations[0]);action.play();mixers.push(hero.mixer);}
  }).catch(()=>{});
}

function clearEntities(){
  for(const e of enemies)if(e.obj)scene.remove(e.obj);enemies.length=0;
  for(const p of projectiles)if(p.obj)scene.remove(p.obj);projectiles.length=0;
  for(const f of effects)if(f.obj)scene.remove(f.obj);effects.length=0;
}
function resetRun(){
  clearEntities();wave=1;side=0;spawned=0;spawnClock=.35;gold=500;xp=0;level=1;nextXP=100;tower.hp=tower.maxHp;inventory=[];
  const d=HERO[hero.type];Object.assign(hero,{hp:d.hp,maxHp:d.hp,speed:d.speed,damage:d.damage,range:d.range,rate:d.rate,attack:0,skill:0,crit:hero.type==='ranger'?.16:.08,power:1,lifesteal:0,pos:new THREE.Vector3(0,0,7)});
  books.str=books.agi=books.int=0;setupHeroVisual();hideOverlays();state='play';notify('웨이브 1 · 북쪽 적습');syncHud();
}
function startHero(type){hero.type=type;resetRun();}

function spawnEnemy(){
  if(spawned>=enemyTotal())return;
  let kind='grunt',r=Math.random();
  if(wave%5===0&&spawned===enemyTotal()-1)kind='boss';else if(r<.15)kind='runner';else if(r<.30)kind='tank';else if(r<.42)kind='caster';
  const d=ENEMY[kind],g=gates[side],sc=1+wave*.12;
  const e={kind,pos:new THREE.Vector3(g.x+(Math.random()-.5)*1.6,0,g.z+(Math.random()-.5)*1.6),hp:d.hp*sc,maxHp:d.hp*sc,speed:d.speed*(1+wave*.008),dmg:d.dmg*(1+wave*.05),gold:d.gold,xp:d.xp,obj:null,bar:null,dead:false,bob:Math.random()*6.28,mixer:null};
  // Immediate placeholder: monsters are visible even while remote GLBs are loading.
  e.obj=placeholder(d.color,d.height);e.obj.position.copy(e.pos);scene.add(e.obj);makeEnemyBar(e);enemies.push(e);spawned++;
  loadModel(d.model).then(g=>{if(e.dead)return;const old=e.obj;const obj=fitModel(g,d.height);obj.position.copy(e.pos);scene.add(obj);e.obj=obj;makeEnemyBar(e);scene.remove(old);if(g.animations?.length){e.mixer=new THREE.AnimationMixer(obj);const a=e.mixer.clipAction(g.animations[0]);a.play();mixers.push(e.mixer);}}).catch(()=>{});
}
function makeEnemyBar(e){
  if(!e.obj)return;const old=e.obj.getObjectByName('hpBar');if(old)e.obj.remove(old);
  const g=new THREE.Group();g.name='hpBar';
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.12),new THREE.MeshBasicMaterial({color:0x2a1516}));
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(1.10,.08),new THREE.MeshBasicMaterial({color:0x62d578}));
  fg.position.z=.02;g.add(bg,fg);g.userData.fg=fg;g.position.y=e.kind==='boss'?3.5:2.0;g.rotation.x=-.38;e.obj.add(g);e.bar=g;
}
function killEnemy(e){if(e.dead)return;e.dead=true;gold+=e.gold;gainXP(e.xp);burst(e.pos,e.kind==='boss'?0xe8bd55:0xdde8df,e.kind==='boss'?28:8);}
function gainXP(v){xp+=v;if(xp>=nextXP){xp-=nextXP;level++;nextXP=Math.floor(nextXP*1.28);openLevel();}}
function openLevel(){state='level';const box=$('levelChoices');box.replaceChildren();upgrades.slice().sort(()=>Math.random()-.5).slice(0,3).forEach(a=>{const b=document.createElement('button');b.className='upgradeChoice';b.innerHTML='<b>◆</b><span>'+a[0]+'</span>';b.onclick=()=>{a[1]();hide('levelUp');state='play';notify('레벨 '+level);syncHud();};box.appendChild(b);});show('levelUp');}
function hit(e,d){if(e.dead)return;e.hp-=d;if(e.hp<=0)killEnemy(e);}

function attack(){
  if(hero.attack>0)return;let target=null,best=hero.range;
  for(const e of enemies)if(!e.dead){const d=hero.pos.distanceTo(e.pos);if(d<best){best=d;target=e;}}
  if(!target)return;hero.attack=hero.rate;const damage=hero.damage*(Math.random()<hero.crit?2:1);
  if(hero.type==='warrior')hit(target,damage);else{
    const obj=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x6de1f3:0xf0d36f}));obj.position.copy(hero.pos);scene.add(obj);projectiles.push({obj,target,damage});
  }
  if(hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
}
function skill(){
  if(state!=='play'||hero.skill>0)return;hero.skill=HERO[hero.type].skill;
  const radius=hero.type==='warrior'?4.3:5.6;const mult=(hero.type==='warrior'?5.5:hero.type==='mage'?4.8:4.5)*hero.power;
  for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<radius)hit(e,hero.damage*mult);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,radius,40),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x62dcef:hero.type==='ranger'?0x7bd46c:0xf0b94c,transparent:true,opacity:.85,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(hero.pos.x,.07,hero.pos.z);scene.add(ring);effects.push({obj:ring,life:.45,max:.45});notify('필살기 발동');
}
function move(dt){
  let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if(!x&&!z)return;const v=new THREE.Vector3(x,0,z).normalize().multiplyScalar(hero.speed*dt);hero.pos.add(v);hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-13.2,13.2);hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-13.2,13.2);
  if(hero.obj){hero.obj.position.copy(hero.pos);hero.obj.rotation.y=Math.atan2(v.x,v.z);}
}
function updateProjectiles(dt){
  for(const p of projectiles){if(!p.target||p.target.dead){p.obj.visible=false;continue}const to=new THREE.Vector3(p.target.pos.x,.8,p.target.pos.z);p.obj.position.lerp(to,Math.min(1,dt*15));if(p.obj.position.distanceTo(to)<.2){hit(p.target,p.damage);p.obj.visible=false;}}
  for(let i=projectiles.length-1;i>=0;i--)if(!projectiles[i].obj.visible){scene.remove(projectiles[i].obj);projectiles.splice(i,1);}
}
function update(dt){
  if(state!=='play')return;hero.attack=Math.max(0,hero.attack-dt);hero.skill=Math.max(0,hero.skill-dt);move(dt);attack();
  spawnClock-=dt;if(spawnClock<=0){spawnClock=Math.max(.26,.62-wave*.006);spawnEnemy();}
  updateProjectiles(dt);
  let alive=0;for(const e of enemies)if(!e.dead){alive++;const dir=new THREE.Vector3(-e.pos.x,0,-e.pos.z);const dist=dir.length();if(dist<2.65)tower.hp-=e.dmg*dt;else{dir.normalize();e.pos.addScaledVector(dir,e.speed*dt);}if(e.obj){e.obj.position.copy(e.pos);e.obj.position.y+=Math.sin(performance.now()*.006+e.bob)*.035;}if(e.bar)e.bar.userData.fg.scale.x=Math.max(.02,e.hp/e.max);}
  for(const f of effects){f.life-=dt;f.obj.scale.setScalar(1+(f.max-f.life)*1.8);if(f.v)f.obj.position.addScaledVector(f.v,dt);if(f.v)f.v.multiplyScalar(.91);}
  for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0){scene.remove(effects[i].obj);effects.splice(i,1);}
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead){if(enemies[i].obj)scene.remove(enemies[i].obj);enemies.splice(i,1);}
  if(spawned>=enemyTotal()&&alive===0){side=(side+1)%4;spawned=0;spawnClock=.55;if(side===0){wave++;gold+=100;tower.hp=Math.min(tower.maxHp,tower.hp+160);notify('웨이브 '+wave+' 시작');}else notify(gateNames[side]+' 방향 적습');}
  if(tower.hp<=0){tower.hp=0;state='over';$('overDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · ${gold} G · ${HERO[hero.type].name}`;show('gameover');}
  syncHud();
}
function burst(pos,color,n){for(let i=0;i<n;i++){const o=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color}));o.position.set(pos.x,pos.y+.6,pos.z);scene.add(o);effects.push({obj:o,life:.45,max:.45,v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5)});}}

function renderShop(){
  $('shopGold').textContent=gold+' G';const box=$('shopItems');box.replaceChildren();
  items.forEach((a,i)=>{const b=document.createElement('button');b.className='shopItem';b.innerHTML=`<strong>${a[0]}</strong><span>${a[1]}</span><em>${a[2]} G</em>`;b.onclick=()=>{if(gold<a[2]){notify('골드가 부족합니다');return;}gold-=a[2];a[3]();inventory.push(a[0]);renderShop();syncHud();notify(a[0]+' 구매');};box.appendChild(b);});
  const bb=$('bookLine');bb.replaceChildren();[['str','힘 +8 공격','damage',8],['agi','민첩 +0.3 속도','speed',.3],['int','지능 +8% 스킬','power',.08]].forEach(a=>{const b=document.createElement('button');b.className='bookBtn';const cost=100+books[a[0]]*50;b.textContent=a[1]+' · '+cost+'G';b.onclick=()=>{if(gold<cost){notify('골드가 부족합니다');return;}gold-=cost;books[a[0]]++;hero[a[2]]+=a[3];renderShop();syncHud();};bb.appendChild(b);});
}
function toggleShop(){if(state==='menu'||state==='over'||state==='level')return;if(state==='shop'){state='play';hide('shop');return;}state='shop';renderShop();show('shop');}

addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','i'].includes(k))e.preventDefault();if(k==='q')skill();if(k==='i')toggleShop();if(k==='escape'){if(state==='play'){state='pause';show('pause');}else if(state==='pause'){state='play';hide('pause');}else if(state==='shop')toggleShop();}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
$('startBtn').onclick=()=>{hide('start');show('heroSelect');};
$('warriorBtn').onclick=()=>startHero('warrior');$('mageBtn').onclick=()=>startHero('mage');$('rangerBtn').onclick=()=>startHero('ranger');
$('shopBtn').onclick=toggleShop;$('shopClose').onclick=toggleShop;$('resumeBtn').onclick=()=>{state='play';hide('pause');};$('restartBtn').onclick=()=>{hideOverlays();show('start');state='menu';};

function resize(){renderer.setSize(innerWidth,innerHeight,false);const a=Math.max(.55,innerWidth/innerHeight),h=10,w=h*a;camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();syncHud();

// Non-blocking preload. Gameplay never waits for model downloads.
for(const k of ['warrior','mage','ranger','grunt','caster','tank'])loadModel(k).catch(()=>{});

let last=performance.now();
function animate(now){const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;update(dt);for(const m of mixers)m.update(dt);crystal.rotation.y+=dt*1.2;crystal.position.y=3+Math.sin(now*.003)*.08;renderer.render(scene,camera);requestAnimationFrame(animate);}
requestAnimationFrame(animate);
