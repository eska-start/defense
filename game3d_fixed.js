import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = document.getElementById('canvas');
const ui = id => document.getElementById(id);
const show = id => ui(id)?.classList.remove('hidden');
const hide = id => ui(id)?.classList.add('hidden');
const hideAll = () => ['start','heroSelect','levelUp','shop','equipment','pause','gameover'].forEach(hide);

const renderer = new THREE.WebGLRenderer({ antialias:false, powerPreference:'high-performance' });
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

scene.add(new THREE.HemisphereLight(0xcfe7d8,0x172019,2.0));
const sun = new THREE.DirectionalLight(0xffe4b0,2.2);
sun.position.set(8,22,10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-24; sun.shadow.camera.right=24;
sun.shadow.camera.top=24; sun.shadow.camera.bottom=-24;
scene.add(sun);

function mat(color, emissive=0x000000){
  return new THREE.MeshStandardMaterial({color,roughness:0.85,emissive,emissiveIntensity:emissive?1.3:0});
}
function addBox(pos,size,color){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));
  m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
function addCylinder(pos,r,h,color){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat(color));
  m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}

const ground=new THREE.Mesh(new THREE.PlaneGeometry(36,36),new THREE.MeshStandardMaterial({color:0x2a4030,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const arena=new THREE.Mesh(new THREE.CircleGeometry(8.7,32),new THREE.MeshStandardMaterial({color:0x38533d,roughness:1}));
arena.rotation.x=-Math.PI/2;arena.position.y=0.02;scene.add(arena);
for(let i=-18;i<=18;i++){
  const a=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.02,36),new THREE.MeshBasicMaterial({color:0x344b39}));a.position.set(i,0.025,0);scene.add(a);
  const b=new THREE.Mesh(new THREE.BoxGeometry(36,0.02,0.08),new THREE.MeshBasicMaterial({color:0x344b39}));b.position.set(0,0.025,i);scene.add(b);
}

addBox([0,1.5,0],[5.6,3,5],0x687d69);
for(const p of [[-3,2.1,-2.4],[3,2.1,-2.4],[-3,2.1,2.4],[3,2.1,2.4]]) addCylinder(p,0.72,4.2,0x778e78);
addBox([0,1.15,2.72],[1.5,2.3,0.7],0x412d24);
const roof=new THREE.Mesh(new THREE.ConeGeometry(3.4,2,4),mat(0x875947));roof.position.set(0,3.95,0);roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);
const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(0.55),mat(0x59d8d0,0x144d4a));crystal.position.set(0,3,2.95);scene.add(crystal);

const gates=[new THREE.Vector3(0,0,-15),new THREE.Vector3(15,0,0),new THREE.Vector3(0,0,15),new THREE.Vector3(-15,0,0)];
const gateNames=['북','동','남','서'];
for(const g of gates) addBox([g.x,g.y+0.45,g.z],[2.5,0.9,1],0x5e755f);

const modelURLs={
  warrior:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Knight.glb',
  mage:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Mage.glb',
  ranger:'https://cdn.3dassets.dev/assets/36374/v1/model.glb',
  grunt:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Minion.glb',
  runner:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Rogue.glb',
  caster:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Mage.glb',
  tank:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Shield_Large_A.gltf'
};
const loader=new GLTFLoader();
const modelCache=new Map();
function loadModel(key){
  if(!modelCache.has(key)) modelCache.set(key,loader.loadAsync(modelURLs[key]));
  return modelCache.get(key);
}
function placeholder(color,height=1.5){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.42,0.8,4,8),mat(color));
  body.position.y=height*0.5;body.castShadow=true;g.add(body);return g;
}
function cloneNormalized(source,height){
  const o=(source.scene||source).clone(true);
  const b=new THREE.Box3().setFromObject(o);
  const h=Math.max(0.01,b.max.y-b.min.y);o.scale.setScalar(height/h);
  const b2=new THREE.Box3().setFromObject(o);o.position.y-=b2.min.y;
  o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});return o;
}

