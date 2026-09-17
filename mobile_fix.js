const joystick=document.getElementById('mobileJoystick');
const stick=document.getElementById('mobileStick');
const skill=document.getElementById('mobileSkill');

function sendKey(key,type='keydown'){
  window.dispatchEvent(new KeyboardEvent(type,{key,code:key==='w'?'KeyW':key==='a'?'KeyA':key==='s'?'KeyS':key==='d'?'KeyD':'KeyQ',bubbles:true,cancelable:true}));
}

if(joystick&&stick){
  const active=new Set();
  let pid=null;
  let touchId=null;
  function release(){
    for(const k of active)sendKey(k,'keyup');
    active.clear();
    pid=null;touchId=null;
    stick.style.left='50%';stick.style.top='50%';
    stick.style.transform='translate(-50%,-50%)';
  }
  function updatePoint(clientX,clientY){
    const r=joystick.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=clientX-cx,dy=clientY-cy;
    const max=r.width*.34,len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    stick.style.left='50%';stick.style.top='50%';
    stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    const next=new Set();
    if(dx>max*.18)next.add('d');else if(dx<-max*.18)next.add('a');
    if(dy>max*.18)next.add('s');else if(dy<-max*.18)next.add('w');
    for(const k of active)if(!next.has(k))sendKey(k,'keyup');
    for(const k of next)if(!active.has(k))sendKey(k,'keydown');
    active.clear();next.forEach(k=>active.add(k));
  }
  joystick.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{joystick.setPointerCapture(pid)}catch{}updatePoint(e.clientX,e.clientY)},{passive:false});
  joystick.addEventListener('pointermove',e=>{if(pid!==e.pointerId)return;e.preventDefault();updatePoint(e.clientX,e.clientY)},{passive:false});
  const endPointer=e=>{if(pid!==null&&e.pointerId===pid){e.preventDefault();release()} };
  joystick.addEventListener('pointerup',endPointer,{passive:false});
  joystick.addEventListener('pointercancel',endPointer,{passive:false});

  joystick.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];if(!t)return;touchId=t.identifier;updatePoint(t.clientX,t.clientY)},{passive:false});
  joystick.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier===touchId){updatePoint(t.clientX,t.clientY);break;}}},{passive:false});
  joystick.addEventListener('touchend',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier===touchId){release();break;}}},{passive:false});
  joystick.addEventListener('touchcancel',e=>{e.preventDefault();release()},{passive:false});
  window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
}

if(skill){
  const fire=e=>{e.preventDefault();e.stopPropagation();sendKey('q','keydown');setTimeout(()=>sendKey('q','keyup'),80)};
  skill.addEventListener('pointerdown',fire,{passive:false});
  skill.addEventListener('touchstart',fire,{passive:false});
}
