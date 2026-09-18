/* ═══════════════════════════════════════════════════════════
   X HERO DEFENSE — Warcraft X Hero 스타일 3D 디펜스 게임
   GLTF 3D 캐릭터 모델 (Soldier, Michelle, Robot, Xbot) + 애니메이션 믹서 + 수평 체력바
═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const $=id=>document.getElementById(id);
const show=id=>$(id)?.classList.remove('hidden');
const hide=id=>$(id)?.classList.add('hidden');
const hideAll=()=>['start','heroSelect','skillUp','shop','pause','gameover','victory','deadOverlay'].forEach(hide);

/* ─── CONFIG ─── */
const MAX_WAVE=30,MAP_H=15,TWR_RNG=6.5,TWR_DMG=28,TWR_RATE=1.0,RESPAWN=5;
const GATES=[new THREE.Vector3(0,0,-15),new THREE.Vector3(15,0,0),new THREE.Vector3(0,0,15),new THREE.Vector3(-15,0,0)];
const GNAMES=['북','동','남','서'];
const SK='QWER'.split('');

/* ─── HEROES ─── */
const HEROES={
  warrior:{name:'전사',color:0xd97706,hp:800,spd:5.5,dmg:55,rng:2.8,rate:.38,
    desc:'근접 · 높은 체력 · 탱커',
    skills:{
      Q:{name:'충격파',desc:'주변 범위 피해',cd:[8,7,6,5],mul:[2,2.8,3.6,4.5],r:4.5,type:'aoe'},
      W:{name:'방어 자세',desc:'받는 피해 감소',cd:[14,12,10,8],dur:[3,4,5,6],val:[.3,.4,.5,.6],type:'buff_def'},
      E:{name:'도발',desc:'주변 적 끌어모음',cd:[12,11,10,9],r:[5,6,7,8],dur:[2,2.5,3,3.5],type:'taunt'},
      R:{name:'대지진동',desc:'거대 범위 피해+기절',cd:[45,38,32],mul:[6,8,10],r:7,type:'aoe_stun',ulti:1}}},
  mage:{name:'마법사',color:0x2563eb,hp:450,spd:5,dmg:70,rng:5.5,rate:.55,
    desc:'원거리 · 광역 · 높은 스킬 피해',
    skills:{
      Q:{name:'파이어볼',desc:'폭발 화염구',cd:[6,5,4.5,4],mul:[2.5,3.2,4,5],r:2.5,type:'proj_aoe'},
      W:{name:'블리자드',desc:'범위 지속 피해+둔화',cd:[14,12,10,8],mul:[.8,1.2,1.6,2],r:4,dur:4,type:'zone'},
      E:{name:'마나 실드',desc:'피해 흡수 보호막',cd:[16,14,12,10],val:[100,160,220,300],type:'shield_self'},
      R:{name:'메테오',desc:'하늘에서 운석 낙하',cd:[50,42,35],mul:[8,11,14],r:5.5,type:'aoe',ulti:1}}},
  ranger:{name:'궁수',color:0x16a34a,hp:500,spd:6.5,dmg:45,rng:7,rate:.22,
    desc:'원거리 · 빠른 공격 · 긴 사거리',
    skills:{
      Q:{name:'다중 사격',desc:'여러 적 동시 공격',cd:[7,6,5.5,5],cnt:[3,4,5,6],mul:[1,1.2,1.4,1.6],type:'multi'},
      W:{name:'독화살',desc:'공격에 독 부여',cd:[10,9,8,7],dot:[5,8,12,16],dur:[4,5,6,7],type:'poison_buff'},
      E:{name:'회피',desc:'회피율 증가',cd:[18,15,13,11],dur:[4,5,6,7],val:[.3,.4,.5,.6],type:'buff_eva'},
      R:{name:'화살 비',desc:'넓은 범위 화살 비',cd:[45,38,32],mul:[5,7,10],r:6.5,type:'aoe',ulti:1}}},
  assassin:{name:'암살자',color:0x9333ea,hp:420,spd:7,dmg:65,rng:2.2,rate:.30,
    desc:'근접 · 높은 폭딜 · 은신',
    skills:{
      Q:{name:'단검 투척',desc:'원거리 단검 공격',cd:[5,4.5,4,3.5],mul:[2,2.5,3,3.8],type:'proj_single'},
      W:{name:'은신',desc:'은신+다음 공격 강화',cd:[16,14,12,10],mul:[3,4,5,6],dur:[3,4,5,6],type:'stealth'},
      E:{name:'급소 공격',desc:'치명타 확률 증가 (패시브)',cd:[0,0,0,0],val:[.08,.12,.16,.20],type:'passive'},
      R:{name:'암살',desc:'대상에게 거대 피해',cd:[40,34,28],mul:[10,14,18],rng:3.5,type:'execute',ulti:1}}},
  paladin:{name:'성기사',color:0xca8a04,hp:700,spd:5.2,dmg:50,rng:2.5,rate:.42,
    desc:'근접 · 치유 · 수호탑 보호',
    skills:{
      Q:{name:'신성 타격',desc:'피해+자신 회복',cd:[7,6,5.5,5],mul:[2,2.5,3,3.8],heal:[.5,.6,.7,.8],r:3.5,type:'holy'},
      W:{name:'치유',desc:'자신 HP 회복',cd:[12,10,9,8],heal:[1.5,2,2.8,3.5],type:'heal'},
      E:{name:'보호막',desc:'수호탑에 보호막',cd:[20,18,15,13],val:[150,250,350,500],type:'shield_tower'},
      R:{name:'부활',desc:'사망 시 즉시 부활(1회)',cd:[90,75,60],type:'revive',ulti:1}}}
};

/* ─── ENEMIES ─── */
const ETYPES={
  grunt :{name:'해골병사',hp:80,spd:1.6,dmg:10,gold:10,xp:12,h:1.4,color:0xe4e4e7},
  runner:{name:'해골도적',hp:55,spd:3.0,dmg:7,gold:12,xp:15,h:1.25,color:0xf4f4f5},
  tank  :{name:'해골전사',hp:280,spd:.9,dmg:25,gold:30,xp:38,h:1.9,color:0x475569},
  caster:{name:'해골마법사',hp:140,spd:1.3,dmg:18,gold:28,xp:32,h:1.5,color:0x7e22ce},
  brute :{name:'거대골렘',hp:500,spd:.7,dmg:40,gold:55,xp:60,h:2.4,color:0x334155},
  boss  :{name:'보스 Pit Lord',hp:4000,spd:.55,dmg:75,gold:600,xp:500,h:3.8,color:0x991b1b}
};

/* ─── ITEMS ─── */
const ITEMS=[
  {id:'sword',name:'강철검',cost:150,desc:'공격력 +20',stats:{damage:20},tier:1},
  {id:'staff',name:'마력석',cost:150,desc:'스킬 피해 +15%',stats:{power:.15},tier:1},
  {id:'shield',name:'나무 방패',cost:120,desc:'HP +80',stats:{maxHp:80},tier:1},
  {id:'boots',name:'가죽 장화',cost:120,desc:'이동속도 +0.5',stats:{speed:.5},tier:1},
  {id:'ring',name:'힘의 반지',cost:180,desc:'공격력 +12, 치명타 +5%',stats:{damage:12,crit:.05},tier:1},
  {id:'cloak',name:'그림자 망토',cost:160,desc:'회피 +8%, 이속 +0.3',stats:{evasion:.08,speed:.3},tier:1},
  {id:'amulet',name:'생명 부적',cost:200,desc:'흡혈 +4, HP +60',stats:{lifesteal:4,maxHp:60},tier:1},
  {id:'gem',name:'속도의 보석',cost:180,desc:'공격속도 +12%',stats:{rateBonus:.12},tier:1},
];
const RECIPES=[
  {id:'magic_sword',name:'마법검',desc:'공격력 +45, 스킬 +15%',stats:{damage:45,power:.15},tier:2,mats:['sword','staff'],extra:0},
  {id:'guardian',name:'수호 갑옷',desc:'HP +220, 방어 +3',stats:{maxHp:220,armor:3},tier:2,mats:['shield','shield'],extra:0},
  {id:'swift',name:'신속 부츠',desc:'이속 +1.2, 공격력 +12',stats:{speed:1.2,damage:12},tier:2,mats:['boots','ring'],extra:0},
  {id:'shadow',name:'그림자 검',desc:'공격력 +30, 치명 +12%',stats:{damage:30,crit:.12},tier:2,mats:['sword','cloak'],extra:0},
  {id:'vamp',name:'흡혈 구슬',desc:'흡혈 +8, 공속 +12%',stats:{lifesteal:8,rateBonus:.12},tier:2,mats:['amulet','gem'],extra:0},
  {id:'arcane',name:'비전 집중체',desc:'스킬 +35%, 공속 +12%',stats:{power:.35,rateBonus:.12},tier:2,mats:['staff','gem'],extra:0},
  {id:'divine',name:'신성검',desc:'공격력 +80, 스킬 +25%, 치명 +10%',stats:{damage:80,power:.25,crit:.1},tier:3,mats:['magic_sword','ring'],extra:100},
  {id:'titan',name:'타이탄 갑옷',desc:'HP +500, 방어 +8',stats:{maxHp:500,armor:8},tier:3,mats:['guardian','shield'],extra:150},
  {id:'god_boots',name:'천공 부츠',desc:'이속 +2, 공격력 +25, 회피 +10%',stats:{speed:2,damage:25,evasion:.1},tier:3,mats:['swift','boots'],extra:100},
];

