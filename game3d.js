import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ antialias:false, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.replaceChildren(renderer.domElement);
renderer.domElement.id = 'gameCanvas';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101814);
scene.fog = new THREE.Fog(0x101814, 24, 48);
const camera = new THREE.OrthographicCamera(-12,12,9,-9,0.1,100);
camera.position.set(16,20,16);
camera.lookAt(0,0,0);

scene.add(new THREE.HemisphereLight(0xcde2d6,0x18231d,2.1));
const sun = new THREE.DirectionalLight(0xffe5b0,2.8);
sun.position.set(10,24,8); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-25; sun.shadow.camera.right=25; sun.shadow.camera.top=25; sun.shadow.camera.bottom=-25;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(34,34), new THREE.MeshStandardMaterial({color:0x29402f,roughness:1}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const grid = new THREE.GridHelper(34,34,0x3b5640,0x314735); grid.position.y=.01; scene.add(grid);

const arena = new THREE.Mesh(new THREE.CircleGeometry(8.8,32), new THREE.MeshStandardMaterial({color:0x354f3b,transparent:true,opacity:.72,roughness:1}));
arena.rotation.x=-Math.PI/2; arena.position.y=.02; scene.add(arena);

function box(x,y,z,sx,sy,sz,color){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function cylinder(x,y,z,r,h,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}

// Central keep: procedural 3D castle silhouette so the defense objective is obvious.
const keep=[];
keep.push(box(0,1.4,0,5.6,2.8,5.2,0x687c68));
for(const p of [[-3.1,3.8,-2.5],[3.1,3.8,-2.5],[-3.1,3.8,2.5],[3.1,3.8,2.5]]) keep.push(cylinder(p[0],1.9,p[2],.72,3.8,0x738873));
box(0,1.15,2.7,1.45,2.3,.6,0x3f2c24);
const roof=new THREE.Mesh(new THREE.ConeGeometry(3.4,2.1,4),new THREE.MeshStandardMaterial({color:0x875946,roughness:.9}));roof.position.y=3.85;roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);
for(const p of [[-3.1,3.0,-2.5],[3.1,3.0,-2.5],[-3.1,3.0,2.5],[3.1,3.0,2.5]]){const r=new THREE.Mesh(new THREE.ConeGeometry(1.0,1.6,4),new THREE.MeshStandardMaterial({color:0x8c6250}));r.position.set(p[0],4.5,p[2]);r.rotation.y=Math.PI/4;r.castShadow=true;scene.add(r);}
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0x56d9d0,emissive:0x114947,emissiveIntensity:1.8}));crystal.position.set(0,3.0,2.72);scene.add(crystal);

const modelURLs={
 warrior:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Knight.glb',
 mage:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Mage.glb',
 grunt:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Minion.glb',
 runner:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Rogue.glb',
 caster:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Mage.glb',
 tank:'https://raw.githubusercontent.com/euuuuuuan/hollowmere-public/main/public/models/char/Skeleton_Shield_Large_A.gltf'
};
const loader=new GLTFLoader();
const cache={};
function loadModel(key){
 if(cache[key]) return cache[key];
 cache[key]=new Promise((resolve,reject)=>loader.load(modelURLs[key],g=>resolve(g),undefined,reject));
 return cache[key];
}
function normalizeModel(obj,targetHeight){const b=new THREE.Box3().setFromObject(obj);const h=Math.max(.01,b.max.y-b.min.y);const s=targetHeight/h;obj.scale.setScalar(s);const bb=new THREE.Box3().setFromObject(obj);obj.position.y-=bb.min.y;obj.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});}
function cloneModel(gltf,key,height){const o=gltf.scene.clone(true);normalizeModel(o,height);o.userData.key=key;return o;}
function placeholder(color=.7){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,1.0,4,8),new THREE.MeshStandardMaterial({color}));body.castShadow=true;body.position.y=.65;g.add(body);return g;}

const heroes={warrior:{name:'전사',hp:560,speed:6.0,damage:55,range:2.6,rate:.34,skill:7,color:0xb8793a},mage:{name:'마법사',hp:360,speed:5.2,damage:72,range:5.2,rate:.55,skill:6,color:0x67a2dc},ranger:{name:'궁수',hp:420,speed:6.7,damage:46,range:6.5,rate:.22,skill:8,color:0x6eaa70}};
const enemyData={grunt:{hp:70,speed:1.55,dmg:8,gold:8,xp:10,height:1.25,color:0x96715b,model:'grunt'},runner:{hp:48,speed:3.0,dmg:6,gold:10,xp:14,height:1.15,color:0xad9b52,model:'runner'},tank:{hp:250,speed:.95,dmg:22,gold:26,xp:34,height:1.8,color:0x778b70,model:'runner'},caster:{hp:120,speed:1.3,dmg:15,gold:25,xp:30,height:1.4,color:0x8062a3,model:'caster'},boss:{hp:3200,speed:.72,dmg:60,gold:500,xp:400,height:3.3,color:0xb74149,model:'runner'}};
const gates=[new THREE.Vector3(0,0,-15),new THREE.Vector3(15,0,0),new THREE.Vector3(0,0,15),new THREE.Vector3(-15,0,0)];
const gateNames=['북','동','남','서'];