const HERO={
  warrior:{name:'전사',hp:600,speed:6,damage:58,range:2.6,rate:0.34,skill:7,color:0xc17d3f,model:'warrior'},
  mage:{name:'마법사',hp:380,speed:5.2,damage:74,range:5.2,rate:0.55,skill:6,color:0x5d9bd7,model:'mage'},
  ranger:{name:'궁수',hp:430,speed:6.8,damage:48,range:6.6,rate:0.23,skill:8,color:0x6eaa72,model:'ranger'}
};
const ENEMY={
  grunt:{hp:72,speed:1.55,dmg:8,gold:8,xp:10,height:1.25,color:0x98725c,model:'grunt'},
  runner:{hp:50,speed:2.95,dmg:6,gold:10,xp:14,height:1.15,color:0xb4a256,model:'runner'},
  tank:{hp:250,speed:0.92,dmg:22,gold:28,xp:34,height:1.8,color:0x718469,model:'tank'},
  caster:{hp:125,speed:1.25,dmg:16,gold:26,xp:30,height:1.4,color:0x8062a5,model:'caster'},
  boss:{hp:3400,speed:0.66,dmg:65,gold:520,xp:450,height:3.3,color:0xb9424b,model:'tank'}
};

const SLOT_NAMES={helmet:'투구',armor:'갑옷',gloves:'장갑',boots:'신발',weapon:'주무기',offhand:'보조무기',ring:'반지',amulet:'목걸이'};
const SLOT_ORDER=Object.keys(SLOT_NAMES);
const SHOP_ITEMS=[
  {id:'iron_sword',name:'강철검',slot:'weapon',cost:180,desc:'공격력 +35',damage:35,visual:'sword'},
  {id:'mage_staff',name:'마력 지팡이',slot:'weapon',cost:220,desc:'스킬 피해 +25%',power:0.25,visual:'staff'},
  {id:'hunter_bow',name:'사냥꾼의 활',slot:'weapon',cost:220,desc:'공격력 +22 · 공격속도 +10%',damage:22,rateBonus:0.10,visual:'bow'},
  {id:'iron_helm',name:'철제 투구',slot:'helmet',cost:160,desc:'최대 HP +90',maxHp:90,visual:'helm'},
  {id:'plate',name:'수호 갑옷',slot:'armor',cost:260,desc:'최대 HP +180',maxHp:180,visual:'armor'},
  {id:'gloves',name:'전투 장갑',slot:'gloves',cost:150,desc:'공격력 +12',damage:12,visual:'gloves'},
  {id:'boots',name:'질주화',slot:'boots',cost:200,desc:'이동속도 +0.8',speed:0.8,visual:'boots'},
  {id:'shield',name:'철제 방패',slot:'offhand',cost:220,desc:'수호탑 피해 경감 · 방어력 +3',armor:3,visual:'shield'},
  {id:'ring',name:'용사의 반지',slot:'ring',cost:240,desc:'치명타 +8%',crit:0.08,visual:'ring'},
  {id:'amulet',name:'흡혈 부적',slot:'amulet',cost:280,desc:'타격 회복 +3',lifesteal:3,visual:'amulet'}
];
const STAT_BOOKS=[
  {key:'damage',name:'공격의 서',desc:'공격력 +8',cost:300,apply:()=>hero.damage+=8},
  {key:'maxHp',name:'강인함의 서',desc:'최대 HP +60',cost:350,apply:()=>{hero.maxHp+=60;hero.hp+=60;}},
  {key:'speed',name:'민첩의 서',desc:'이동속도 +0.25',cost:300,apply:()=>hero.speed+=0.25},
  {key:'crit',name:'치명의 서',desc:'치명타 +3%',cost:500,apply:()=>hero.crit+=0.03}
];

