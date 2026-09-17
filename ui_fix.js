(() => {
  const $ = id => document.getElementById(id);
  const equipment = $('equipment');
  const shop = $('shop');
  const pause = $('pause');
  const notice = $('notice');

  if (!equipment || !shop) return;

  const isOverlayOpen = id => $(id) && !$(id).classList.contains('hidden');
  const hide = id => $(id)?.classList.add('hidden');
  const show = id => $(id)?.classList.remove('hidden');

  function canOpenMenu() {
    return !isOverlayOpen('start') && !isOverlayOpen('heroSelect') &&
           !isOverlayOpen('levelUp') && !isOverlayOpen('gameover') &&
           !isOverlayOpen('pause');
  }

  function pauseGame() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    hide('pause');
  }

  function resumeGame() {
    hide('equipment');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  const slotNames = [
    ['helmet','투구'], ['armor','갑옷'], ['gloves','장갑'], ['boots','신발'],
    ['weapon','주무기'], ['offhand','보조무기'], ['ring','반지'], ['amulet','목걸이']
  ];

  function renderEquipment() {
    const slots = $('equipSlots');
    const grid = $('inventoryGrid');
    const title = $('inventoryTitle');
    const text = $('inventoryText');
    const character = $('equipCharacter');
    if (!slots || !grid) return;

    character && (character.textContent = $('heroName')?.textContent || '전사');
    slots.replaceChildren();
    grid.replaceChildren();

    slotNames.forEach(([id, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'equipSlot';
      b.dataset.slot = id;
      b.innerHTML = `<strong>${name}</strong><small>비어 있음</small>`;
      b.onclick = () => notice && showNotice(`${name} 슬롯은 아직 비어 있습니다.`);
      slots.appendChild(b);
    });

    for (let i = 0; i < 8; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'inventoryItem empty';
      b.innerHTML = `<strong>SLOT ${i + 1}</strong><span>비어 있음</span>`;
      grid.appendChild(b);
    }

    if (title) title.textContent = '0 / 8';
    if (text) text.textContent = '0 / 8';
  }

  function showNotice(message) {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add('show');
    clearTimeout(window.__uiFixNotice);
    window.__uiFixNotice = setTimeout(() => notice.classList.remove('show'), 1400);
  }

  function openEquipment() {
    if (isOverlayOpen('equipment')) return;
    if (!canOpenMenu()) return;
    renderEquipment();
    pauseGame();
    show('equipment');
  }

  function closeEquipment() {
    if (!isOverlayOpen('equipment')) return;
    resumeGame();
  }

  $('equipBtn')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openEquipment();
  });

  $('shopBtn')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!canOpenMenu()) return;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', bubbles: true }));
  });

  $('equipClose')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    closeEquipment();
  });

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'e' && !e.repeat) {
      e.preventDefault();
      openEquipment();
    }
    if (k === 'escape' && isOverlayOpen('equipment')) {
      e.preventDefault();
      closeEquipment();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (isOverlayOpen('equipment')) renderEquipment();
  });
})();