const hero={pos:new THREE.Vector3(0,0,7),hp:560,maxHp:560,speed:6,damage:55,range:2.6,rate:.34,attack:0,skill:0,crit:.08,power:1,lifesteal:0,type:'warrior',obj:null};
const tower={hp:3200,maxHp:3200,armor:0};
const enemies=[]; const projectiles=[]; const effects=[];
let state='menu',wave=1,side=0,spawned=0,spawnTimer=.3,gold=500,xp=0,level=1,nextXP=100,last=performance.now();
const books={str:0,agi:0,int:0};
const items=[['강철검','공격력 +35',180,()=>hero.damage+=35],['질주화','이동속도 +0.9',220,()=>hero.speed+=.9],['수호갑옷','최대 HP +180',260,()=>{hero.maxHp+=180;hero.hp+=180}],['흡혈부적','타격 회복 +3',320,()=>hero.lifesteal+=3],['마력핵','스킬 피해 +60%',360,()=>hero.power+=.6],['용사의 반지','공격력 +20 · 치명 +8%',420,()=>{hero.damage+=20;hero.crit+=.08}]];

function ui(id){return document.getElementById(id)}
function show(id){ui(id).classList.remove('hidden')} function hide(id){ui(id).classList.add('hidden')}
function hideAll(){['start','heroSelect','levelUp','shop','pause','gameover'].forEach(hide)}
function setInfo(s){ui('loadingInfo').textContent=s}

async function setHero(type){
 const d=heroes[type]; hero.type=type; Object.assign(hero,{maxHp:d.hp,hp:d.hp,speed:d.speed,damage:d.damage,range:d.range,rate:d.rate,crit:type==='ranger'?.16:.08,power:1,lifesteal:0,attack:0,skill:0,pos:new THREE.Vector3(0,0,7)});
 if(hero.obj)scene.remove(hero.obj);
 try{setInfo('3D 영웅 불러오는 중…');const g=await loadModel(type==='ranger'?'warrior':type);hero.obj=cloneModel(g,type,2.3);hero.obj.position.copy(hero.pos);scene.add(hero.obj);}catch{hero.obj=placeholder(d.color);hero.obj.position.copy(hero.pos);scene.add(hero.obj);}
 resetRun(); hideAll();state='play';
}
function resetRun(){wave=1;side=0;spawned=0;spawnTimer=.4;gold=500;xp=0;level=1;nextXP=100;tower.hp=tower.maxHp;enemies.splice(0);projectiles.splice(0);effects.splice(0);books.str=books.agi=books.int=0;hero.pos.set(0,0,7);if(hero.obj)hero.obj.position.copy(hero.pos);say('웨이브 1 · 북쪽 적습');}
function say(t){ui('notice').textContent=t;ui('notice').classList.add('show');clearTimeout(window.__nt);window.__nt=setTimeout(()=>ui('notice').classList.remove('show'),1100)}
function enemyCount(){return 7+wave*2+Math.floor(wave/3)}