/* ═══ THREE.JS SETUP ═══ */
const root=$('canvas');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.id='gameCanvas';root.replaceChildren(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070b12);
scene.fog=new THREE.FogExp2(0x070b12, 0.022);

const camera=new THREE.OrthographicCamera(-14,14,10,-10,.1,100);
camera.position.set(16,20,16);camera.lookAt(0,0,0);

scene.add(new THREE.HemisphereLight(0xbae6fd,0x0f172a,1.9));
const sun=new THREE.DirectionalLight(0xffedd5,2.6);
sun.position.set(10,24,12);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;
scene.add(sun);

function mat(c,e=0,rough=.4,metal=.4){
  return new THREE.MeshStandardMaterial({
    color:c,roughness:rough,metalness:metal,
    emissive:e?c:0,emissiveIntensity:e?0.85:0
  });
}
function addBox(p,s,c){const m=new THREE.Mesh(new THREE.BoxGeometry(...s),mat(c));m.position.set(...p);m.castShadow=m.receiveShadow=true;scene.add(m);return m}
function addCyl(p,r,h,c){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat(c));m.position.set(...p);m.castShadow=m.receiveShadow=true;scene.add(m);return m}

/* Ground & Arena */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x0d1813,roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

const arena=new THREE.Mesh(new THREE.CircleGeometry(9.5,48),new THREE.MeshStandardMaterial({color:0x1b2820,roughness:.8}));
arena.rotation.x=-Math.PI/2;arena.position.y=.02;arena.receiveShadow=true;scene.add(arena);

const innerRings=new THREE.Mesh(new THREE.RingGeometry(9.3,9.5,48),new THREE.MeshBasicMaterial({color:0x0284c7,transparent:true,opacity:.4,side:THREE.DoubleSide}));
innerRings.rotation.x=-Math.PI/2;innerRings.position.y=.03;scene.add(innerRings);

/* ═══ MAGICAL ARCANE CRYSTAL SPIRE TOWER (중앙 마법 수정탑) ═══ */
const towerGroup = new THREE.Group();

// 1. Foundation Base & Octagonal Runed Podium
const towerBase = new THREE.Mesh(
  new THREE.CylinderGeometry(3.2, 3.8, 0.8, 8),
  mat(0x1e293b, 0, 0.4, 0.8)
);
towerBase.position.y = 0.4;
towerBase.receiveShadow = true;
towerBase.castShadow = true;
towerGroup.add(towerBase);

// Base Outer Decorative Gold Rune Ring
const baseGoldRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.5, 0.08, 8, 32),
  mat(0xf59e0b, 0.8, 0.2, 0.9)
);
baseGoldRing.rotation.x = Math.PI / 2;
baseGoldRing.position.y = 0.82;
towerGroup.add(baseGoldRing);

// 2. Middle Podium & Stairs
const podium = new THREE.Mesh(
  new THREE.CylinderGeometry(2.3, 2.8, 1.2, 8),
  mat(0x334155, 0, 0.5, 0.6)
);
podium.position.y = 1.4;
podium.castShadow = true;
podium.receiveShadow = true;
towerGroup.add(podium);

// 3. Spire Tower Shaft (Arcane Spire Body)
const shaft = new THREE.Mesh(
  new THREE.CylinderGeometry(1.4, 2.0, 3.8, 12),
  mat(0x0f172a, 0, 0.3, 0.8)
);
shaft.position.y = 3.9;
shaft.castShadow = true;
shaft.receiveShadow = true;
towerGroup.add(shaft);

// Spire Wall Decorative Pillars (4 Corner Gothic Buttresses with Glow Orbs)
for (let i = 0; i < 4; i++) {
  const angle = (i * Math.PI) / 2;
  const px = Math.cos(angle) * 1.85;
  const pz = Math.sin(angle) * 1.85;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.4, 4.2, 8),
    mat(0x3b82f6, 0.4, 0.2, 0.8)
  );
  pillar.position.set(px, 3.8, pz);
  pillar.castShadow = true;
  towerGroup.add(pillar);

  const pOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  pOrb.position.set(px, 6.0, pz);
  towerGroup.add(pOrb);
}

// 4. Upper Spire Crown Platform & Arches
const crown = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 1.2, 0.6, 8),
  mat(0xf59e0b, 0.6, 0.3, 0.9)
);
crown.position.y = 5.9;
crown.castShadow = true;
towerGroup.add(crown);

for (let i = 0; i < 4; i++) {
  const angle = (i * Math.PI) / 2 + Math.PI / 4;
  const arch = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 1.6, 6),
    mat(0xd97706, 0.6)
  );
  arch.rotation.z = Math.PI;
  arch.position.set(Math.cos(angle) * 1.2, 6.8, Math.sin(angle) * 1.2);
  towerGroup.add(arch);
}

// 5. Giant Floating Arcane Crystal Core (거대 마법 수정체)
const crystalMat = new THREE.MeshPhongMaterial({
  color: 0x06b6d4,
  emissive: 0x0891b2,
  specular: 0xffffff,
  shininess: 100,
  transparent: true,
  opacity: 0.92
});
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), crystalMat);
crystal.position.set(0, 7.6, 0);
crystal.castShadow = true;
towerGroup.add(crystal);

// Floating Secondary Mini Crystals Orbiting Core
const miniCrystals = [];
for (let i = 0; i < 3; i++) {
  const mc = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
  );
  mc.position.set(0, 7.6, 0);
  towerGroup.add(mc);
  miniCrystals.push(mc);
}

// Dual Floating Arcane Energy Rings
const crystalRing1 = new THREE.Mesh(
  new THREE.TorusGeometry(1.7, 0.05, 12, 48),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
);
crystalRing1.rotation.x = Math.PI / 3;
crystalRing1.position.set(0, 7.6, 0);
towerGroup.add(crystalRing1);

const crystalRing2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.3, 0.04, 12, 48),
  new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 })
);
crystalRing2.rotation.x = -Math.PI / 4;
crystalRing2.position.set(0, 7.6, 0);
towerGroup.add(crystalRing2);

// Point Light from Tower Crystal
const crystalLight = new THREE.PointLight(0x06b6d4, 2.5, 18);
crystalLight.position.set(0, 7.6, 0);
towerGroup.add(crystalLight);

scene.add(towerGroup);

/* Gate Portals */
for(const g of GATES) {
  addBox([g.x,g.y+.45,g.z],[2.8,.9,1.1],0x1e293b);
  const gateRune=new THREE.Mesh(new THREE.CircleGeometry(1.4,24),new THREE.MeshBasicMaterial({color:0xd97706,transparent:true,opacity:.38}));
  gateRune.rotation.x=-Math.PI/2;gateRune.position.set(g.x,.04,g.z);scene.add(gateRune);
}

const twrRing=new THREE.Mesh(new THREE.RingGeometry(TWR_RNG-.12,TWR_RNG,64),new THREE.MeshBasicMaterial({color:0x06b6d4,transparent:true,opacity:.15,side:THREE.DoubleSide}));
twrRing.rotation.x=-Math.PI/2;twrRing.position.y=.03;scene.add(twrRing);

/* ═══ GLTF 3D MODEL LOADER SYSTEM ═══ */
const loadedGLTFModels = {};
const gltfLoader = (typeof THREE.GLTFLoader !== 'undefined') ? new THREE.GLTFLoader() : null;

if (gltfLoader) {
  const modelsToLoad = [
    { key: 'wc_knight', url: './wc_knight.glb' },
    { key: 'wc_barbarian', url: './wc_barbarian.glb' },
    { key: 'wc_mage', url: './wc_mage.glb' },
    { key: 'wc_rogue', url: './wc_rogue.glb' },
    { key: 'wc_skeleton_warrior', url: './wc_skeleton_warrior.glb' },
    { key: 'wc_skeleton_minion', url: './wc_skeleton_minion.glb' },
    { key: 'wc_skeleton_mage', url: './wc_skeleton_mage.glb' },
    { key: 'wc_skeleton_rogue', url: './wc_skeleton_rogue.glb' }
  ];
  modelsToLoad.forEach(item => {
    gltfLoader.load(item.url, gltf => {
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      loadedGLTFModels[item.key] = gltf;
    }, null, err => { console.warn('GLTF load error:', item.key); });
  });
}