const hero={type:'warrior',pos:new THREE.Vector3(0,0,7),hp:600,maxHp:600,speed:6,damage:58,range:2.6,rate:0.34,attack:0,skill:0,crit:0.08,power:1,lifesteal:0,obj:null,gear:null};
const tower={hp:3400,maxHp:3400,armor:0};
let state='menu',wave=1,side=0,spawned=0,spawnClock=0.5,gold=500,xp=0,level=1,nextXP=100;
const keys=new Set(),enemies=[],projectiles=[],effects=[];
let inventory=[],equipped={helmet:null,armor:null,gloves:null,boots:null,weapon:null,offhand:null,ring:null,amulet:null};
let appliedEquip={damage:0,maxHp:0,speed:0,crit:0,power:0,lifesteal:0,rateBonus:0,armor:0};
let shopState=false,visualToken=0;

function enemyTotal(){return 7+wave*2+Math.floor(wave/3);}
function notify(text){const n=ui('notice');if(!n)return;n.textContent=text;n.classList.add('show');clearTimeout(window.__noticeTimer);window.__noticeTimer=setTimeout(()=>n.classList.remove('show'),1200);}
function syncHud(){
  ui('wave').textContent='WAVE '+wave;ui('direction').textContent=gateNames[side];ui('waveCount').textContent=spawned+' / '+enemyTotal();
  ui('heroName').textContent=HERO[hero.type].name;ui('level').textContent='LV '+level;ui('xp').textContent=xp+' / '+nextXP;ui('gold').textContent=gold+' G';
  ui('inventoryText').textContent=inventory.length+' / 8';ui('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp;ui('heroHpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;
  ui('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';ui('heroBar').style.width=Math.max(0,hero.hp/hero.maxHp*100)+'%';ui('skillText').textContent=hero.skill>0?hero.skill.toFixed(1)+'s':'READY';
}

function gearMesh(item){
  const g=new THREE.Group();
  const metal=mat(0xa48a52), glow=new THREE.MeshStandardMaterial({color:0x62dcef,emissive:0x194f50,emissiveIntensity:2});
  if(item.visual==='sword'){const b=new THREE.Mesh(new THREE.BoxGeometry(.14,1.35,.18),metal);b.position.y=.67;const h=new THREE.Mesh(new THREE.BoxGeometry(.55,.1,.12),metal);h.position.y=.1;g.add(b,h);}
  if(item.visual==='staff'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.7,8),metal);b.position.y=.8;const c=new THREE.Mesh(new THREE.SphereGeometry(.15,8,8),glow);c.position.y=1.7;g.add(b,c);}
  if(item.visual==='bow'){const b=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,6,20,Math.PI*1.35),metal);b.rotation.z=Math.PI/2;g.add(b);}
  if(item.visual==='helm'){g.add(new THREE.Mesh(new THREE.SphereGeometry(.48,10,6,0,Math.PI*2,0,Math.PI*.55),metal));}
  if(item.visual==='armor'){g.add(new THREE.Mesh(new THREE.BoxGeometry(.82,.95,.5),metal));}
  if(item.visual==='gloves'){const x=new THREE.Mesh(new THREE.BoxGeometry(.18,.32,.2),metal);x.position.set(-.5,1,0);g.add(x,x.clone().translateX(1));}
  if(item.visual==='boots'){const x=new THREE.Mesh(new THREE.BoxGeometry(.22,.38,.34),metal);x.position.set(-.25,.2,.08);g.add(x,x.clone().translateX(.5));}
  if(item.visual==='shield'){const s=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.12,12),metal);s.rotation.z=Math.PI/2;s.position.set(-.65,1.05,.1);g.add(s);}
  if(item.visual==='ring'){const r=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,8,12),new THREE.MeshBasicMaterial({color:0xe8c65d}));r.position.set(.45,.95,.2);g.add(r);}
  if(item.visual==='amulet'){const a=new THREE.Mesh(new THREE.OctahedronGeometry(.14),glow);a.position.set(0,.85,.35);g.add(a);}
  return g;
}
function refreshGear(){
  if(hero.obj?.userData?.gear) hero.obj.remove(hero.obj.userData.gear);
  const gear=new THREE.Group();hero.gear=gear;
  if(hero.obj){hero.obj.add(gear);hero.obj.userData.gear=gear;}
  for(const slot of SLOT_ORDER){const item=equipped[slot];if(!item)continue;const g=gearMesh(item);
    if(slot==='helmet')g.position.set(0,1.95,0);
    else if(slot==='armor')g.position.set(0,1.15,.08);
    else if(slot==='weapon')g.position.set(.55,.95,.05);
    else if(slot==='offhand')g.position.set(0,0,0);
    else if(slot==='boots')g.position.set(0,-.15,0);
    gear.add(g);
  }
}

