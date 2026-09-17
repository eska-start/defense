const $ = function(id){ return document.getElementById(id); };
const root = $('canvas');

const show = function(id){ var el=$(id); if(el) el.classList.remove('hidden'); };
const hide = function(id){ var el=$(id); if(el) el.classList.add('hidden'); };
const hideAll = function(){ ['start','heroSelect','levelUp','shop','equipment','pause','gameover'].forEach(hide); };

if (!window.THREE || !root) {
  var bootError = $('notice');
  if (bootError) {
    bootError.textContent = '게임 엔진을 불러오지 못했습니다.';
    bootError.classList.add('show');
  }
} else {
  const THREE = window.THREE;

  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'gameCanvas';
  root.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111914);
  scene.fog = new THREE.Fog(0x111914, 28, 62);

  const camera = new THREE.OrthographicCamera(-14,14,10,-10,0.1,100);
  camera.position.set(15,19,15);
  camera.lookAt(0,0,0);

  scene.add(new THREE.HemisphereLight(0xd4e8da,0x172019,2.1));
  const sun = new THREE.DirectionalLight(0xffe7ba,2.3);
  sun.position.set(9,22,8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  scene.add(sun);

  const material = function(color, emissive){
    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:0.86,
      metalness:0.08,
      emissive:emissive || 0x000000,
      emissiveIntensity:emissive ? 1.2 : 0
    });
  };

  const addBox = function(x,y,z,sx,sy,sz,color){
    var mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material(color));
    mesh.position.set(x,y,z);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    scene.add(mesh);
    return mesh;
  };

  const addCyl = function(x,y,z,r,h,color){
    var mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),material(color));
    mesh.position.set(x,y,z);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    scene.add(mesh);
    return mesh;
  };

  var ground=new THREE.Mesh(new THREE.PlaneGeometry(38,38),material(0x2a4030));
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  scene.add(ground);

  var arena=new THREE.Mesh(new THREE.CircleGeometry(9.2,48),material(0x38523d));
  arena.rotation.x=-Math.PI/2;
  arena.position.y=0.02;
  scene.add(arena);

  addBox(0,0.05,-8.6,4,0.08,14,0x304938);
  addBox(8.6,0.05,0,14,0.08,4,0x304938);
  addBox(0,0.05,8.6,4,0.08,14,0x304938);
  addBox(-8.6,0.05,0,14,0.08,4,0x304938);

  addBox(0,1.35,0,5.8,2.7,5,0x667b68);
  [[-3.1,-2.4],[3.1,-2.4],[-3.1,2.4],[3.1,2.4]].forEach(function(p){ addCyl(p[0],2,p[1],0.72,4.1,0x768b75); });
  addBox(0,1.15,2.75,1.55,2.3,0.7,0x412d25);

  var roof=new THREE.Mesh(new THREE.ConeGeometry(3.5,2,4),material(0x855845));
  roof.position.y=3.9;
  roof.rotation.y=Math.PI/4;
  roof.castShadow=true;
  scene.add(roof);

  var crystal=new THREE.Mesh(
    new THREE.OctahedronGeometry(0.58),
    material(0x55d8d0,0x154946)
  );
  crystal.position.set(0,3,2.98);
  scene.add(crystal);

  const gates=[
    new THREE.Vector3(0,0,-15),
    new THREE.Vector3(15,0,0),
    new THREE.Vector3(0,0,15),
    new THREE.Vector3(-15,0,0)
  ];
  const gateNames=['북','동','남','서'];

  const heroDefs={
    warrior:{name:'전사',hp:600,speed:6,damage:58,range:2.8,rate:0.42,skill:7,color:0xc17d3f},
    mage:{name:'마법사',hp:380,speed:5.3,damage:72,range:5.6,rate:0.48,skill:6,color:0x5d9bd7},
    ranger:{name:'궁수',hp:430,speed:6.7,damage:52,range:6.6,rate:0.38,skill:8,color:0x6eaa72}
  };

  const enemyDefs={
    grunt:{hp:72,speed:1.55,dmg:8,gold:8,xp:10,h:1.25,c:0x98725c},
    runner:{hp:50,speed:2.95,dmg:6,gold:10,xp:14,h:1.15,c:0xb4a256},
    tank:{hp:250,speed:0.92,dmg:22,gold:28,xp:34,h:1.8,c:0x718469},
    caster:{hp:125,speed:1.25,dmg:16,gold:26,xp:30,h:1.4,c:0x8062a5},
    boss:{hp:3400,speed:0.66,dmg:65,gold:520,xp:450,h:3.3,c:0xb9424b}
  };

  const slots={
    helmet:'투구',armor:'갑옷',gloves:'장갑',boots:'신발',
    weapon:'주무기',offhand:'보조무기',ring:'반지',amulet:'목걸이'
  };

  const shopItems=[
    {id:'iron_sword',name:'강철검',slot:'weapon',cost:180,desc:'공격력 +35',stat:['damage',35],visual:'sword'},
    {id:'mage_staff',name:'마력 지팡이',slot:'weapon',cost:220,desc:'스킬 피해 +25%',stat:['power',0.25],visual:'staff'},
    {id:'hunter_bow',name:'사냥꾼의 활',slot:'weapon',cost:220,desc:'공격력 +22 · 공격속도 +10%',stat:['damage',22],visual:'bow',rateMul:0.90},
    {id:'iron_helm',name:'철제 투구',slot:'helmet',cost:160,desc:'최대 HP +90',stat:['maxHp',90],visual:'helm'},
    {id:'plate',name:'수호 갑옷',slot:'armor',cost:260,desc:'최대 HP +180',stat:['maxHp',180],visual:'armor'},
    {id:'gloves',name:'전투 장갑',slot:'gloves',cost:150,desc:'공격력 +12',stat:['damage',12],visual:'gloves'},
    {id:'boots',name:'질주화',slot:'boots',cost:200,desc:'이동속도 +0.8',stat:['speed',0.8],visual:'boots'},
    {id:'shield',name:'철제 방패',slot:'offhand',cost:220,desc:'수호탑 피해 -3',stat:['armor',3],visual:'shield'},
    {id:'ring',name:'용사의 반지',slot:'ring',cost:240,desc:'치명타 +8%',stat:['crit',0.08],visual:'ring'},
    {id:'amulet',name:'흡혈 부적',slot:'amulet',cost:280,desc:'타격 회복 +3',stat:['lifesteal',3],visual:'amulet'}
  ];

  var hero={
    type:'warrior',
    pos:new THREE.Vector3(0,0,7),
    hp:600,maxHp:600,speed:6,damage:58,range:2.8,rate:0.42,
    attack:0,skill:0,crit:0.08,power:1,lifesteal:0,obj:null,gear:new THREE.Group()
  };

  var tower={hp:3400,maxHp:3400,armor:0};
  var enemies=[],projectiles=[],effects=[];
  var keys=new Set();

  var state='menu',wave=1,side=0,spawned=0,spawnClock=0.5;
  var gold=500,xp=0,level=1,nextXP=100;
  var inventory=[];
  var equipped={helmet:null,armor:null,gloves:null,boots:null,weapon:null,offhand:null,ring:null,amulet:null};

  function syncHud(){
    $('wave').textContent='WAVE '+wave;
    $('direction').textContent=gateNames[side]+' 방향';
    $('waveCount').textContent=spawned+' / '+enemyTotal();
    $('heroName').textContent=heroDefs[hero.type].name;
    $('level').textContent='LV '+level;
    $('xp').textContent=xp+' / '+nextXP;
    $('gold').textContent=gold+' G';
    $('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp;
    $('heroHpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;
    $('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';
    $('heroBar').style.width=Math.max(0,hero.hp/hero.maxHp*100)+'%';
    $('skillText').textContent=hero.skill>0?hero.skill.toFixed(1)+'s':'READY';
    $('inventoryText').textContent=inventory.length+' / 8';
  }

  function notify(t){
    var n=$('notice');
    if(!n)return;
    n.textContent=t;
    n.classList.add('show');
    clearTimeout(window.__note);
    window.__note=setTimeout(function(){n.classList.remove('show');},1200);
  }

  function enemyTotal(){ return 8+wave*2+Math.floor(wave/3); }

  function clearWorld(){
    enemies.forEach(function(e){ if(e.obj)scene.remove(e.obj); });
    enemies=[];
    projectiles.forEach(function(p){scene.remove(p.obj);});
    projectiles=[];
    effects.forEach(function(f){scene.remove(f.obj);});
    effects=[];
  }

  function makeHeroVisual(){
    if(hero.obj)scene.remove(hero.obj);
    var g=new THREE.Group();
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(0.42,0.95,5,10),material(heroDefs[hero.type].color));
    body.position.y=1.0;
    body.castShadow=true;
    g.add(body);

    var head=new THREE.Mesh(new THREE.SphereGeometry(0.30,14,10),material(0xe1b08f));
    head.position.y=1.85;
    head.castShadow=true;
    g.add(head);

    var ring=new THREE.Mesh(
      new THREE.TorusGeometry(0.62,0.035,8,32),
      new THREE.MeshBasicMaterial({color:0xf0b94c})
    );
    ring.rotation.x=Math.PI/2;
    ring.position.y=0.04;
    g.add(ring);

    hero.obj=g;
    hero.obj.position.copy(hero.pos);
    scene.add(hero.obj);
    refreshGear();
  }

  function gearMesh(item){
    var g=new THREE.Group();
    var m=material(0xa48a52);

    if(item.visual==='sword'){
      var blade=new THREE.Mesh(new THREE.BoxGeometry(0.13,1.25,0.18),m);
      blade.position.y=0.65;
      var guard=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.1,0.12),m);
      guard.position.y=0.1;
      g.add(blade);g.add(guard);
    } else if(item.visual==='staff'){
      var staff=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,1.7,8),m);
      staff.position.y=0.8;
      var orb=new THREE.Mesh(new THREE.SphereGeometry(0.15,10,10),material(0x62dcef,0x194f50));
      orb.position.y=1.7;
      g.add(staff);g.add(orb);
    } else if(item.visual==='bow'){
      var bow=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.045,8,24,Math.PI*1.35),m);
      bow.rotation.z=Math.PI/2;
      var string=new THREE.Mesh(new THREE.BoxGeometry(0.03,1.2,0.03),material(0xe2d6b2));
      string.position.x=0.02;
      g.add(bow);g.add(string);
    } else if(item.visual==='helm'){
      var helm=new THREE.Mesh(new THREE.SphereGeometry(0.48,12,8,0,Math.PI*2,0,Math.PI*0.55),m);
      g.add(helm);
    } else if(item.visual==='armor'){
      var armor=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.95,0.5),m);
      armor.position.y=0.15;
      g.add(armor);
    } else if(item.visual==='shield'){
      var shield=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.12,12),m);
      shield.rotation.z=Math.PI/2;
      shield.position.set(-0.65,1.05,0.1);
      g.add(shield);
    } else if(item.visual==='gloves'){
      var gl=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.32,0.2),m);
      gl.position.set(-0.5,1,0);
      g.add(gl);
      var gr=gl.clone();
      gr.position.x=0.5;
      g.add(gr);
    } else if(item.visual==='boots'){
      var bl=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.38,0.34),m);
      bl.position.set(-0.25,0.2,0.08);
      g.add(bl);
      var br=bl.clone();
      br.position.x=0.25;
      g.add(br);
    } else if(item.visual==='ring'){
      var ri=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.035,8,12),new THREE.MeshBasicMaterial({color:0xe8c65d}));
      ri.position.set(0.45,0.95,0.2);
      g.add(ri);
    } else if(item.visual==='amulet'){
      var am=new THREE.Mesh(new THREE.OctahedronGeometry(0.14),material(0x67d9e7,0x17484a));
      am.position.set(0,0.85,0.35);
      g.add(am);
    }
    return g;
  }

  function refreshGear(){
    if(hero.gear && hero.gear.parent)hero.gear.parent.remove(hero.gear);
    hero.gear=new THREE.Group();
    if(hero.obj)hero.obj.add(hero.gear);

    Object.keys(equipped).forEach(function(k){
      var it=equipped[k];
      if(!it)return;
      var g=gearMesh(it);
      if(k==='helmet')g.position.set(0,1.95,0);
      if(k==='armor')g.position.set(0,1.15,0.08);
      if(k==='weapon')g.position.set(0.55,0.95,0.05);
      hero.gear.add(g);
    });
  }

  function resetRun(){
    clearWorld();
    wave=1;side=0;spawned=0;spawnClock=0.3;
    gold=500;xp=0;level=1;nextXP=100;
    tower.hp=tower.maxHp;
    tower.armor=0;
    inventory=[];
    Object.keys(equipped).forEach(function(k){equipped[k]=null;});
    var d=heroDefs[hero.type];
    hero.hp=d.hp;hero.maxHp=d.hp;hero.speed=d.speed;hero.damage=d.damage;
    hero.range=d.range;hero.rate=d.rate;hero.attack=0;hero.skill=0;
    hero.crit=hero.type==='ranger'?0.16:0.08;hero.power=1;hero.lifesteal=0;
    hero.pos.set(0,0,7);
    makeHeroVisual();
    hideAll();
    state='play';
    notify('웨이브 1 · 북쪽 적습');
    syncHud();
  }

  function startHero(type){ hero.type=type; resetRun(); }

  function makeEnemyBar(e){
    var bar=new THREE.Group();
    var bg=new THREE.Mesh(new THREE.PlaneGeometry(1.15,0.11),new THREE.MeshBasicMaterial({color:0x271516}));
    var fg=new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.075),new THREE.MeshBasicMaterial({color:0x63d678}));
    fg.position.z=0.02;
    bar.add(bg);bar.add(fg);
    bar.position.y=e.kind==='boss'?3.5:2;
    bar.rotation.x=-0.38;
    bar.userData.fg=fg;
    e.obj.add(bar);
    e.bar=bar;
  }

  function spawnEnemy(){
    if(spawned>=enemyTotal())return;

    var r=Math.random(),k='grunt';
    if(wave%5===0 && spawned===enemyTotal()-1)k='boss';
    else if(r<0.15)k='runner';
    else if(r<0.30)k='tank';
    else if(r<0.42)k='caster';

    var d=enemyDefs[k],gate=gates[side];
    var e={
      kind:k,
      pos:new THREE.Vector3(
        gate.x+(Math.random()-0.5)*1.6,
        0,
        gate.z+(Math.random()-0.5)*1.6
      ),
      hp:d.hp*(1+wave*0.12),
      maxHp:d.hp*(1+wave*0.12),
      speed:d.speed*(1+wave*0.008),
      dmg:d.dmg*(1+wave*0.05),
      gold:d.gold,
      xp:d.xp,
      dead:false,
      obj:null,
      bar:null
    };

    var obj=new THREE.Group();
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(k==='boss'?0.68:0.42,k==='boss'?1.2:0.8,5,8),material(d.c));
    body.position.y=d.h*0.55;
    body.castShadow=true;
    obj.add(body);

    if(k==='caster'){
      var orb=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,10),material(0x9d6af3,0x3d1b64));
      orb.position.y=d.h+0.25;
      obj.add(orb);
    }

    if(k==='boss'){
      var crown=new THREE.Mesh(new THREE.ConeGeometry(0.75,0.65,6),material(0xeac05d));
      crown.position.y=d.h+0.4;
      obj.add(crown);
    }

    e.obj=obj;
    e.obj.position.copy(e.pos);
    scene.add(e.obj);
    makeEnemyBar(e);
    enemies.push(e);
    spawned++;
  }

  function hit(e,dmg){
    if(e.dead)return;
    e.hp-=dmg;
    if(e.hp<=0){
      e.dead=true;
      gold+=e.gold;
      gainXP(e.xp);

      var count=e.kind==='boss'?22:6;
      for(var i=0;i<count;i++){
        var p=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.08),new THREE.MeshBasicMaterial({color:e.kind==='boss'?0xeac05d:0xdce7dc}));
        p.position.copy(e.pos);
        scene.add(p);
        effects.push({
          obj:p,
          life:0.45,
          max:0.45,
          v:new THREE.Vector3((Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5)
        });
      }
    }
  }

  function gainXP(v){
    xp+=v;
    if(xp>=nextXP){
      xp-=nextXP;
      level++;
      nextXP=Math.floor(nextXP*1.28);
      openLevel();
    }
  }

  function openLevel(){
    state='level';
    var box=$('levelChoices');
    box.replaceChildren();

    [
      ['공격력 +22',function(){hero.damage+=22;}],
      ['최대 HP +120',function(){hero.maxHp+=120;hero.hp+=120;}],
      ['이동속도 +0.35',function(){hero.speed+=0.35;}],
      ['치명타 +5%',function(){hero.crit+=0.05;}]
    ].sort(function(){return Math.random()-0.5;}).slice(0,3).forEach(function(a){
      var b=document.createElement('button');
      b.className='upgradeChoice';
      b.innerHTML='<b>◆</b><span>'+a[0]+'</span>';
      b.onclick=function(){a[1]();hide('levelUp');state='play';syncHud();};
      box.appendChild(b);
    });

    show('levelUp');
  }

  function attack(){
    if(hero.attack>0)return;
    var target=null,best=hero.range;

    enemies.forEach(function(e){
      if(e.dead)return;
      var d=hero.pos.distanceTo(e.pos);
      if(d<best){best=d;target=e;}
    });

    if(!target)return;

    hero.attack=hero.rate;
    var dmg=hero.damage*(Math.random()<hero.crit?2:1);

    if(hero.type==='warrior'){
      hit(target,dmg);
    } else {
      var color=hero.type==='mage'?0x6de1f3:0xeed36e;
      var orb=new THREE.Mesh(new THREE.SphereGeometry(0.10,8,8),new THREE.MeshBasicMaterial({color:color}));
      orb.position.copy(hero.pos);
      scene.add(orb);
      projectiles.push({obj:orb,target:target,damage:dmg});
    }

    if(hero.lifesteal)hero.hp=Math.min(hero.maxHp,hero.hp+hero.lifesteal);
  }

  function useSkill(){
    if(state!=='play' || hero.skill>0)return;

    hero.skill=heroDefs[hero.type].skill;
    var radius=hero.type==='warrior'?4.3:5.7;
    var mult=(hero.type==='warrior'?5.5:hero.type==='mage'?4.8:4.5)*hero.power;

    enemies.forEach(function(e){
      if(!e.dead && hero.pos.distanceTo(e.pos)<radius)hit(e,hero.damage*mult);
    });

    var ring=new THREE.Mesh(
      new THREE.RingGeometry(0.5,radius,40),
      new THREE.MeshBasicMaterial({
        color:hero.type==='mage'?0x62dcef:hero.type==='ranger'?0x7bd46c:0xf0b94c,
        transparent:true,
        opacity:0.8,
        side:THREE.DoubleSide
      })
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.set(hero.pos.x,0.07,hero.pos.z);
    scene.add(ring);
    effects.push({obj:ring,life:0.45,max:0.45});
    notify('필살기 발동');
  }

  function move(dt){
    var x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    var z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    if(!x && !z)return;

    var v=new THREE.Vector3(x,0,z).normalize().multiplyScalar(hero.speed*dt);
    hero.pos.add(v);
    hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-13.2,13.2);
    hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-13.2,13.2);

    if(hero.obj){
      hero.obj.position.copy(hero.pos);
      hero.obj.rotation.y=Math.atan2(v.x,v.z);
    }
  }

  function update(dt){
    if(state!=='play')return;

    hero.attack=Math.max(0,hero.attack-dt);
    hero.skill=Math.max(0,hero.skill-dt);

    move(dt);
    attack();

    spawnClock-=dt;
    if(spawnClock<=0){
      spawnClock=Math.max(0.25,0.62-wave*0.006);
      spawnEnemy();
    }

    projectiles.forEach(function(p){
      if(!p.target || p.target.dead){ p.obj.visible=false; return; }
      var targetPos=new THREE.Vector3(p.target.pos.x,0.8,p.target.pos.z);
      p.obj.position.lerp(targetPos,Math.min(1,dt*15));
      if(p.obj.position.distanceTo(targetPos)<0.2){
        hit(p.target,p.damage);
        p.obj.visible=false;
      }
    });

    projectiles=projectiles.filter(function(p){
      if(p.obj.visible)return true;
      scene.remove(p.obj);
      return false;
    });

    var alive=0;

    enemies.forEach(function(e){
      if(e.dead)return;
      alive++;

      var dir=new THREE.Vector3(-e.pos.x,0,-e.pos.z);
      var dist=dir.length();

      if(dist<2.65){
        tower.hp-=Math.max(1,e.dmg-tower.armor)*dt;
      } else {
        dir.normalize();
        e.pos.addScaledVector(dir,e.speed*dt);
      }

      e.obj.position.copy(e.pos);
      e.obj.position.y=Math.sin(performance.now()*0.006)*0.03;

      if(e.bar && e.bar.userData.fg){
        e.bar.userData.fg.scale.x=Math.max(0.02,e.hp/e.maxHp);
      }
    });

    effects.forEach(function(f){
      f.life-=dt;
      if(f.v){
        f.obj.position.addScaledVector(f.v,dt);
        f.v.multiplyScalar(0.91);
      }
      f.obj.scale.setScalar(1+(f.max-f.life)*1.6);
    });

    effects=effects.filter(function(f){
      if(f.life>0)return true;
      scene.remove(f.obj);
      return false;
    });

    enemies=enemies.filter(function(e){
      if(!e.dead)return true;
      scene.remove(e.obj);
      return false;
    });

    if(spawned>=enemyTotal() && alive===0){
      side=(side+1)%4;
      spawned=0;
      spawnClock=0.55;

      if(side===0){
        wave++;
        gold+=100;
        tower.hp=Math.min(tower.maxHp,tower.hp+160);
        notify('웨이브 '+wave+' 시작');
      } else {
        notify(gateNames[side]+' 방향 적습');
      }
    }

    if(tower.hp<=0){
      tower.hp=0;
      state='over';
      $('overDetail').textContent='웨이브 '+wave+' · 레벨 '+level+' · '+gold+' G · '+heroDefs[hero.type].name;
      show('gameover');
    }

    syncHud();
  }

  function renderInventory(){
    var grid=$('inventoryGrid');
    grid.replaceChildren();

    for(var i=0;i<8;i++){
      var id=inventory[i];
      var b=document.createElement('button');
      b.className='invSlot';

      if(id){
        var it=shopItems.find(function(a){return a.id===id;});
        b.innerHTML='<strong>'+it.name+'</strong><small>'+slots[it.slot]+'</small>';
        b.onclick=(function(index){return function(){equipItem(index);};})(i);
      } else {
        b.innerHTML='<span>빈 슬롯</span>';
        b.disabled=true;
      }

      grid.appendChild(b);
    }

    $('inventoryTitle').textContent=inventory.length+' / 8';
  }

  function rebuildStats(){
    var d=heroDefs[hero.type];
    tower.armor=0;

    hero.maxHp=d.hp;
    hero.speed=d.speed;
    hero.damage=d.damage;
    hero.range=d.range;
    hero.rate=d.rate;
    hero.crit=hero.type==='ranger'?0.16:0.08;
    hero.power=1;
    hero.lifesteal=0;

    Object.keys(equipped).forEach(function(k){
      var it=equipped[k];
      if(!it)return;

      if(it.stat[0]==='maxHp')hero.maxHp+=it.stat[1];
      else if(it.stat[0]==='armor')tower.armor+=it.stat[1];
      else hero[it.stat[0]]+=it.stat[1];
      if(it.rateMul)hero.rate*=it.rateMul;
    });

    hero.hp=Math.min(hero.maxHp,hero.hp);
  }

  function renderEquipment(){
    $('equipCharacter').textContent=heroDefs[hero.type].name;

    var grid=$('equipSlots');
    grid.replaceChildren();

    Object.keys(slots).forEach(function(k){
      var b=document.createElement('button');
      b.className='equipSlot';
      var it=equipped[k];

      b.innerHTML='<b>'+slots[k]+'</b><span>'+(it?it.name:'비어있음')+'</span>';

      b.onclick=function(){
        if(!it)return;
        if(inventory.length>=8){
          notify('인벤토리가 가득 찼습니다');
          return;
        }
        inventory.push(it.id);
        equipped[k]=null;
        refreshGear();
        rebuildStats();
        renderEquipment();
        renderInventory();
        syncHud();
      };

      grid.appendChild(b);
    });

    $('equipStats').innerHTML=
      '공격력 <b>'+Math.round(hero.damage)+'</b> · HP <b>'+Math.round(hero.hp)+'/'+hero.maxHp+'</b><br>'+
      '이동속도 <b>'+hero.speed.toFixed(1)+'</b> · 치명타 <b>'+Math.round(hero.crit*100)+'%</b> · 스킬배율 <b>'+hero.power.toFixed(2)+'x</b>';
  }

  function equipItem(index){
    var id=inventory[index];
    var it=shopItems.find(function(a){return a.id===id;});
    if(!it)return;

    var old=equipped[it.slot];

    if(old){
      inventory[index]=old.id;
    } else {
      inventory.splice(index,1);
    }

    equipped[it.slot]=it;
    rebuildStats();
    refreshGear();
    renderEquipment();
    renderInventory();
    syncHud();
    notify(it.name+' 장착');
  }

  function renderShop(){
    var box=$('shopItems');
    box.replaceChildren();
    $('shopGold').textContent=gold+' G';

    shopItems.forEach(function(it){
      var b=document.createElement('button');
      b.className='shopItem';
      b.innerHTML='<strong>'+it.name+'</strong><span>'+slots[it.slot]+' · '+it.desc+'</span><em>'+it.cost+' G</em>';

      b.onclick=function(){
        if(inventory.length>=8){notify('인벤토리가 가득 찼습니다');return;}
        if(gold<it.cost){notify('골드가 부족합니다');return;}
        gold-=it.cost;
        inventory.push(it.id);
        renderShop();
        renderInventory();
        syncHud();
        notify(it.name+' 획득');
      };

      box.appendChild(b);
    });

    $('bookLine').innerHTML='<span>현재는 장비 시스템을 먼저 안정화한 버전입니다.</span>';
  }

  function toggleShop(){
    if(state==='menu'||state==='over'||state==='level'||state==='equipment')return;

    state=state==='shop'?'play':'shop';
    $('shop').classList.toggle('hidden',state!=='shop');

    if(state==='shop')renderShop();
  }

  function toggleEquipment(){
    if(state==='menu'||state==='over'||state==='level'||state==='shop')return;

    state=state==='equipment'?'play':'equipment';
    $('equipment').classList.toggle('hidden',state!=='equipment');

    if(state==='equipment'){
      renderEquipment();
      renderInventory();
    }
  }

  window.addEventListener('keydown',function(e){
    var k=e.key.toLowerCase();
    keys.add(k);

    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','i','e'].indexOf(k)>=0)e.preventDefault();

    if(k==='q')useSkill();
    if(k==='i')toggleShop();
    if(k==='e')toggleEquipment();

    if(k==='escape'){
      if(state==='play'){state='pause';show('pause');}
      else if(state==='pause'){state='play';hide('pause');}
      else if(state==='shop'){toggleShop();}
      else if(state==='equipment'){toggleEquipment();}
    }
  });

  window.addEventListener('keyup',function(e){ keys.delete(e.key.toLowerCase()); });

  $('startBtn').onclick=function(){ hide('start'); show('heroSelect'); };
  $('warriorBtn').onclick=function(){ startHero('warrior'); };
  $('mageBtn').onclick=function(){ startHero('mage'); };
  $('rangerBtn').onclick=function(){ startHero('ranger'); };
  $('shopBtn').onclick=toggleShop;
  $('equipBtn').onclick=toggleEquipment;
  $('shopClose').onclick=toggleShop;
  $('equipClose').onclick=toggleEquipment;
  $('resumeBtn').onclick=function(){state='play';hide('pause');};
  $('restartBtn').onclick=function(){state='menu';hideAll();show('start');syncHud();};

  function resize(){
    renderer.setSize(window.innerWidth,window.innerHeight,false);
    var aspect=Math.max(0.55,window.innerWidth/window.innerHeight);
    var h=10,w=h*aspect;
    camera.left=-w;camera.right=w;camera.top=h;camera.bottom=-h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize',resize);
  resize();
  makeHeroVisual();
  syncHud();

  var last=performance.now();

  function animate(now){
    var dt=Math.min(0.033,Math.max(0,(now-last)/1000));
    last=now;
    update(dt);
    crystal.rotation.y+=dt*1.2;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}