/* ═══ GAME STATE ═══ */
let state='menu';
let hero={};
let tower={hp:5000,maxHp:5000,shield:0,atkTimer:0};
let wave=1,gold=500,spawned=0,spawnClock=.5;
let enemies=[],projectiles=[],effects=[],zones=[];
let inventory=[];
let selectedInvIndex=-1;
let deadTimer=0,curSides=[0];
const keys=new Set();
let shopTab='buy';

function initHero(type){
  const d=HEROES[type];
  hero={type,pos:new THREE.Vector3(0,0,7),
    hp:d.hp,maxHp:d.hp,speed:d.spd,damage:d.dmg,range:d.rng,rate:d.rate,
    atkTimer:0,crit:.08,power:1,lifesteal:0,evasion:0,armor:0,rateBonus:0,
    level:1,xp:0,nextXP:100,skillPoints:1,
    skillLevels:{Q:0,W:0,E:0,R:0},skillCDs:{Q:0,W:0,E:0,R:0},
    buffs:[],dead:false,facing:new THREE.Vector3(0,0,-1),
    obj:null,anim:null,isMoving:false,
    shield:0,poison:0,poisonDmg:0,stealthBonus:0,hasRevive:false};
}

/* ═══ FLOATING DAMAGE TEXT EMITTER ═══ */
function showDamageText(pos, text, color='#ffffff', isCrit=false) {
  const p = pos.clone(); p.y += 1.8;
  p.project(camera);
  const x = (p.x * .5 + .5) * window.innerWidth;
  const y = (-(p.y * .5) + .5) * window.innerHeight;
  const el = document.createElement('div');
  el.className = 'dmgText' + (isCrit ? ' crit' : '');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = color;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function createGltfModelContainer(gltfData, targetHeight = 1.8) {
  const container = new THREE.Group();
  const model = (typeof THREE.SkeletonUtils !== 'undefined')
              ? THREE.SkeletonUtils.clone(gltfData.scene)
              : gltfData.scene.clone(true);
  
  // Calculate bounding box height of unscaled raw GLTF scene
  const bbox = new THREE.Box3().setFromObject(gltfData.scene);
  const rawHeight = Math.max(0.1, bbox.max.y - bbox.min.y);
  
  // Scale container dynamically so final model height matches targetHeight in world space
  const scaleFactor = targetHeight / rawHeight;
  container.scale.setScalar(scaleFactor);
  container.add(model);

  // Clean animation clips: strip scale tracks that override model scaling
  const animations = (gltfData.animations || []).map(clip => {
    const clonedClip = clip.clone();
    clonedClip.tracks = clonedClip.tracks.filter(t => !t.name.endsWith('.scale') && !t.name.includes('scale'));
    return clonedClip;
  });

  return { container, model, animations };
}

/* ═══ 3D GLTF & PROCEDURAL HERO BUILDER ═══ */
function makeHero(){
  if(hero.obj)scene.remove(hero.obj);
  const g=new THREE.Group(),d=HEROES[hero.type];

  // 1. Hero Selection Ring (Warcraft 3 style under feet aura)
  const auraGroup=new THREE.Group();
  const auraInner=new THREE.Mesh(
    new THREE.RingGeometry(0.3,0.76,32),
    new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.6,side:THREE.DoubleSide})
  );
  auraInner.rotation.x=-Math.PI/2;auraInner.position.y=0.04;
  
  const auraOuter=new THREE.Mesh(
    new THREE.TorusGeometry(0.8,0.045,8,32),
    new THREE.MeshBasicMaterial({color:d.color})
  );
  auraOuter.rotation.x=-Math.PI/2;auraOuter.position.y=0.04;
  auraGroup.add(auraInner,auraOuter);g.add(auraGroup);

  let mixer = null, activeAction = null, walkAction = null, attackAction = null;

  // Warcraft 3 Fantasy Hero Model Mapping
  const gltfKeyMap = {
    warrior: 'wc_knight',
    paladin: 'wc_knight',
    barbarian: 'wc_barbarian',
    mage: 'wc_mage',
    ranger: 'wc_rogue',
    assassin: 'wc_rogue'
  };
  const gltfKey = gltfKeyMap[hero.type] || 'wc_knight';
  const gltfData = loadedGLTFModels[gltfKey];

  if (gltfData) {
    const { container: modelContainer, model, animations } = createGltfModelContainer(gltfData, 1.8);
    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    g.add(modelContainer);

    if (animations && animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const idleClip = animations.find(a => /idle/i.test(a.name)) || animations[0];
      const walkClip = animations.find(a => /walking|running|walk|run/i.test(a.name)) || animations[1] || idleClip;
      const attackClip = animations.find(a => /attack|slash|swing|punch|hit|shoot|cast|kick/i.test(a.name)) || animations.find(a => a !== idleClip && a !== walkClip) || animations[2] || animations[0];
      
      activeAction = mixer.clipAction(idleClip);
      if (idleClip !== walkClip) walkAction = mixer.clipAction(walkClip);
      if (attackClip) attackAction = mixer.clipAction(attackClip);
      activeAction.play();
    }

  } else {
    // High-Detail Fallback Procedural Model
    const bodyNode=new THREE.Group();g.add(bodyNode);
    const torsoMat=mat(d.color, 0, 0.35, 0.4);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.28,0.7,12),torsoMat);
    torso.position.y=0.92;torso.castShadow=true;bodyNode.add(torso);

    const chestPlate=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,0.36),mat(0xf59e0b, 0.2, 0.2, 0.8));
    chestPlate.position.set(0,1.0,0.02);bodyNode.add(chestPlate);

    const headGroup=new THREE.Group();headGroup.position.y=1.48;
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.24,14,14),mat(0xffdfc4,0,.7,0));
    head.castShadow=true;headGroup.add(head);

    const legL=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.11,0.6,10),mat(0x0f172a,0,.5,.5));
    legL.position.set(-0.17,0.3,0);legL.castShadow=true;
    const legR=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.11,0.6,10),mat(0x0f172a,0,.5,.5));
    legR.position.set(0.17,0.3,0);legR.castShadow=true;
    bodyNode.add(legL,legR);

    const armL=new THREE.Group();armL.position.set(-0.38,1.2,0);
    const armLMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.09,0.54,10),torsoMat);
    armLMesh.position.y=-0.22;armLMesh.castShadow=true;armL.add(armLMesh);

    const armR=new THREE.Group();armR.position.set(0.38,1.2,0);
    const armRMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.09,0.54,10),torsoMat);
    armRMesh.position.y=-0.22;armRMesh.castShadow=true;armR.add(armRMesh);

    bodyNode.add(armL,armR);
  }

  g.position.copy(hero.pos);
  scene.add(g);
  hero.obj=g;
  hero.anim={ auraGroup, mixer, activeAction, walkAction, attackAction, isWalking:false, attackTimer:0 };
}