function makeHeroObject(){
  const token=++visualToken;const p=hero.pos.clone();
  if(hero.obj)scene.remove(hero.obj);
  hero.obj=placeholder(HERO[hero.type].color,2.2);hero.obj.position.copy(p);scene.add(hero.obj);refreshGear();
  loadModel(HERO[hero.type].model).then(src=>{
    if(token!==visualToken)return;
    const old=hero.obj,o=cloneNormalized(src,2.35);o.position.copy(p);scene.add(o);hero.obj=o;refreshGear();
  }).catch(()=>{});
}
function clearWorld(){
  enemies.splice(0).forEach(e=>{if(e.obj)scene.remove(e.obj);});
  projectiles.splice(0).forEach(p=>{if(p.obj)scene.remove(p.obj);});
  effects.splice(0).forEach(f=>{if(f.obj)scene.remove(f.obj);});
}

function resetRun(){
  clearWorld();wave=1;side=0;spawned=0;spawnClock=.4;gold=500;xp=0;level=1;nextXP=100;tower.hp=tower.maxHp;tower.armor=0;
  inventory=[];for(const s of SLOT_ORDER)equipped[s]=null;appliedEquip={damage:0,maxHp:0,speed:0,crit:0,power:0,lifesteal:0,rateBonus:0,armor:0};
  const d=HERO[hero.type];Object.assign(hero,{hp:d.hp,maxHp:d.hp,speed:d.speed,damage:d.damage,range:d.range,rate:d.rate,attack:0,skill:0,crit:hero.type==='ranger'?0.16:0.08,power:1,lifesteal:0,pos:new THREE.Vector3(0,0,7)});
  loadHeroAndStart();
}
function loadHeroAndStart(){makeHeroObject();hideAll();state='play';notify('웨이브 1 · 북쪽 적습');syncHud();}
function beginHero(type){hero.type=type;resetRun();}

