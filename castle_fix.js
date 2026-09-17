import * as THREE from 'three';

const originalAdd=THREE.Scene.prototype.add;
let gameScene=null;
let castleParts=[];
THREE.Scene.prototype.add=function(...objects){
  if(!gameScene) gameScene=this;
  const result=originalAdd.apply(this,objects);
  for(const o of objects){
    if(!o?.isMesh||o.userData?.castleFix)continue;
    const p=o.geometry?.parameters;
    if(!p)continue;
    const isBase=p.width===5.6&&p.height===3&&p.depth===5;
    const isDoor=p.width===1.5&&p.height===2.3&&p.depth===.7;
    const isWall=p.radiusTop===.72&&p.radiusBottom===.72&&p.height===4.2;
    const isRoof=p.radius===3.4&&p.height===2;
    const isCrystal=p.radius===.55&&o.geometry?.type==='OctahedronGeometry';
    if(isBase||isDoor||isWall||isRoof||isCrystal)castleParts.push(o);
  }
  return result;
};

function mat(c,e=0){return new THREE.MeshStandardMaterial({color:c,roughness:.72,emissive:e,emissiveIntensity:e?1.5:0});}
function replaceCastle(){
  if(!gameScene||gameScene.userData.smallTowerInstalled)return;
  gameScene.userData.smallTowerInstalled=true;
  for(const o of castleParts)o.visible=false;
  const g=new THREE.Group();g.userData.castleFix=true;g.position.set(0,0,0);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.65,.55,10),mat(0x526a5a));base.position.y=.28;base.castShadow=true;base.receiveShadow=true;g.add(base);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.58,.78,2.6,8),mat(0x718878));pillar.position.y=1.75;pillar.castShadow=true;pillar.receiveShadow=true;g.add(pillar);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.95,.55,8),mat(0x875947));cap.position.y=3.32;cap.castShadow=true;g.add(cap);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.42),mat(0x59d8d0,0x144d4a));crystal.position.y=3.75;crystal.castShadow=true;g.add(crystal);
  gameScene.add(g);
}
setTimeout(replaceCastle,300);
setTimeout(replaceCastle,1000);