/* ═══ 3D GLTF & PROCEDURAL MONSTER BUILDER ═══ */
function makeEnemy(e){
  const g=new THREE.Group();
  const scale=e.h/1.3;
  let mixer = null, activeAction = null, walkAction = null, attackAction = null;

  // Warcraft 3 Undead Scourge Monster Model Mapping
  const isBoss = (e.kind === 'boss');
  const isBrute = (e.kind === 'brute');
  const gltfKeyMap = {
    boss: 'wc_barbarian',
    brute: 'wc_skeleton_warrior',
    tank: 'wc_skeleton_warrior',
    runner: 'wc_skeleton_rogue',
    caster: 'wc_skeleton_mage',
    grunt: 'wc_skeleton_minion'
  };
  const gltfKey = gltfKeyMap[e.kind] || 'wc_skeleton_minion';
  const gltfData = loadedGLTFModels[gltfKey];

  if (gltfData) {
    const targetH = isBoss ? 3.2 : isBrute ? 2.2 : e.h;
    const { container: modelContainer, model, animations } = createGltfModelContainer(gltfData, targetH);

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (isBoss) {
          child.material = child.material.clone();
          child.material.color.setHex(0xef4444); // Red Demonic Orc Boss
        }
      }
    });

    g.add(modelContainer);

    if (animations && animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const walkClip = animations.find(a => /walking|running|walk|run/i.test(a.name)) || animations[0];
      const attackClip = animations.find(a => /attack|slash|swing|punch|hit|bite/i.test(a.name)) || animations.find(a => a !== walkClip) || animations[0];
      activeAction = mixer.clipAction(walkClip);
      if (attackClip) attackAction = mixer.clipAction(attackClip);
      activeAction.play();
    }

    if (isBoss) {
      // Demonic Horns & Flaming Boss Aura
      const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.12*scale, 0.65*scale, 6), mat(0xf59e0b, 0.4));
      horn1.rotation.z = -Math.PI/3; horn1.position.set(-0.25*scale, 2.2*scale, 0);
      const horn2 = horn1.clone(); horn2.rotation.z = Math.PI/3; horn2.position.x = 0.25*scale;
      g.add(horn1, horn2);

      const bossAura = new THREE.Mesh(
        new THREE.RingGeometry(0.48*scale, 1.2*scale, 24),
        new THREE.MeshBasicMaterial({color: 0xd97706, transparent: true, opacity: 0.7, side: THREE.DoubleSide})
      );
      bossAura.rotation.x = -Math.PI/2; bossAura.position.y = 0.04;
      g.add(bossAura);
    }

  } else {
    // High-Detail Fallback Procedural Skeleton / Monster
    const bodyNode=new THREE.Group();g.add(bodyNode);
    const boneMat=mat(e.color, 0, 0.6, 0.2);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.22*scale,0.18*scale,0.54*scale,10),boneMat);
    torso.position.y=0.6*scale;torso.castShadow=true;bodyNode.add(torso);

    const skull=new THREE.Mesh(new THREE.SphereGeometry(0.2*scale,10,10),boneMat);
    skull.position.y=1.04*scale;skull.castShadow=true;bodyNode.add(skull);

    for(const x of[-0.06*scale,0.06*scale]){
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.04*scale,6,6),new THREE.MeshBasicMaterial({color:0xef4444}));
      eye.position.set(x,1.06*scale,0.17*scale);bodyNode.add(eye);
    }
  }

  g.position.copy(e.pos);scene.add(g);e.obj=g;
  e.anim={ mixer, activeAction, attackAction, walkTime:Math.random()*10 };
}

/* ═══ WAVE / SPAWN ═══ */
function enemyCount(){return 8+wave*2+(wave>15?wave-15:0)}
function activeSides(){return wave<=5?1:wave<=10?2:wave<=20?3:4}
function pickSides(){
  const n=activeSides(),a=[0,1,2,3];
  for(let i=3;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  curSides=a.slice(0,n);
}
function spawnEnemy(){
  if(spawned>=enemyCount())return;
  let kind='grunt';const isBoss=wave%5===0,total=enemyCount();
  if(isBoss&&spawned===total-1)kind='boss';
  else{const r=Math.random();
    if(wave>20&&r<.12)kind='brute';else if(wave>10&&r<.18)kind='tank';
    else if(r<.28)kind='runner';else if(r<.40)kind='caster';else if(wave>15&&r<.50)kind='brute'}
  const d=ETYPES[kind],wM=1+wave*.15,dM=1+wave*.08;
  const side=curSides[spawned%curSides.length],g=GATES[side];
  const e={kind,pos:new THREE.Vector3(g.x+(Math.random()-.5)*2,0,g.z+(Math.random()-.5)*2),
    hp:d.hp*wM,maxHp:d.hp*wM,speed:d.spd*(1+wave*.005),dmg:d.dmg*dM,
    gold:Math.round(d.gold*(1+wave*.05)),xp:Math.round(d.xp*(1+wave*.03)),
    h:d.h,color:d.color,dead:false,stunTimer:0,slowTimer:0,slowAmt:0,
    poisonTimer:0,poisonDmg:0,tauntTimer:0,obj:null,anim:null,hpBarEl:null,
    bob:Math.random()*Math.PI*2};
  makeEnemy(e);enemies.push(e);spawned++;
}

/* ═══ COMBAT ═══ */
function nearest(pos,range){
  let best=null,bd=range;
  for(const e of enemies)if(!e.dead){const d=pos.distanceTo(e.pos);if(d<bd){bd=d;best=e}}
  return best;
}
function hitE(e,dmg,isCrit=false){
  if(e.dead)return;
  e.hp-=dmg;
  showDamageText(e.pos, Math.round(dmg), isCrit ? '#fde047' : '#ffffff', isCrit);
  if(e.hp<=0)killE(e);
}
function killE(e){
  if(e.dead)return;
  e.dead=true;gold+=e.gold;gainXP(e.xp);
  if(e.hpBarEl){e.hpBarEl.remove();e.hpBarEl=null}
  burst(e.pos,e.kind==='boss'?0xf59e0b:0xe4e4e7,e.kind==='boss'?30:12);
}
function gainXP(v){
  hero.xp+=v;
  while(hero.xp>=hero.nextXP){hero.xp-=hero.nextXP;hero.level++;hero.nextXP=Math.floor(hero.nextXP*1.25);
    hero.skillPoints++;hero.maxHp+=25;hero.hp=Math.min(hero.hp+25,hero.maxHp);hero.damage+=3;
    notify('레벨 '+hero.level+'! 스킬포인트 +1');
    if(hero.skillPoints===1)setTimeout(()=>{if(state==='play'&&hero.skillPoints>0){show('skillPing')}},300);
  }
}

function slashFx(pos, color) {
  const geom = new THREE.RingGeometry(0.35, 1.25, 16, 1, 0, Math.PI * 1.3);
  const mMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.random() * Math.PI * 2;
  mesh.position.copy(pos); mesh.position.y = 0.6;
  scene.add(mesh);
  effects.push({ obj: mesh, life: 0.22, max: 0.22, isSlash: true });
}

function heroAttack(){
  if(hero.dead||hero.atkTimer>0)return;
  const target=nearest(hero.pos,hero.range);if(!target)return;
  const aRate=hero.rate*(1-Math.min(.5,hero.rateBonus));hero.atkTimer=aRate;
  let dmg=hero.damage*hero.power,isCrit=Math.random()<hero.crit;if(isCrit)dmg*=2;
  if(hero.stealthBonus>0){dmg*=hero.stealthBonus;hero.stealthBonus=0;
    hero.buffs=hero.buffs.filter(b=>b.type!=='stealth');if(hero.obj)hero.obj.visible=true}
  
  if(hero.anim){
    hero.anim.attackTimer=0.28;
    if(hero.anim.attackAction){
      hero.anim.attackAction.reset();
      hero.anim.attackAction.setLoop(THREE.LoopOnce, 1);
      hero.anim.attackAction.play();
    }
  }

  const isRng=HEROES[hero.type].rng>4;
  if(isRng){
    const col=hero.type==='mage'?0x38bdf8:0x22c55e;
    const obj=new THREE.Mesh(new THREE.SphereGeometry(.14,8,8),new THREE.MeshBasicMaterial({color:col}));
    obj.position.copy(hero.pos);obj.position.y=1.2;scene.add(obj);
    const p={obj,target,dmg,isCrit,splash:0};
    if(hero.poison>0){p.poisonDmg=hero.poisonDmg;p.poisonDur=hero.poison}
    projectiles.push(p);
  }else{
    hitE(target,dmg,isCrit);if(hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
    if(hero.poison>0){target.poisonTimer=hero.poison;target.poisonDmg=hero.poisonDmg}
    slashFx(target.pos, HEROES[hero.type].color);
    burst(target.pos,isCrit?0xfde047:0xffffff,isCrit?6:3);
  }
  hero.facing.set(target.pos.x-hero.pos.x,0,target.pos.z-hero.pos.z).normalize();
  if(hero.obj)hero.obj.rotation.y=Math.atan2(hero.facing.x,hero.facing.z);
}

function towerAttack(){
  if(tower.atkTimer>0)return;
  const t=nearest(new THREE.Vector3(0,0,0),TWR_RNG);if(!t)return;
  tower.atkTimer=TWR_RATE;
  const obj=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),new THREE.MeshBasicMaterial({color:0x06b6d4}));
  obj.position.set(0,3.2,0);scene.add(obj);
  projectiles.push({obj,target:t,dmg:TWR_DMG*(1+wave*.02),splash:.6,tower:true});
}