function barFor(e){
  const group=new THREE.Group();const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.12),new THREE.MeshBasicMaterial({color:0x281516}));
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(1.10,.08),new THREE.MeshBasicMaterial({color:0x63d579}));fg.position.z=.02;group.add(bg,fg);
  group.position.y=e.kind==='boss'?3.5:2;group.rotation.x=-.35;group.userData.fg=fg;e.obj.add(group);e.bar=group;
}
function spawnEnemy(){
  if(spawned>=enemyTotal())return;let kind='grunt',r=Math.random();
  if(wave%5===0&&spawned===enemyTotal()-1)kind='boss';else if(r<.15)kind='runner';else if(r<.30)kind='tank';else if(r<.42)kind='caster';
  const d=ENEMY[kind],g=gates[side];const hp=d.hp*(1+wave*.13);
  const e={kind,pos:new THREE.Vector3(g.x+(Math.random()-.5)*1.5,0,g.z+(Math.random()-.5)*1.5),hp,maxHp:hp,speed:d.speed*(1+wave*.008),dmg:d.dmg*(1+wave*.05),gold:d.gold,xp:d.xp,obj:null,bar:null,dead:false,bob:Math.random()*Math.PI*2};
  e.obj=placeholder(d.color,d.height);e.obj.position.copy(e.pos);scene.add(e.obj);barFor(e);enemies.push(e);spawned++;
  loadModel(d.model).then(src=>{if(e.dead)return;const old=e.obj,o=cloneNormalized(src,d.height);o.position.copy(e.pos);scene.add(o);e.obj=o;barFor(e);if(old)scene.remove(old);}).catch(()=>{});
}
function killEnemy(e){if(e.dead)return;e.dead=true;gold+=e.gold;gainXP(e.xp);spawnBurst(e.pos,e.kind==='boss'?0xeac05d:0xdce7dc,e.kind==='boss'?28:8);}
function gainXP(v){xp+=v;if(xp>=nextXP){xp-=nextXP;level++;nextXP=Math.floor(nextXP*1.28);openLevel();}}
const levelChoices=[['공격력 +22',()=>hero.damage+=22],['최대 HP +120',()=>{hero.maxHp+=120;hero.hp+=120;}],['이동속도 +0.35',()=>hero.speed+=.35],['치명타 +5%',()=>hero.crit+=.05]];
function openLevel(){
  state='level';const box=ui('levelChoices');box.replaceChildren();
  levelChoices.slice().sort(()=>Math.random()-.5).slice(0,3).forEach(a=>{const b=document.createElement('button');b.className='upgradeChoice';b.innerHTML='<b>▣</b><span>'+a[0]+'</span>';b.onclick=()=>{a[1]();hide('levelUp');state='play';syncHud();notify('레벨 '+level);};box.appendChild(b);});show('levelUp');
}
function hit(e,dmg){if(e.dead)return;e.hp-=dmg;if(e.hp<=0)killEnemy(e);}
function attack(){
  if(hero.attack>0)return;let target=null,best=hero.range;
  for(const e of enemies)if(!e.dead){const d=hero.pos.distanceTo(e.pos);if(d<best){best=d;target=e;}}
  if(!target)return;hero.attack=hero.rate;
  const dmg=hero.damage*(Math.random()<hero.crit?2:1);
  if(hero.type==='warrior')hit(target,dmg);else{const obj=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x68dff0:0xf0d46d}));obj.position.copy(hero.pos);scene.add(obj);projectiles.push({obj,target,dmg});}
  if(hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
}
function skill(){
  if(state!=='play'||hero.skill>0)return;hero.skill=HERO[hero.type].skill;const radius=hero.type==='warrior'?4.2:5.8;const mult=(hero.type==='warrior'?6:hero.type==='mage'?5:4)*hero.power;
  for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<radius)hit(e,hero.damage*mult);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.5,radius,40),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x68d9ef:hero.type==='ranger'?0x87d670:0xf0b94c,transparent:true,opacity:.85,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(hero.pos.x,.06,hero.pos.z);scene.add(ring);effects.push({obj:ring,life:.45,max:.45});notify('필살기 발동');
}
function move(dt){let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(!x&&!z)return;const v=new THREE.Vector3(x,0,z).normalize().multiplyScalar(hero.speed*dt);hero.pos.add(v);hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-13.2,13.2);hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-13.2,13.2);if(hero.obj){hero.obj.position.copy(hero.pos);hero.obj.rotation.y=Math.atan2(v.x,v.z);}}
function update(dt){
  if(state!=='play')return;hero.attack=Math.max(0,hero.attack-dt);hero.skill=Math.max(0,hero.skill-dt);move(dt);attack();spawnClock-=dt;if(spawnClock<=0){spawnClock=Math.max(.28,.62-wave*.008);spawnEnemy();}
  for(const p of projectiles){if(!p.target||p.target.dead){p.obj.visible=false;continue;}const to=new THREE.Vector3(p.target.pos.x,.8,p.target.pos.z);p.obj.position.lerp(to,Math.min(1,dt*16));if(p.obj.position.distanceTo(to)<.22){hit(p.target,p.dmg);p.obj.visible=false;}}
  for(let i=projectiles.length-1;i>=0;i--)if(!projectiles[i].obj.visible){scene.remove(projectiles[i].obj);projectiles.splice(i,1);}
  let alive=0;for(const e of enemies)if(!e.dead){alive++;const dir=new THREE.Vector3(-e.pos.x,0,-e.pos.z),dist=dir.length();if(dist<2.65){const dmg=e.dmg*(1-Math.min(.75,tower.armor*.06));tower.hp-=dmg*dt;}else{dir.normalize();e.pos.addScaledVector(dir,e.speed*dt);}if(e.obj){e.obj.position.copy(e.pos);e.obj.position.y+=Math.sin(performance.now()*.006+e.bob)*.035;}if(e.bar){e.bar.userData.fg.scale.x=Math.max(.02,e.hp/e.maxHp);}}
  for(const f of effects){f.life-=dt;f.obj.scale.setScalar(1+(f.max-f.life)*1.8);if(f.v){f.obj.position.addScaledVector(f.v,dt);f.v.multiplyScalar(.91);}}
  for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0){scene.remove(effects[i].obj);effects.splice(i,1);}
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead){scene.remove(enemies[i].obj);enemies.splice(i,1);}
  if(spawned>=enemyTotal()&&alive===0){side=(side+1)%4;spawned=0;spawnClock=.5;if(side===0){wave++;gold+=100;tower.hp=Math.min(tower.maxHp,tower.hp+160);notify('웨이브 '+wave+' 시작');}else notify(gateNames[side]+' 방향 적습');}
  if(tower.hp<=0){tower.hp=0;state='over';ui('overDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · ${gold} G · ${HERO[hero.type].name}`;show('gameover');}
  syncHud();
}
function spawnBurst(pos,color,n){for(let i=0;i<n;i++){const o=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color}));o.position.set(pos.x,pos.y+.5,pos.z);scene.add(o);effects.push({obj:o,life:.45,max:.45,v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5)});}}

