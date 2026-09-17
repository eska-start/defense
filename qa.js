(()=>{'use strict';
const start=document.getElementById('startBtn');
if(start){
  const handler=start.onclick;
  start.onclick=null;
  start.addEventListener('click',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(typeof handler==='function') handler.call(start,e);
    const overlay=document.getElementById('start');
    if(overlay) overlay.classList.add('hidden');
  });
}
const restart=document.getElementById('restartBtn');
if(restart){
  const handler=restart.onclick;
  restart.onclick=null;
  restart.addEventListener('click',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(typeof handler==='function') handler.call(restart,e);
  },true);
}
})();