/* ═══ SKILLS ═══ */
function useSkill(key){
  if(hero.dead||state!=='play')return;
  const slv=hero.skillLevels[key];
  if(slv<=0){notify('스킬을 먼저 배우세요!');return}
  if(hero.skillCDs[key]>0)return;
  const sk=HEROES[hero.type].skills[key];
  if(sk.ulti&&hero.level<6){notify('레벨 6 이상 필요');return}
  const lv=slv-1;
  hero.skillCDs[key]=sk.cd[lv];
  const t=sk.type;

  if(t==='aoe'){
    const r=sk.r||5,dmg=hero.damage*sk.mul[lv]*hero.power;
    for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<r)hitE(e,dmg,true);
    ring(hero.pos,r,HEROES[hero.type].color);notify(sk.name+'!')
  }else if(t==='aoe_stun'){
    const r=sk.r||5,dmg=hero.damage*sk.mul[lv]*hero.power;
    for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<r){hitE(e,dmg,true);e.stunTimer=2}
    ring(hero.pos,r,0xf59e0b);notify(sk.name+'!')
  }else if(t==='proj_aoe'){
    const tgt=nearest(hero.pos,8);if(!tgt){hero.skillCDs[key]=0;return}
    const dmg=hero.damage*sk.mul[lv]*hero.power;
    const obj=new THREE.Mesh(new THREE.SphereGeometry(.25,10,10),new THREE.MeshBasicMaterial({color:0xef4444}));
    obj.position.copy(hero.pos);obj.position.y=1.2;scene.add(obj);
    projectiles.push({obj,target:tgt,dmg,isCrit:true,splash:sk.r||2,skillProj:true});notify(sk.name+'!')
  }else if(t==='buff_def'){
    hero.buffs.push({type:'def',timer:sk.dur[lv],val:sk.val[lv]});notify(sk.name+' 활성화!')
  }else if(t==='taunt'){
    const r=sk.r[lv],dur=sk.dur[lv];
    for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<r){e.tauntTimer=dur}
    ring(hero.pos,r,0xef4444);notify(sk.name+'!')
  }else if(t==='zone'){
    const dmg=hero.damage*sk.mul[lv]*hero.power;
    const tgt=nearest(hero.pos,8);const zp=tgt?tgt.pos.clone():hero.pos.clone();zp.y=.05;
    const r=sk.r||4,dur=sk.dur||4;
    const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.1,32),new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.3,side:THREE.DoubleSide}));
    obj.position.copy(zp);scene.add(obj);
    zones.push({obj,pos:zp,r,dmg:dmg/5,timer:dur,tickTimer:0,slow:.5});notify(sk.name+'!')
  }else if(t==='shield_self'){
    hero.shield+=sk.val[lv];notify(sk.name+' +'+sk.val[lv])
  }else if(t==='multi'){
    const cnt=sk.cnt[lv],dmg=hero.damage*sk.mul[lv]*hero.power;
    let ts=[];for(const e of enemies)if(!e.dead)ts.push({e,d:hero.pos.distanceTo(e.pos)});
    ts.sort((a,b)=>a.d-b.d);ts=ts.slice(0,cnt);
    for(const tt of ts){
      const obj=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),new THREE.MeshBasicMaterial({color:0x22c55e}));
      obj.position.copy(hero.pos);obj.position.y=1.2;scene.add(obj);
      projectiles.push({obj,target:tt.e,dmg,isCrit:false})}
    notify(sk.name+'!')
  }else if(t==='poison_buff'){
    hero.poison=sk.dur[lv];hero.poisonDmg=sk.dot[lv];notify(sk.name+' 활성화!')
  }else if(t==='buff_eva'){
    hero.buffs.push({type:'evasion',timer:sk.dur[lv],val:sk.val[lv]});notify(sk.name+' 활성화!')
  }else if(t==='proj_single'){
    const tgt=nearest(hero.pos,8);if(!tgt){hero.skillCDs[key]=0;return}
    const dmg=hero.damage*sk.mul[lv]*hero.power;
    const obj=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.35),new THREE.MeshBasicMaterial({color:0xc084fc}));
    obj.position.copy(hero.pos);obj.position.y=1.2;scene.add(obj);
    projectiles.push({obj,target:tgt,dmg,isCrit:true});notify(sk.name+'!')
  }else if(t==='stealth'){
    hero.stealthBonus=sk.mul[lv];hero.buffs.push({type:'stealth',timer:sk.dur[lv]});
    if(hero.obj)hero.obj.visible=false;notify(sk.name+' 활성화!')
  }else if(t==='passive'){
    hero.skillCDs[key]=0;
  }else if(t==='execute'){
    const tgt=nearest(hero.pos,sk.rng||4);if(!tgt){hero.skillCDs[key]=0;return}
    hitE(tgt,hero.damage*sk.mul[lv]*hero.power,true);burst(tgt.pos,0xc084fc,18);notify(sk.name+'!')
  }else if(t==='holy'){
    const r=sk.r||3.5,dmg=hero.damage*sk.mul[lv]*hero.power,heal=dmg*sk.heal[lv];
    for(const e of enemies)if(!e.dead&&hero.pos.distanceTo(e.pos)<r)hitE(e,dmg,true);
    hero.hp=Math.min(hero.maxHp,hero.hp+heal);
    showDamageText(hero.pos, '+'+Math.round(heal), '#4ade80');
    ring(hero.pos,r,0xca8a04);notify(sk.name+'!')
  }else if(t==='heal'){
    const heal=hero.damage*sk.heal[lv];hero.hp=Math.min(hero.maxHp,hero.hp+heal);
    showDamageText(hero.pos, '+'+Math.round(heal), '#4ade80');
    burst(hero.pos,0x4ade80,10);notify('HP +'+Math.round(heal))
  }else if(t==='shield_tower'){
    tower.shield+=sk.val[lv];burst(new THREE.Vector3(0,2,0),0x38bdf8,12);notify('수호탑 보호막 +'+sk.val[lv])
  }else if(t==='revive'){
    hero.hasRevive=true;hero.skillCDs[key]=0;notify('부활 준비 완료!')
  }
}

/* ═══ EFFECTS ═══ */
function burst(pos,color,n){
  for(let i=0;i<n;i++){
    const o=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial({color}));
    o.position.set(pos.x,pos.y+.5,pos.z);scene.add(o);
    effects.push({obj:o,life:.45,max:.45,v:new THREE.Vector3((Math.random()-.5)*6,Math.random()*3.5,(Math.random()-.5)*6)});
  }
}
function ring(pos,r,color){
  const o=new THREE.Mesh(new THREE.RingGeometry(.4,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide}));
  o.rotation.x=-Math.PI/2;o.position.set(pos.x,.06,pos.z);scene.add(o);
  effects.push({obj:o,life:.45,max:.45});
}

/* ═══ MOVEMENT ═══ */
const touchDir = { x: 0, z: 0 };
function move(dt){
  if(hero.dead)return;
  let x = (keys.has('d')||keys.has('arrowright')?1:0) - (keys.has('a')||keys.has('arrowleft')?1:0) + touchDir.x;
  let z = (keys.has('s')||keys.has('arrowdown')?1:0) - (keys.has('w')||keys.has('arrowup')?1:0) + touchDir.z;
  
  let len = Math.hypot(x, z);
  hero.isMoving = len > 0.05;
  if(!hero.isMoving)return;

  if (len > 1) { x /= len; z /= len; }

  const v = new THREE.Vector3(x, 0, z).multiplyScalar(hero.speed * dt);
  hero.pos.add(v);hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-MAP_H+1,MAP_H-1);
  hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-MAP_H+1,MAP_H-1);
  hero.facing.set(v.x,0,v.z).normalize();
  if(hero.obj){hero.obj.position.copy(hero.pos);hero.obj.rotation.y=Math.atan2(v.x,v.z)}
}