function collectEquipBonus(){const b={damage:0,maxHp:0,speed:0,crit:0,power:0,lifesteal:0,rateBonus:0,armor:0};for(const s of SLOT_ORDER){const it=equipped[s];if(!it)continue;for(const k of Object.keys(b))b[k]+=it[k]||0;}return b;}
function recalcEquipmentStats(){
  for(const k of Object.keys(appliedEquip)){
    if(k==='rateBonus')continue;
    if(k==='armor')continue;
    hero[k]-=appliedEquip[k]||0;
  }
  const next=collectEquipBonus();
  hero.damage+=next.damage;hero.maxHp+=next.maxHp;hero.speed+=next.speed;hero.crit+=next.crit;hero.power+=next.power;hero.lifesteal+=next.lifesteal;
  if(next.maxHp>appliedEquip.maxHp)hero.hp+=next.maxHp-appliedEquip.maxHp;else if(next.maxHp<appliedEquip.maxHp)hero.hp=Math.min(hero.hp,hero.maxHp);
  hero.rate=HERO[hero.type].rate*(1-Math.min(.5,next.rateBonus));
  tower.armor=next.armor;
  appliedEquip=next;hero.hp=Math.min(hero.hp,hero.maxHp);refreshGear();syncHud();renderEquipment();renderShop();
}
function buyItem(item){
  if(inventory.length>=8){notify('인벤토리가 가득 찼습니다.');return;}
  if(gold<item.cost){notify('골드가 부족합니다.');return;}
  gold-=item.cost;inventory.push({...item});notify(item.name+' 획득');renderShop();syncHud();
}
function renderShop(){
  const box=ui('shopItems');if(!box)return;ui('shopGold').textContent=gold+' G';box.replaceChildren();
  SHOP_ITEMS.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='shopItem';b.innerHTML=`<strong>${item.name}</strong><span>${item.desc}</span><em>${item.cost} G</em>`;b.onclick=()=>buyItem(item);box.appendChild(b);});
  const bb=ui('bookLine');bb.replaceChildren();STAT_BOOKS.forEach(book=>{const b=document.createElement('button');b.type='button';b.className='bookBtn';b.innerHTML=`${book.name} · ${book.cost}G<span>${book.desc}</span>`;b.onclick=()=>{if(gold<book.cost){notify('골드가 부족합니다.');return;}gold-=book.cost;book.apply();renderShop();syncHud();};bb.appendChild(b);});
}
function openShop(){if(state==='menu'||state==='over'||state==='level'||state==='equipment'||state==='pause')return;shopState=true;state='shop';show('shop');renderShop();}
function closeShop(){if(state!=='shop')return;shopState=false;hide('shop');state='play';}

