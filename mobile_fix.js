// 모바일 조이스틱 입력을 게임 내부의 keys Set과 직접 연결합니다.
(() => {
  const mobileKeys = Object.create(null);
  window.__mobileKeys = mobileKeys;
  const nativeHas = Set.prototype.has;
  const directions = new Set(['w','a','s','d']);
  Set.prototype.has = function(value){
    if (directions.has(value) && mobileKeys[value]) return true;
    return nativeHas.call(this,value);
  };

  const joystick = document.getElementById('mobileJoystick');
  const stick = document.getElementById('mobileStick');
  if (joystick && stick) {
    let pointerId = null;
    let touchId = null;

    function clearKeys(){
      mobileKeys.w = mobileKeys.a = mobileKeys.s = mobileKeys.d = false;
      stick.style.transform='translate(-50%,-50%)';
    }

    function apply(x,y){
      const r=joystick.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=x-cx, dy=y-cy;
      const max=r.width*.34, len=Math.hypot(dx,dy);
      if(len>max){dx=dx/len*max;dy=dy/len*max;}
      stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
      mobileKeys.w = dy < -max*.18;
      mobileKeys.s = dy >  max*.18;
      mobileKeys.a = dx < -max*.18;
      mobileKeys.d = dx >  max*.18;
    }

    joystick.addEventListener('pointerdown',e=>{
      e.preventDefault(); pointerId=e.pointerId;
      try{joystick.setPointerCapture(pointerId)}catch{}
      apply(e.clientX,e.clientY);
    },{passive:false});
    joystick.addEventListener('pointermove',e=>{
      if(e.pointerId!==pointerId)return;
      e.preventDefault(); apply(e.clientX,e.clientY);
    },{passive:false});
    const pointerEnd=e=>{
      if(pointerId!==null && e.pointerId===pointerId){e.preventDefault();pointerId=null;clearKeys();}
    };
    joystick.addEventListener('pointerup',pointerEnd,{passive:false});
    joystick.addEventListener('pointercancel',pointerEnd,{passive:false});

    joystick.addEventListener('touchstart',e=>{
      e.preventDefault();
      const t=e.changedTouches[0];
      if(!t)return; touchId=t.identifier; apply(t.clientX,t.clientY);
    },{passive:false});
    joystick.addEventListener('touchmove',e=>{
      e.preventDefault();
      for(const t of e.changedTouches){
        if(t.identifier===touchId){apply(t.clientX,t.clientY);break;}
      }
    },{passive:false});
    const touchEnd=e=>{
      e.preventDefault();
      for(const t of e.changedTouches){
        if(t.identifier===touchId){touchId=null;clearKeys();break;}
      }
    };
    joystick.addEventListener('touchend',touchEnd,{passive:false});
    joystick.addEventListener('touchcancel',touchEnd,{passive:false});
    window.addEventListener('blur',clearKeys);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
  }

  const skill=document.getElementById('mobileSkill');
  if(skill){
    const fire=e=>{
      e.preventDefault(); e.stopPropagation();
      // Q는 기존 게임의 keydown 핸들러를 호출하되 이동에는 합성 키보드 입력을 사용하지 않습니다.
      window.dispatchEvent(new KeyboardEvent('keydown',{key:'q',code:'KeyQ',bubbles:true,cancelable:true}));
    };
    skill.addEventListener('pointerdown',fire,{passive:false});
    skill.addEventListener('touchstart',fire,{passive:false});
  }
})();