/* ═══ ANIMATION & HORIZONTAL HEALTH BARS UPDATE ═══ */
function updateAnimations(dt){
  // 1. Hero Animations & Attack Lunge Motion
  if(hero.anim&&hero.obj&&!hero.dead){
    const a=hero.anim;
    if(a.auraGroup)a.auraGroup.rotation.y+=dt*1.2;
    if(a.mixer){
      if(a.walkAction && a.activeAction !== a.walkAction){
        if(hero.isMoving && !a.isWalking){
          a.walkAction.reset().fadeIn(0.15).play();
          a.activeAction.fadeOut(0.15);
          a.isWalking = true;
        } else if(!hero.isMoving && a.isWalking){
          a.activeAction.reset().fadeIn(0.15).play();
          a.walkAction.fadeOut(0.15);
          a.isWalking = false;
        }
      }
      a.mixer.update(dt);
    }
    if (a.attackTimer > 0) {
      a.attackTimer -= dt;
      const progress = a.attackTimer / 0.28;
      const lungeOffset = Math.sin((1 - progress) * Math.PI) * 0.4;
      const forward = hero.facing.clone().multiplyScalar(lungeOffset);
      hero.obj.position.copy(hero.pos).add(forward);
      hero.obj.rotation.x = Math.sin((1 - progress) * Math.PI) * 0.3;
    } else {
      hero.obj.position.copy(hero.pos);
      hero.obj.rotation.x = 0;
    }
  }

  // 2. Enemy Animations & Attack Lunge & 100% Horizontal HTML Health Bars
  const container=$('hpBars');
  for(const e of enemies){
    if(e.dead||state!=='play'){
      if(e.hpBarEl){e.hpBarEl.remove();e.hpBarEl=null}
      continue;
    }

    if(e.anim&&e.anim.mixer)e.anim.mixer.update(dt);

    if(e.lungeTimer > 0){
      e.lungeTimer -= dt;
      const progress = e.lungeTimer / 0.22;
      const lungeOffset = Math.sin((1 - progress) * Math.PI) * 0.3;
      if(e.obj){
        const forward = new THREE.Vector3(0,0,0).sub(e.pos).normalize().multiplyScalar(lungeOffset);
        e.obj.position.copy(e.pos).add(forward);
        e.obj.rotation.x = Math.sin((1 - progress) * Math.PI) * 0.25;
      }
    } else if(e.obj && !e.dead){
      e.obj.position.copy(e.pos);
      e.obj.rotation.x = 0;
    }

    // Horizontal HTML Health Bar
    if(container){
      if(!e.hpBarEl){
        const el=document.createElement('div');
        el.className='mHpBar';
        el.innerHTML='<div class="mHpFill"></div>';
        container.appendChild(el);
        e.hpBarEl=el;
      }
      const p=e.pos.clone();p.y+=e.h+0.45;
      p.project(camera);
      const x=(p.x*.5+.5)*window.innerWidth;
      const y=(-(p.y*.5)+.5)*window.innerHeight;
      e.hpBarEl.style.left=x+'px';
      e.hpBarEl.style.top=y+'px';

      const ratio=Math.max(0,Math.min(1,e.hp/e.maxHp));
      const fill=e.hpBarEl.querySelector('.mHpFill');
      if(fill){
        fill.style.width=(ratio*100)+'%';
        fill.style.backgroundColor=ratio>.5?'#22c55e':ratio>.25?'#eab308':'#ef4444';
      }
    }
  }
}

/* ═══ UPDATE ═══ */
function update(dt){
  if(state!=='play')return;

  hero.atkTimer=Math.max(0,hero.atkTimer-dt);
  tower.atkTimer=Math.max(0,tower.atkTimer-dt);
  for(const k of SK)hero.skillCDs[k]=Math.max(0,hero.skillCDs[k]-dt);

  /* buffs */
  for(let i=hero.buffs.length-1;i>=0;i--){
    hero.buffs[i].timer-=dt;
    if(hero.buffs[i].timer<=0){
      if(hero.buffs[i].type==='stealth'){hero.stealthBonus=0;if(hero.obj)hero.obj.visible=true}
      hero.buffs.splice(i,1);
    }
  }

  /* hero dead */
  if(hero.dead){deadTimer-=dt;
    if(deadTimer<=0){hero.dead=false;hero.hp=hero.maxHp;hero.pos.set(0,0,7);makeHero();hide('deadOverlay');notify('부활!')}
  }else{move(dt);heroAttack()}

  /* poison decay */
  if(hero.poison>0){hero.poison-=dt;if(hero.poison<=0){hero.poison=0;hero.poisonDmg=0}}

  towerAttack();

  /* projectiles */
  for(const p of projectiles){
    if(!p.target||p.target.dead){p.obj.visible=false;continue}
    const to=new THREE.Vector3(p.target.pos.x,p.target.h*.5||.8,p.target.pos.z);
    p.obj.position.lerp(to,Math.min(1,dt*18));
    if(p.obj.position.distanceTo(to)<.25){
      if(p.splash&&p.splash>0){
        for(const e of enemies)if(!e.dead&&e.pos.distanceTo(p.target.pos)<p.splash)hitE(e,p.dmg*(e===p.target?1:.5),p.isCrit);
        burst(p.target.pos,0xef4444,6);
      }else hitE(p.target,p.dmg,p.isCrit);
      if(p.poisonDmg){p.target.poisonTimer=p.poisonDur||4;p.target.poisonDmg=p.poisonDmg}
      if(!p.tower&&hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
      p.obj.visible=false;
    }
  }
  for(let i=projectiles.length-1;i>=0;i--)if(!projectiles[i].obj.visible){scene.remove(projectiles[i].obj);projectiles.splice(i,1)}

  /* zones */
  for(const z of zones){z.timer-=dt;z.tickTimer-=dt;
    if(z.tickTimer<=0){z.tickTimer=.8;
      for(const e of enemies)if(!e.dead&&e.pos.distanceTo(z.pos)<z.r){hitE(e,z.dmg);if(z.slow){e.slowTimer=1;e.slowAmt=z.slow}}}
    z.obj.material.opacity=.3*Math.min(1,z.timer/.5);
  }
  for(let i=zones.length-1;i>=0;i--)if(zones[i].timer<=0){scene.remove(zones[i].obj);zones.splice(i,1)}

  /* spawn */
  spawnClock-=dt;
  if(spawnClock<=0&&spawned<enemyCount()){spawnClock=Math.max(.2,.55-wave*.005);spawnEnemy()}

  /* enemies */
  let alive=0;
  for(const e of enemies){
    if(e.dead)continue;alive++;
    if(e.stunTimer>0){e.stunTimer-=dt;if(e.obj)e.obj.position.y=e.pos.y+Math.sin(performance.now()*.02)*.15;continue}
    if(e.poisonTimer>0){e.poisonTimer-=dt;hitE(e,e.poisonDmg*dt)}

    /* target: tower or hero (if taunted) */
    let tx=0,tz=0;
    if(e.tauntTimer>0){tx=hero.pos.x;tz=hero.pos.z;e.tauntTimer-=dt}
    const dir=new THREE.Vector3(tx-e.pos.x,0,tz-e.pos.z),dist=dir.length();

    if(dist<2.6&&tx===0&&tz===0){
      let dmg=e.dmg*dt;
      e.atkCool = (e.atkCool || 0) - dt;
      if (e.atkCool <= 0) {
        e.atkCool = 0.8;
        e.lungeTimer = 0.22;
        if (e.anim && e.anim.attackAction) {
          e.anim.attackAction.reset().setLoop(THREE.LoopOnce, 1).play();
        }
      }
      if(tower.shield>0){const ab=Math.min(tower.shield,dmg);tower.shield-=ab;dmg-=ab}
      tower.hp-=dmg;
    }else if(dist>0.3){
      let spd=e.speed;if(e.slowTimer>0){spd*=(1-e.slowAmt);e.slowTimer-=dt}
      dir.normalize();e.pos.addScaledVector(dir,spd*dt);
      if(e.obj)e.obj.rotation.y=Math.atan2(dir.x,dir.z);
    }

    /* damage hero on contact */
    if(!hero.dead&&hero.pos.distanceTo(e.pos)<1.8){
      let dmg=e.dmg*dt*.5;
      const db=hero.buffs.find(b=>b.type==='def');if(db)dmg*=(1-db.val);
      const eb=hero.buffs.find(b=>b.type==='evasion');
      if((eb&&Math.random()<eb.val*dt*10)||(hero.evasion>0&&Math.random()<hero.evasion*dt*10))dmg=0;
      if(hero.armor>0)dmg*=Math.max(.3,1-hero.armor*.04);
      if(hero.shield>0){const ab=Math.min(hero.shield,dmg);hero.shield-=ab;dmg-=ab}
      hero.hp-=dmg;
    }

    if(e.obj){e.obj.position.copy(e.pos)}
  }

  /* update limb animations & horizontal health bars */
  updateAnimations(dt);

  /* hero death */
  if(!hero.dead&&hero.hp<=0){
    hero.hp=0;
    if(hero.hasRevive){hero.hasRevive=false;hero.hp=hero.maxHp;
      const sk=HEROES[hero.type].skills.R,lv=hero.skillLevels.R-1;hero.skillCDs.R=sk.cd[lv];
      burst(hero.pos,0xca8a04,24);notify('부활 발동!')
    }else{
      hero.dead=true;deadTimer=RESPAWN;gold=Math.max(0,Math.floor(gold*.9));
      if(hero.obj){scene.remove(hero.obj);hero.obj=null}
      show('deadOverlay');notify('사망! '+RESPAWN+'초 후 부활')
    }
  }

  /* effects */
  for(const f of effects){
    f.life-=dt;
    if(f.v){f.obj.position.addScaledVector(f.v,dt);f.v.multiplyScalar(.91)}
    if(f.isSlash){
      f.obj.rotation.z+=dt*15;
      f.obj.scale.setScalar(1+(f.max-f.life)*2.5);
      if(f.obj.material)f.obj.material.opacity=(f.life/f.max);
    }else{
      f.obj.scale.setScalar(1+(f.max-f.life)*1.8);
    }
  }
  for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0){scene.remove(effects[i].obj);effects.splice(i,1)}

  /* clean dead */
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead){
    if(enemies[i].hpBarEl){enemies[i].hpBarEl.remove();enemies[i].hpBarEl=null}
    scene.remove(enemies[i].obj);enemies.splice(i,1);
  }

  /* wave done */
  if(spawned>=enemyCount()&&alive===0){
    if(wave>=MAX_WAVE){state='victory';
      $('victoryDetail').textContent=`레벨 ${hero.level} · ${gold}G · ${HEROES[hero.type].name}`;
      show('victory');return}
    wave++;spawned=0;spawnClock=2;gold+=100+wave*10;
    tower.hp=Math.min(tower.maxHp,tower.hp+200);pickSides();
    notify('웨이브 '+wave+' · '+curSides.map(i=>GNAMES[i]).join('+'))
  }

  /* tower fall */
  if(tower.hp<=0){tower.hp=0;state='over';
    $('overDetail').textContent=`웨이브 ${wave}/${MAX_WAVE} · 레벨 ${hero.level} · ${gold}G · ${HEROES[hero.type].name}`;
    show('gameover')}

  syncHud();
}