function initEquipmentPreview(){
  const host=ui('equipModelBox');if(!host)return null;
  let canvas=ui('equipPreviewCanvas');if(!canvas){canvas=document.createElement('canvas');canvas.id='equipPreviewCanvas';host.insertBefore(canvas,host.firstChild);}
  if(window.__equipPreview)return window.__equipPreview;
  const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio||1,1.5));r.outputColorSpace=THREE.SRGBColorSpace;r.setClearColor(0,0);
  const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xdcefe4,0x162018,2.3));const k=new THREE.DirectionalLight(0xffe9c7,2.5);k.position.set(4,7,5);s.add(k);
  const c=new THREE.PerspectiveCamera(25,1,.1,50);c.position.set(0,1.5,6.2);c.lookAt(0,1.15,0);const root3=new THREE.Group();s.add(root3);
  window.__equipPreview={renderer:r,scene:s,camera:c,root:root3,canvas};return window.__equipPreview;
}
function renderEquipmentPreview(){
  const p=initEquipmentPreview();if(!p)return;const host=ui('equipModelBox');const rect=host.getBoundingClientRect();const w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));p.renderer.setSize(w,h,false);p.camera.aspect=w/h;p.camera.updateProjectionMatrix();
  while(p.root.children.length)p.root.remove(p.root.children[p.root.children.length-1]);
  loadModel(HERO[hero.type].model).then(src=>{while(p.root.children.length)p.root.remove(p.root.children[p.root.children.length-1]);const o=cloneNormalized(src,2.35);p.root.add(o);for(const slot of SLOT_ORDER){const it=equipped[slot];if(!it)continue;const g=gearMesh(it);if(slot==='helmet')g.position.set(0,1.95,0);else if(slot==='armor')g.position.set(0,1.15,.08);else if(slot==='weapon')g.position.set(.55,.95,.05);p.root.add(g);} }).catch(()=>{});
}
function renderEquipment(){
  const slots=ui('equipSlots'),grid=ui('inventoryGrid'),title=ui('inventoryTitle'),text=ui('inventoryText'),stats=ui('equipStats'),character=ui('equipCharacter');if(!slots||!grid)return;
  character.textContent=HERO[hero.type].name;title.textContent=inventory.length+' / 8';text.textContent=inventory.length+' / 8';slots.replaceChildren();grid.replaceChildren();
  for(const slot of SLOT_ORDER){const it=equipped[slot];const b=document.createElement('button');b.type='button';b.className='equipSlot'+(it?' equipped':'');b.dataset.slot=slot;b.innerHTML=it?`<strong>${SLOT_NAMES[slot]}</strong><span>${it.name}</span><small>${it.desc}</small>`:`<strong>${SLOT_NAMES[slot]}</strong><small>비어 있음</small>`;b.onclick=()=>{if(it){if(inventory.length>=8){notify('인벤토리가 가득 찼습니다.');return;}inventory.push(it);equipped[slot]=null;recalcEquipmentStats();notify(it.name+' 해제');}else notify(SLOT_NAMES[slot]+' 슬롯이 비어 있습니다.');};slots.appendChild(b);}
  inventory.forEach((it,i)=>{const b=document.createElement('button');b.type='button';b.className='invSlot';b.innerHTML=`<strong>${it.name}</strong><small>${SLOT_NAMES[it.slot]} · ${it.desc}</small><small>클릭하여 장착</small>`;b.onclick=()=>{const old=equipped[it.slot];equipped[it.slot]=it;if(old)inventory[i]=old;else inventory.splice(i,1);recalcEquipmentStats();notify(it.name+' 장착');};grid.appendChild(b);});
  for(let i=inventory.length;i<8;i++){const b=document.createElement('button');b.type='button';b.className='invSlot';b.disabled=true;b.innerHTML=`<strong>빈 슬롯 ${i+1}</strong><small>상점에서 아이템을 구매하세요</small>`;grid.appendChild(b);}
  const equipLines=SLOT_ORDER.filter(s=>equipped[s]).map(s=>`<div><b>${SLOT_NAMES[s]}</b> · ${equipped[s].name}</div>`).join('');
  stats.innerHTML=(equipLines||'<div>장착한 장비가 없습니다.</div>')+`<div style="margin-top:7px"><b>공격력</b> ${Math.round(hero.damage)} · <b>HP</b> ${Math.round(hero.maxHp)} · <b>이속</b> ${hero.speed.toFixed(1)}</div><div><b>치명</b> ${Math.round(hero.crit*100)}% · <b>스킬</b> +${Math.round((hero.power-1)*100)}% · <b>탑방어</b> ${tower.armor}</div>`;
  renderEquipmentPreview();syncHud();
}
function openEquipment(){if(state==='menu'||state==='over'||state==='level'||state==='shop'||state==='pause')return;state='equipment';show('equipment');renderEquipment();}
function closeEquipment(){if(state!=='equipment')return;hide('equipment');state='play';}

