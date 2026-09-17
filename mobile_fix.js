const joystick = document.getElementById('mobileJoystick');
const stick = document.getElementById('mobileStick');
if (joystick && stick) {
  const active = new Set();
  const center = {x:0,y:0};
  let pointerId = null;
  function key(code,on){
    const ev = new KeyboardEvent(on?'keydown':'keyup',{key:code,bubbles:true,cancelable:true});
    window.dispatchEvent(ev);
  }
  function releaseAll(){
    for(const k of active){key(k,false);}
    active.clear();
    stick.style.transform='translate(-50%,-50%)';
  }
  function update(e){
    const r=joystick.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=e.clientX-cx, dy=e.clientY-cy;
    const max=r.width*.32, len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    stick.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const next=new Set();
    if(Math.abs(dx)>max*.22) next.add(dx>0?'d':'a');
    if(Math.abs(dy)>max*.22) next.add(dy>0?'s':'w');
    for(const k of active) if(!next.has(k)) key(k,false);
    for(const k of next) if(!active.has(k)) key(k,true);
    active.clear(); for(const k of next) active.add(k);
  }
  joystick.addEventListener('pointerdown',e=>{pointerId=e.pointerId;joystick.setPointerCapture(pointerId);update(e);e.preventDefault();},{passive:false});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)update(e);e.preventDefault();},{passive:false});
  joystick.addEventListener('pointerup',e=>{if(e.pointerId===pointerId){releaseAll();pointerId=null;}e.preventDefault();},{passive:false});
  joystick.addEventListener('pointercancel',releaseAll,{passive:false});
  window.addEventListener('blur',releaseAll);
}

const skill=document.getElementById('mobileSkill');
if(skill) skill.addEventListener('pointerdown',e=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:'q',bubbles:true}));e.preventDefault();},{passive:false});