async function spawnEnemy(){
 if(spawned>=enemyCount())return;
 let kind='grunt',r=Math.random();if(wave%5===0&&spawned===enemyCount()-1)kind='boss';else if(r<.15)kind='runner';else if(r<.30)kind='tank';else if(r<.42)kind='caster';
 const d=enemyData[kind],gate=gates[side],e={kind,pos:gate.clone(),hp:d.hp*(1+wave*.13),maxHp:d.hp*(1+wave*.13),speed:d.speed*(1+wave*.008),dmg:d.dmg*(1+wave*.05),gold:d.gold,xp:d.xp,obj:null,bar:null,dead:false};e.pos.x+=(Math.random()-.5)*1.4;e.pos.z+=(Math.random()-.5)*1.4;
 try{const g=await loadModel(d.model);e.obj=cloneModel(g,kind,d.height)}catch{e.obj=placeholder(d.color)}e.obj.position.copy(e.pos);if(kind==='boss')e.obj.scale.multiplyScalar(1.2);scene.add(e.obj);makeBar(e);enemies.push(e);spawned++;
}
function makeBar(e){const bg=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.12),new THREE.MeshBasicMaterial({color:0x2b1717}));const fg=new THREE.Mesh(new THREE.PlaneGeometry(1.06,.08),new THREE.MeshBasicMaterial({color:0x67d678}));fg.position.z=.01;const g=new THREE.Group();g.add(bg,fg);g.userData.fg=fg;g.position.set(0,e.kind==='boss'?3.7:2.0,0);g.rotation.x=-.35;e.obj.add(g);e.bar=g;}
function hit(e,d){if(e.dead)return;e.hp-=d;flash(e);if(e.hp<=0)kill(e);}
function flash(e){if(!e.obj)return;e.obj.traverse(n=>{if(n.isMesh&&n.material&&n.material.color){n.userData.base=n.userData.base||n.material.color.getHex();n.material.emissive=new THREE.Color(0xffffff);n.material.emissiveIntensity=1;setTimeout(()=>{if(n.material)n.material.emissiveIntensity=0},70)}})}
function kill(e){if(e.dead)return;e.dead=true;gold+=e.gold;gainXP(e.xp);burst(e.pos,e.kind==='boss'?0xeac15c:0xdce8de,e.kind==='boss'?28:8);}
function gainXP(n){xp+=n;while(xp>=nextXP){xp-=nextXP;level++;nextXP=Math.floor(nextXP*1.28);openLevelUp();break;}}
function openLevelUp(){state='level';const box=ui('levelChoices');box.replaceChildren();const choices=[['공격력 +22',()=>hero.damage+=22],['최대 HP +120',()=>{hero.maxHp+=120;hero.hp+=120}],['이동속도 +0.35',()=>hero.speed+=.35],['치명타 +5%',()=>hero.crit+=.05]];choices.sort(()=>Math.random()-.5).slice(0,3).forEach(a=>{const b=document.createElement('button');b.className='upgradeChoice';b.innerHTML='<b>▣</b><span>'+a[0]+'</span>';b.onclick=()=>{a[1]();hide('levelUp');state='play';say('레벨 '+level);};box.appendChild(b)});show('levelUp');}
function shoot(target){const mat=new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x69dcf0:0xe8d171});const m=new THREE.Mesh(new THREE.SphereGeometry(.10,6,6),mat);m.position.copy(hero.obj?.position||hero.pos);scene.add(m);projectiles.push({m,target,dmg:hero.damage*(Math.random()<hero.crit?2:1)});}
function attack(){if(hero.attack>0)return;let target=null,best=hero.range;for(const e of enemies)if(!e.dead){const d=hero.pos.distanceTo(e.pos);if(d<best){best=d;target=e}}if(!target)return;hero.attack=hero.rate;if(hero.type==='warrior')hit(target,hero.damage*(Math.random()<hero.crit?2:1));else shoot(target);if(hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal)}
function skill(){if(state!=='play'||hero.skill>0)return;hero.skill=heroes[hero.type].skill;const radius=hero.type==='warrior'?4.2:5.8;const mult=(hero.type==='mage'?5:hero.type==='ranger'?4:6)*hero.power;for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<radius)hit(e,hero.damage*mult);const ring=new THREE.Mesh(new THREE.RingGeometry(.5,radius,40),new THREE.MeshBasicMaterial({color:hero.type==='mage'?0x65d9ee:hero.type==='ranger'?0x82d36e:0xf0b94c,transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(hero.pos.x,.06,hero.pos.z);scene.add(ring);effects.push({o:ring,life:.45,max:.45});say('필살기 발동');}
function move(dt){let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(!x&&!z)return;const v=new THREE.Vector3(x,0,z).normalize().multiplyScalar(hero.speed*dt);hero.pos.add(v);hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-13.5,13.5);hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-13.5,13.5);if(hero.obj){hero.obj.position.copy(hero.pos);hero.obj.rotation.y=Math.atan2(v.x,v.z);}}
function update(dt){if(state!=='play')return;hero.attack=Math.max(0,hero.attack-dt);hero.skill=Math.max(0,hero.skill-dt);move(dt);attack();spawnTimer-=dt;if(spawnTimer<=0){spawnTimer=Math.max(.28,.62-wave*.008);spawnEnemy();}
 for(const p of projectiles){if(!p.target||p.target.dead){p.m.visible=false;continue}const to=new THREE.Vector3(p.target.pos.x,p.target.pos.y+0.8,p.target.pos.z);p.m.position.lerp(to,Math.min(1,dt*16));if(p.m.position.distanceTo(to)<.25){hit(p.target,p.dmg);p.m.visible=false}}
 for(let i=projectiles.length-1;i>=0;i--)if(!projectiles[i].m.visible){scene.remove(projectiles[i].m);projectiles.splice(i,1)}
 let alive=0;for(const e of enemies)if(!e.dead){alive++;const d=e.pos.distanceTo(new THREE.Vector3(0,0,0));if(d<2.5)tower.hp-=e.dmg*dt;else e.pos.add(e.pos.clone().normalize().multiplyScalar(-e.speed*dt));if(e.obj)e.obj.position.copy(e.pos);if(e.bar)e.bar.userData.fg.scale.x=Math.max(.02,e.hp/e.max)}
 for(const f of effects){f.life-=dt;f.o.scale.setScalar(1+(f.max-f.life)*.9)}for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0){scene.remove(effects[i].o);effects.splice(i,1)}
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead){if(enemies[i].obj)scene.remove(enemies[i].obj);enemies.splice(i,1)}
 if(spawned>=enemyCount()&&alive===0){side=(side+1)%4;spawned=0;if(side===0){wave++;gold+=100;tower.hp=Math.min(tower.maxHp,tower.hp+160);say('웨이브 '+wave+' 시작');}else say(gateNames[side]+' 방향 적습');spawnTimer=.5;}
 towerMeshPulse();syncHud();if(tower.hp<=0){tower.hp=0;state='over';ui('overDetail').textContent=`웨이브 ${wave} · 레벨 ${level} · ${gold} G · ${heroes[hero.type].name}`;show('gameover');}}