/* ═══ ITEMS ═══ */
function recalcStats(){
  let s={damage:0,maxHp:0,speed:0,crit:0,power:0,lifesteal:0,evasion:0,armor:0,rateBonus:0};
  for(const it of inventory)for(const k of Object.keys(s))s[k]+=it.stats[k]||0;
  const d=HEROES[hero.type];
  hero.damage=d.dmg+3*(hero.level-1)+s.damage;
  hero.maxHp=d.hp+25*(hero.level-1)+s.maxHp;
  hero.speed=d.spd+s.speed;hero.crit=.08+s.crit;hero.power=1+s.power;
  hero.lifesteal=s.lifesteal;hero.evasion=s.evasion;hero.armor=s.armor;hero.rateBonus=s.rateBonus;
  if(hero.type==='assassin'&&hero.skillLevels.E>0){const sk=HEROES.assassin.skills.E;hero.crit+=sk.val[hero.skillLevels.E-1]}
  hero.hp=Math.min(hero.hp,hero.maxHp);
}
function buyItem(item){
  if(inventory.length>=8){notify('인벤토리 가득!');return}
  if(gold<item.cost){notify('골드 부족!');return}
  gold-=item.cost;inventory.push({...item,stats:{...item.stats}});recalcStats();
  notify(item.name+' 획득');renderShop();syncHud();
}
function canCombine(r){
  const need=[...r.mats],avail=inventory.map(i=>i.id);
  for(const m of need){const idx=avail.indexOf(m);if(idx===-1)return false;avail.splice(idx,1)}
  return r.extra<=0||gold>=r.extra;
}
function doCombine(r){
  if(!canCombine(r))return;
  const need=[...r.mats];
  for(const mid of need){const idx=inventory.findIndex(i=>i.id===mid);if(idx!==-1)inventory.splice(idx,1)}
  if(r.extra>0)gold-=r.extra;
  inventory.push({id:r.id,name:r.name,desc:r.desc,stats:{...r.stats},tier:r.tier,cost:0});
  recalcStats();notify(r.name+' 조합 완료!');selectedInvIndex=-1;renderShop();syncHud();
}
function sellItem(idx){
  const it=inventory[idx];if(!it)return;
  gold+=Math.floor((it.cost||0)*.5);inventory.splice(idx,1);recalcStats();
  notify(it.name+' 판매 완료');selectedInvIndex=-1;renderShop();syncHud();
}

/* ═══ UI ═══ */
function notify(text){const n=$('notice');if(!n)return;n.textContent=text;n.classList.add('show');
  clearTimeout(window.__nt);window.__nt=setTimeout(()=>n.classList.remove('show'),1400)}

