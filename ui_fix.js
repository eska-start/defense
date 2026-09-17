(() => {
  const $ = id => document.getElementById(id);
  const equipment = $('equipment');
  const notice = $('notice');

  if (!equipment) return;

  const open = () => {
    equipment.classList.remove('hidden');
    $('pause')?.classList.add('hidden');
    renderEquipment();
  };

  const close = () => {
    equipment.classList.add('hidden');
  };

  const showNotice = message => {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add('show');
    clearTimeout(window.__equipmentNotice);
    window.__equipmentNotice = setTimeout(() => notice.classList.remove('show'), 1200);
  };

  function renderEquipment() {
    const slots = $('equipSlots');
    const grid = $('inventoryGrid');
    if (!slots || !grid) return;

    const names = [
      ['helmet','투구'], ['armor','갑옷'], ['gloves','장갑'], ['boots','신발'],
      ['weapon','주무기'], ['offhand','보조무기'], ['ring','반지'], ['amulet','목걸이']
    ];

    slots.replaceChildren();
    grid.replaceChildren();

    names.forEach(([id,name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'equipSlot';
      b.dataset.slot = id;
      b.innerHTML = `<strong>${name}</strong><span>비어 있음</span>`;
      b.addEventListener('click', () => showNotice(`${name} 슬롯`));
      slots.appendChild(b);
    });

    for (let i = 0; i < 8; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'invSlot';
      b.innerHTML = `<strong>SLOT ${i + 1}</strong><small>비어 있음</small>`;
      grid.appendChild(b);
    }

    if ($('inventoryTitle')) $('inventoryTitle').textContent = '0 / 8';
    if ($('inventoryText')) $('inventoryText').textContent = '0 / 8';
    if ($('equipCharacter')) $('equipCharacter').textContent = $('heroName')?.textContent || '전사';
  }

  const equipBtn = $('equipBtn');
  if (equipBtn) {
    equipBtn.type = 'button';
    equipBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      open();
      return false;
    };
  }

  const closeBtn = $('equipClose');
  if (closeBtn) {
    closeBtn.type = 'button';
    closeBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      close();
      return false;
    };
  }

  document.addEventListener('keydown', e => {
    const k = String(e.key || '').toLowerCase();
    if (k === 'e' && !e.repeat) {
      e.preventDefault();
      e.stopPropagation();
      open();
    } else if (k === 'escape' && !equipment.classList.contains('hidden')) {
      e.preventDefault();
      close();
    }
  }, true);

  window.openEquipment = open;
})();