function towerMeshPulse(){crystal.rotation.y+=.01;crystal.position.y=3+.08*Math.sin(performance.now()*.003);}
function burst(pos,color,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.07),new THREE.MeshBasicMaterial({color}));m.position.set(pos.x,pos.y+.5,pos.z);scene.add(m);effects.push({o:m,life:.45,max:.45,v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5)});}}
function updateFx(dt){for(const f of effects)if(f.v){f.o.position.add(f.v.clone().multiplyScalar(dt));f.v.multiplyScalar(.91)}}
function syncHud(){ui('wave').textContent='WAVE '+wave;ui('direction').textContent=gateNames[side]+' 방향';ui('waveCount').textContent=spawned+' / '+enemyCount();ui('level').textContent='LV '+level;ui('xp').textContent=xp+' / '+nextXP;ui('gold').textContent=gold+' G';ui('heroName').textContent=heroes[hero.type].name;ui('heroHpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;ui('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp;ui('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';ui('heroBar').style.width=Math.max(0,hero.hp/hero.maxHp*100)+'%';ui('skillText').textContent=hero.skill>0?hero.skill.toFixed(1)+'s':'READY';}
function renderShop(){ui('shopGold').textContent=gold+' G';const box=ui('shopItems');box.replaceChildren();items.forEach((a,i)=>{const b=document.createElement('button');b.className='shopItem';b.innerHTML='<strong>'+a[0]+'</strong><span>'+a[1]+'</span><em>'+a[2]+' G</em>';b.onclick=()=>{if(gold<a[2])return;gold-=a[2];a[3]();renderShop();say(a[0]+' 구매');};box.appendChild(b)});const bb=ui('bookLine');bb.replaceChildren();[['str','힘 +8 공격','damage',8],['agi','민첩 +0.3 속도','speed',.3],['int','지능 +8% 스킬','power',.08]].forEach(a=>{const b=document.createElement('button');b.className='bookBtn';const cost=100+books[a[0]]*50;b.textContent=a[1]+' · '+cost+'G';b.onclick=()=>{if(gold<cost)return;gold-=cost;books[a[0]]++;hero[a[2]]+=a[3];renderShop()};bb.appendChild(b)})}
const keys=new Set();addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k==='q')skill();if(k==='i'&&state!=='menu'&&state!=='over'&&state!=='level')toggleShop();if(k==='escape'){if(state==='play'){state='pause';show('pause')}else if(state==='pause'){state='play';hide('pause')}else if(state==='shop'){toggleShop()}}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function toggleShop(){if(state==='shop'){state='play';hide('shop');return}state='shop';renderShop();show('shop')}
ui('startBtn').onclick=()=>{hide('start');show('heroSelect')};ui('warriorBtn').onclick=()=>setHero('warrior');ui('mageBtn').onclick=()=>setHero('mage');ui('rangerBtn').onclick=()=>setHero('ranger');ui('shopClose').onclick=toggleShop;ui('resumeBtn').onclick=()=>{state='play';hide('pause')};ui('restartBtn').onclick=()=>{menu()};
function menu(){state='menu';hideAll();show('start')}
function resize(){renderer.setSize(innerWidth,innerHeight);const aspect=innerWidth/innerHeight;const h=9,w=h*aspect;camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
loadModel('warrior').catch(()=>{});loadModel('grunt').catch(()=>{});loadModel('runner').catch(()=>{});loadModel('caster').catch(()=>{});

function animate(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);updateFx(dt);renderer.render(scene,camera);requestAnimationFrame(animate)}
requestAnimationFrame(animate);