function handleKeyDown(e){
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  keys.add(k);
  if(k==='q')skill();
  if(k==='i'){if(state==='shop')closeShop();else openShop();}
  if(k==='e'){if(state==='equipment')closeEquipment();else openEquipment();}
  if(k==='escape'){
    if(state==='play'){state='pause';show('pause');}
    else if(state==='pause'){state='play';hide('pause');}
    else if(state==='shop')closeShop();
    else if(state==='equipment')closeEquipment();
  }
}
window.addEventListener('keydown',handleKeyDown);
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

ui('startBtn').onclick=()=>{hide('start');show('heroSelect');};
ui('warriorBtn').onclick=()=>beginHero('warrior');
ui('mageBtn').onclick=()=>beginHero('mage');
ui('rangerBtn').onclick=()=>beginHero('ranger');
ui('shopBtn').onclick=e=>{e.preventDefault();e.stopPropagation();openShop();};
ui('equipBtn').onclick=e=>{e.preventDefault();e.stopPropagation();openEquipment();};
ui('shopClose').onclick=closeShop;
ui('equipClose').onclick=closeEquipment;
ui('resumeBtn').onclick=()=>{state='play';hide('pause');};
ui('restartBtn').onclick=()=>{hideAll();show('start');state='menu';};

function resize(){renderer.setSize(innerWidth,innerHeight,false);const aspect=Math.max(.5,innerWidth/innerHeight),h=10,w=h*aspect;camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();renderEquipmentPreview();}
window.addEventListener('resize',resize);resize();syncHud();
for(const k of Object.keys(modelURLs))loadModel(k).catch(()=>{});

let last=performance.now();
function animate(now){
  const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;update(dt);crystal.rotation.y+=dt*1.2;crystal.position.y=3+Math.sin(now*.003)*.08;
  const p=window.__equipPreview;if(p&&state==='equipment'){p.root.rotation.y+=dt*.45;p.renderer.render(p.scene,p.camera);}
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