function syncHud(){
  $('wave').textContent='WAVE '+wave+' / '+MAX_WAVE;
  $('direction').textContent=curSides.map(i=>GNAMES[i]).join('+')+' 방향';
  $('waveCount').textContent=spawned+' / '+enemyCount();
  $('heroName').textContent=HEROES[hero.type]?.name||'';
  $('level').textContent='LV '+hero.level;
  $('xp').textContent=hero.xp+' / '+hero.nextXP;
  $('gold').textContent=gold+' G';
  $('inventoryText').textContent=inventory.length+' / 8';
  $('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp+(tower.shield>0?' (+'+Math.ceil(tower.shield)+')':'');
  $('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';
  $('heroHpText').textContent=hero.dead?'사망':Math.ceil(hero.hp)+' / '+hero.maxHp+(hero.shield>0?' (+'+Math.ceil(hero.shield)+')':'');
  $('heroBar').style.width=hero.dead?'0':Math.max(0,hero.hp/hero.maxHp*100)+'%';
  /* skills */
  for(const key of SK){
    const el=$('skill'+key);if(!el)continue;
    const sk=HEROES[hero.type]?.skills[key];if(!sk)continue;
    const lv=hero.skillLevels[key],cd=hero.skillCDs[key];
    el.querySelector('.sk-name').textContent=sk.name;
    el.querySelector('.sk-lv').textContent=lv>0?'Lv'+lv:'-';
    const cdEl=el.querySelector('.sk-cd');
    cdEl.textContent=cd>0?cd.toFixed(1):'';
    el.classList.toggle('on-cd',cd>0);el.classList.toggle('not-learned',lv<=0);
    el.classList.toggle('locked',!!(sk.ulti&&hero.level<6));
  }
  $('skillPoints').textContent=hero.skillPoints>0?'스킬포인트: '+hero.skillPoints:'';
  if(hero.dead){show('deadOverlay');$('deadTimer').textContent=Math.ceil(deadTimer)+'초'}else hide('deadOverlay');
}

function renderShop(){
  const box=$('shopItems'),rbox=$('recipeItems'),inv=$('shopInventory');
  if(!box)return;$('shopGold').textContent=gold+' G';

  box.replaceChildren();
  for(const item of ITEMS){const b=document.createElement('button');b.type='button';b.className='shopItem';
    b.innerHTML=`<strong>${item.name}</strong><span>${item.desc}</span><em>${item.cost} G</em>`;
    b.onclick=()=>buyItem(item);box.appendChild(b)}

  if(rbox){rbox.replaceChildren();
    for(const r of RECIPES){const can=canCombine(r);const b=document.createElement('button');
      b.type='button';b.className='shopItem recipe'+(can?' canCraft':'');
      const mats=r.mats.map(id=>{const x=ITEMS.find(i=>i.id===id)||RECIPES.find(i=>i.id===id);return x?x.name:id}).join(' + ');
      b.innerHTML=`<strong>${r.name} <small>[T${r.tier}]</small></strong><span>${r.desc}</span><small class="mats">${mats}${r.extra>0?' +'+r.extra+'G':''}</small>`;
      b.onclick=()=>{if(can)doCombine(r);else notify('재료 부족!')};rbox.appendChild(b)}}

  if(inv){
    inv.replaceChildren();
    inventory.forEach((it,i)=>{
      const b=document.createElement('button');b.type='button';
      const isSel=(i===selectedInvIndex);
      b.className='invItem'+(isSel?' selected':'');
      const tierColor=it.tier===3?'#ff9944':it.tier===2?'#66bbff':'#ccc';
      b.innerHTML=`<strong style="color:${tierColor}">${it.name} <small>[T${it.tier}]</small></strong><small>${it.desc}</small><small class="sell">클릭하여 선택 (판매가: ${Math.floor((it.cost||0)*.5)}G)</small>`;
      b.onclick=()=>{selectedInvIndex=i;renderShop()};
      inv.appendChild(b);
    });
    for(let i=inventory.length;i<8;i++){
      const b=document.createElement('button');b.type='button';b.className='invItem empty';b.disabled=true;
      b.innerHTML='<strong>빈 슬롯</strong>';inv.appendChild(b);
    }

    /* CONFIRM SELL PANEL */
    if(selectedInvIndex>=0 && selectedInvIndex<inventory.length){
      const item=inventory[selectedInvIndex];
      const sellPrice=Math.floor((item.cost||0)*0.5);
      const confBox=document.createElement('div');
      confBox.className='sellConfirmBox';
      confBox.innerHTML=`
        <div class="sellConfirmInfo">
          <strong>${item.name} [Tier ${item.tier}]</strong>
          <span>${item.desc}</span>
        </div>
        <div class="sellConfirmBtns">
          <button type="button" class="confirmSellBtn">💰 ${sellPrice}G에 판매 확정</button>
          <button type="button" class="cancelSellBtn">취소</button>
        </div>
      `;
      confBox.querySelector('.confirmSellBtn').onclick=()=>{
        sellItem(selectedInvIndex);
      };
      confBox.querySelector('.cancelSellBtn').onclick=()=>{
        selectedInvIndex=-1;
        renderShop();
      };
      inv.appendChild(confBox);
    }
  }
}

function renderSkillUp(){
  const box=$('skillChoices');if(!box)return;box.replaceChildren();$('spRemain').textContent=hero.skillPoints;
  for(const key of SK){
    const sk=HEROES[hero.type].skills[key],lv=hero.skillLevels[key],mx=sk.ulti?3:4;
    const can=lv<mx&&(!sk.ulti||hero.level>=6)&&hero.skillPoints>0;
    const b=document.createElement('button');b.type='button';
    b.className='skillChoice'+(can?' available':'');b.disabled=!can;
    b.innerHTML=`<div class="sk-key-big">${'1234'['QWER'.indexOf(key)]}</div><strong>${sk.name}</strong><small>${sk.desc}</small><span>Lv ${lv} / ${mx}</span>`;
    b.onclick=()=>{if(!can)return;hero.skillLevels[key]++;hero.skillPoints--;
      if(sk.type==='passive')recalcStats();
      if(sk.type==='revive'&&hero.skillLevels[key]>0)hero.hasRevive=true;
      if(hero.skillPoints<=0){closeSkillUp()}else renderSkillUp();syncHud()};
    box.appendChild(b)}
}

function setShopTab(tab){
  shopTab=tab;
  selectedInvIndex=-1;
  $('shopBuyPanel').classList.toggle('hidden',tab!=='buy');
  $('shopRecipePanel').classList.toggle('hidden',tab!=='recipe');
  $('shopInvPanel').classList.toggle('hidden',tab!=='inv');
  $('tabBuy').classList.toggle('active',tab==='buy');
  $('tabRecipe').classList.toggle('active',tab==='recipe');
  $('tabInv').classList.toggle('active',tab==='inv');
  renderShop();
}
function openShop(){if(state!=='play')return;state='shop';selectedInvIndex=-1;show('shop');setShopTab('buy');renderShop()}
function closeShop(){if(state!=='shop')return;state='play';selectedInvIndex=-1;hide('shop')}
function openSkillUp(){if(state!=='play'||hero.skillPoints<=0)return;state='skillUp';show('skillUp');renderSkillUp()}
function closeSkillUp(){if(state!=='skillUp')return;state='play';hide('skillUp')}

/* ═══ HERO SELECT ═══ */
function buildHeroSelect(){
  const box=$('heroChoices');if(!box)return;box.replaceChildren();
  for(const[key,h]of Object.entries(HEROES)){
    const b=document.createElement('button');b.type='button';b.className='heroChoice';
    const skList=Object.entries(h.skills).map(([k,s])=>`<b>${'1234'['QWER'.indexOf(k)]}</b> ${s.name}`).join(' · ');
    b.innerHTML=`<b style="color:#${h.color.toString(16).padStart(6,'0')}">${h.name}</b><small>${h.desc}</small><small class="sk-list">${skList}</small>`;
    b.onclick=()=>beginHero(key);box.appendChild(b)}
}

/* ═══ GAME FLOW ═══ */
function clearWorld(){
  const hpContainer=$('hpBars');
  if(hpContainer)hpContainer.replaceChildren();
  enemies.splice(0).forEach(e=>{
    if(e.hpBarEl){e.hpBarEl.remove();e.hpBarEl=null}
    if(e.obj)scene.remove(e.obj);
  });
  projectiles.splice(0).forEach(p=>{if(p.obj)scene.remove(p.obj)});
  effects.splice(0).forEach(f=>{if(f.obj)scene.remove(f.obj)});
  zones.splice(0).forEach(z=>{if(z.obj)scene.remove(z.obj)});
}
function resetRun(){
  clearWorld();wave=1;gold=500;spawned=0;spawnClock=.5;selectedInvIndex=-1;
  tower.hp=tower.maxHp;tower.shield=0;tower.atkTimer=0;
  inventory=[];pickSides();
}
function beginHero(type){
  initHero(type);resetRun();makeHero();hideAll();state='play';
  notify('웨이브 1 · '+curSides.map(i=>GNAMES[i]).join('+')+' 방향');syncHud()
}

/* ═══ INPUT ═══ */
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  keys.add(k);
  if(state==='play'){
    if(k==='1')useSkill('Q');if(k==='2')useSkill('W');if(k==='3')useSkill('E');if(k==='4')useSkill('R');
    if(k==='i'){openShop()}
    if(k==='k'){openSkillUp()}
    if(k==='escape'){state='pause';show('pause')}
  }else if(state==='shop'){
    if(k==='escape'||k==='i')closeShop()
  }else if(state==='skillUp'){
    if(k==='escape'||k==='k')closeSkillUp()
  }else if(state==='pause'){
    if(k==='escape'){state='play';hide('pause')}
  }
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

/* skill bar click */
for(const key of SK){const el=$('skill'+key);if(el)el.addEventListener('click',()=>{
  if(state==='play')useSkill(key)})}

/* buttons */
$('startBtn').onclick=()=>{hide('start');buildHeroSelect();show('heroSelect')};
$('shopBtn').onclick=e=>{e.preventDefault();if(state==='shop')closeShop();else openShop()};
$('skillBtn').onclick=e=>{e.preventDefault();if(state==='skillUp')closeSkillUp();else openSkillUp()};
$('tabBuy').onclick=()=>setShopTab('buy');
$('tabRecipe').onclick=()=>setShopTab('recipe');
$('tabInv').onclick=()=>setShopTab('inv');
$('shopClose').onclick=closeShop;
$('skillUpClose').onclick=closeSkillUp;
$('resumeBtn').onclick=()=>{state='play';hide('pause')};
$('restartBtn').onclick=()=>{hideAll();show('start');state='menu'};
$('victoryBtn').onclick=()=>{hideAll();show('start');state='menu'};

/* ═══ MOBILE TOUCH JOYSTICK CONTROLLER ═══ */
const joystickEl = $('touchJoystick');
const knobEl = $('joystickKnob');

if (joystickEl && knobEl) {
  let joystickActive = false;
  let touchId = null;
  let joyRect = null;

  function updateJoystick(clientX, clientY) {
    if (!joyRect) joyRect = joystickEl.getBoundingClientRect();
    const centerX = joyRect.left + joyRect.width / 2;
    const centerY = joyRect.top + joyRect.height / 2;
    const maxRadius = joyRect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    touchDir.x = dx / maxRadius;
    touchDir.z = dy / maxRadius;
  }

  function resetJoystick() {
    joystickActive = false;
    touchId = null;
    knobEl.style.transform = 'translate(0px, 0px)';
    touchDir.x = 0;
    touchDir.z = 0;
  }

  joystickEl.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joystickActive) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    joystickActive = true;
    joyRect = joystickEl.getBoundingClientRect();
    updateJoystick(t.clientX, t.clientY);
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (!joystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId) {
        updateJoystick(t.clientX, t.clientY);
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (!joystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        resetJoystick();
        break;
      }
    }
  });
  window.addEventListener('touchcancel', resetJoystick);

  // Mouse fallback for testing joystick on desktop
  let isMouseDown = false;
  joystickEl.addEventListener('mousedown', e => {
    isMouseDown = true;
    joyRect = joystickEl.getBoundingClientRect();
    updateJoystick(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', e => {
    if (isMouseDown) updateJoystick(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    if (isMouseDown) { isMouseDown = false; resetJoystick(); }
  });
}

/* ═══ RESIZE ═══ */
function resize(){
  renderer.setSize(innerWidth,innerHeight,false);
  const a=Math.max(.5,innerWidth/innerHeight),h=10,w=h*a;
  camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();syncHud();

/* ═══ ANIMATION LOOP ═══ */
let last=performance.now();
function animate(now){
  const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;
  update(dt);
  crystal.rotation.y += dt * 1.2;
  crystal.position.y = 7.6 + Math.sin(now * 0.003) * 0.18;
  crystalRing1.rotation.z += dt * 0.9;
  crystalRing2.rotation.z -= dt * 1.3;
  crystalLight.intensity = 2.2 + Math.sin(now * 0.004) * 0.5;

  miniCrystals.forEach((mc, idx) => {
    const angle = now * 0.002 + (idx * Math.PI * 2 / 3);
    const r = 1.8;
    mc.position.x = Math.cos(angle) * r;
    mc.position.z = Math.sin(angle) * r;
    mc.position.y = 7.6 + Math.sin(now * 0.005 + idx) * 0.25;
    mc.rotation.y += dt * 2.0;
  });
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

})();
