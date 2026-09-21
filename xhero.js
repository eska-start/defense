/* ═══════════════════════════════════════════════════════════
   LUMIA GUARDIANS — 신비로운 마법숲 판타지 디펜스 RPG
   GLTF 3D 캐릭터 모델 (Soldier, Michelle, Robot, Xbot) + 애니메이션 믹서 + 수평 체력바
═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const $=id=>document.getElementById(id);
const show=id=>$(id)?.classList.remove('hidden');
const hide=id=>$(id)?.classList.add('hidden');
const hideAll=()=>['start','heroSelect','skillUp','shop','soundModal','pause','gameover','victory','deadOverlay'].forEach(hide);

/* ─── CONFIG ─── */
const MAX_WAVE=30,MAP_H=15,TWR_RNG=6.5,TWR_DMG=25,TWR_RATE=1.0,RESPAWN=6;
const GATES=[new THREE.Vector3(0,0,-15),new THREE.Vector3(15,0,0),new THREE.Vector3(0,0,15),new THREE.Vector3(-15,0,0)];
const GNAMES=['북','동','남','서'];
const SK='QWER'.split('');

/* ═══ SOUND & BGM SYSTEM (Dual Engine: Web Audio API + HTML5 Audio) ═══ */
const SoundManager = {
  ctx: null,
  masterGain: null,
  sfxGain: null,
  bgmEl: null,
  bgmVol: 0.5,
  sfxVol: 0.7,
  isMuted: false,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bgmEl = $('bgmAudio');

    // Load saved settings (Default is unmuted with 50% BGM, 70% SFX)
    const savedMute = localStorage.getItem('xhero_muted_v2');
    this.isMuted = savedMute === 'true';
    const savedBgm = localStorage.getItem('xhero_bgm_vol');
    if (savedBgm !== null) this.bgmVol = Math.max(0, Math.min(1, parseFloat(savedBgm)));
    const savedSfx = localStorage.getItem('xhero_sfx_vol');
    if (savedSfx !== null) this.sfxVol = Math.max(0, Math.min(1, parseFloat(savedSfx)));

    this.setupWebAudio();
    this.bindControls();
    this.updateUI();

    // User gesture unlocking for audio playback
    const unlock = () => {
      this.resumeContext();
      if (!this.isMuted) {
        this.playBgm();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  },

  setupWebAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio setup failed:', e);
    }
  },

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  playBgm() {
    this.resumeContext();
    if (!this.bgmEl) return;
    this.bgmEl.volume = this.isMuted ? 0 : this.bgmVol;
    const p = this.bgmEl.play();
    if (p && p.catch) {
      p.catch(() => {
        // Autoplay may be blocked until user clicks
      });
    }
  },

  stopBgm() {
    if (this.bgmEl) {
      this.bgmEl.pause();
    }
  },

  setBgmVolume(val) {
    this.bgmVol = Math.max(0, Math.min(1, val));
    localStorage.setItem('xhero_bgm_vol', this.bgmVol.toString());
    if (this.bgmEl) {
      this.bgmEl.volume = this.isMuted ? 0 : this.bgmVol;
      if (!this.isMuted && this.bgmEl.paused && this.bgmVol > 0) {
        this.playBgm();
      }
    }
    this.updateUI();
  },

  setSfxVolume(val) {
    this.sfxVol = Math.max(0, Math.min(1, val));
    localStorage.setItem('xhero_sfx_vol', this.sfxVol.toString());
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
    this.updateUI();
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('xhero_muted_v2', this.isMuted ? 'true' : 'false');
    if (this.bgmEl) {
      this.bgmEl.volume = this.isMuted ? 0 : this.bgmVol;
      if (this.isMuted) {
        this.stopBgm();
      } else {
        this.playBgm();
      }
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    this.updateUI();
  },

  openModal() {
    this.init();
    this.resumeContext();
    this.updateUI();
    show('soundModal');
  },

  closeModal() {
    hide('soundModal');
  },

  bindControls() {
    const bgmSlider = $('bgmSlider');
    const sfxSlider = $('sfxSlider');
    const modalMuteBtn = $('modalMuteBtn');
    const soundClose = $('soundClose');
    const soundBtn = $('soundBtn');

    if (bgmSlider) {
      bgmSlider.oninput = () => {
        this.setBgmVolume(bgmSlider.value / 100);
      };
    }
    if (sfxSlider) {
      sfxSlider.oninput = () => {
        this.setSfxVolume(sfxSlider.value / 100);
        this.play('click');
      };
    }
    if (modalMuteBtn) {
      modalMuteBtn.onclick = () => {
        this.toggleMute();
      };
    }
    if (soundClose) {
      soundClose.onclick = () => {
        this.play('click');
        this.closeModal();
      };
    }
    if (soundBtn) {
      soundBtn.onclick = (e) => {
        e.preventDefault();
        this.play('click');
        this.openModal();
      };
    }
  },

  updateUI() {
    const bgmSlider = $('bgmSlider');
    const sfxSlider = $('sfxSlider');
    const bgmVolText = $('bgmVolText');
    const sfxVolText = $('sfxVolText');
    const modalMuteBtn = $('modalMuteBtn');
    const soundBtn = $('soundBtn');

    const bgmPercent = Math.round(this.bgmVol * 100);
    const sfxPercent = Math.round(this.sfxVol * 100);

    if (bgmSlider) bgmSlider.value = bgmPercent;
    if (sfxSlider) sfxSlider.value = sfxPercent;
    if (bgmVolText) bgmVolText.textContent = this.isMuted ? '0% (음소거)' : bgmPercent + '%';
    if (sfxVolText) sfxVolText.textContent = this.isMuted ? '0% (음소거)' : sfxPercent + '%';

    if (modalMuteBtn) {
      modalMuteBtn.textContent = this.isMuted ? '🔇 음소거 해제' : '🔊 전체 음소거';
      modalMuteBtn.classList.toggle('muted', this.isMuted);
    }
    if (soundBtn) {
      soundBtn.textContent = this.isMuted ? '🔇' : '🔊';
      soundBtn.classList.toggle('muted', this.isMuted);
      soundBtn.title = '사운드 설정 (BGM / SFX)';
    }
  },

  play(id) {
    if (this.isMuted || this.sfxVol <= 0) return;
    if (!this.ctx) this.setupWebAudio();
    if (!this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const dest = this.sfxGain || this.ctx.destination;

    try {
      switch (id) {
        case 'slash': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(460, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.12);
          break;
        }
        case 'shoot': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, t);
          osc.frequency.exponentialRampToValueAtTime(220, t + 0.14);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.14);
          break;
        }
        case 'magic_orb': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.linearRampToValueAtTime(680, t + 0.16);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.18);
          break;
        }
        case 'hit_monster': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.08);
          break;
        }
        case 'hit_hero': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.14);
          break;
        }
        case 'monster_die': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, t);
          osc.frequency.exponentialRampToValueAtTime(1040, t + 0.12);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.14);
          break;
        }
        case 'tower_hit': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.setValueAtTime(200, t + 0.08);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.2);
          break;
        }
        case 'skill_wind': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(650, t);
          osc.frequency.exponentialRampToValueAtTime(140, t + 0.24);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.24);
          break;
        }
        case 'skill_shield': {
          [523, 659, 784].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.06);
            gain.gain.setValueAtTime(0.22, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.26);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.26);
          });
          break;
        }
        case 'skill_taunt': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(65, t + 0.32);
          gain.gain.setValueAtTime(0.38, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.32);
          break;
        }
        case 'skill_meteor': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(110, t);
          osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);
          gain.gain.setValueAtTime(0.42, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.48);
          break;
        }
        case 'skill_heal': {
          [440, 554, 659, 880].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.07);
            gain.gain.setValueAtTime(0.24, t + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.3);
          });
          break;
        }
        case 'skill_revive': {
          [392, 523, 659, 784, 1046].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t + i * 0.08);
            gain.gain.setValueAtTime(0.28, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.35);
          });
          break;
        }
        case 'level_up': {
          [523, 659, 784, 1046].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t + i * 0.09);
            gain.gain.setValueAtTime(0.3, t + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.35);
          });
          break;
        }
        case 'gold': {
          [987, 1318].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.06);
            gain.gain.setValueAtTime(0.22, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.18);
          });
          break;
        }
        case 'buy': {
          [784, 987, 1174].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.05);
            gain.gain.setValueAtTime(0.26, t + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.22);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.22);
          });
          break;
        }
        case 'craft': {
          [523, 659, 784, 1046, 1318].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t + i * 0.06);
            gain.gain.setValueAtTime(0.28, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.3);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.3);
          });
          break;
        }
        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(950, t);
          osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
          osc.connect(gain); gain.connect(dest);
          osc.start(t); osc.stop(t + 0.04);
          break;
        }
        case 'victory': {
          [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t + i * 0.1);
            gain.gain.setValueAtTime(0.32, t + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.5);
          });
          break;
        }
        case 'gameover': {
          [440, 415, 392, 349].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t + i * 0.22);
            gain.gain.setValueAtTime(0.26, t + i * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.35);
            osc.connect(gain); gain.connect(dest);
            osc.start(t + i * 0.22); osc.stop(t + i * 0.22 + 0.35);
          });
          break;
        }
      }
    } catch(e) {}
  }
};

/* ─── HEROES (Title Concept Art Witchbrook & Little Witch Characters) ─── */
const HEROES={
  warrior:{name:'모험가 레오',color:0x16a34a,hp:800,spd:5.5,dmg:55,rng:2.8,rate:.38,
    desc:'근접 · 숏소드 & 버클러 · 씩씩한 소년 기사',
    skills:{
      Q:{name:'바람 베기',desc:'주변 범위 검격 피해',cd:[10,9,7,5],mul:[1.6,2.2,3.2,4.5],r:4.5,type:'aoe'},
      W:{name:'수호 자세',desc:'받는 피해 대폭 감소',cd:[18,15,12,8],dur:[3,4,5,6],val:[.3,.4,.5,.6],type:'buff_def'},
      E:{name:'도발의 함성',desc:'주변 적 끌어모음',cd:[15,13,11,9],r:[5,6,7,8],dur:[2,2.5,3,3.5],type:'taunt'},
      R:{name:'용기의 일격',desc:'거대 지진파 충격+기절',cd:[55,45,35],mul:[5,7,10],r:7,type:'aoe_stun',ulti:1}}},
  mage:{name:'마녀 엘리',color:0x38bdf8,hp:450,spd:5,dmg:70,rng:5.5,rate:.55,
    desc:'원거리 · 아케인 오브 · 숲속의 큰모자 마녀',
    skills:{
      Q:{name:'별빛 보주',desc:'폭발하는 마법 보주',cd:[8,7,5.5,4],mul:[2,2.6,3.5,5],r:2.5,type:'proj_aoe'},
      W:{name:'프로스트 룬',desc:'범위 지속 눈보라+둔화',cd:[18,15,12,8],mul:[.6,1,1.4,2],r:4,dur:4,type:'zone'},
      E:{name:'마나 쉴드',desc:'피해 흡수 마법 방어막',cd:[20,17,14,10],val:[80,140,200,300],type:'shield_self'},
      R:{name:'에테르 메테오',desc:'밤하늘에서 별똥별 폭격',cd:[60,50,40],mul:[6,9,14],r:5.5,type:'aoe',ulti:1}}},
  ranger:{name:'사수 로빈',color:0xeab308,hp:500,spd:6.5,dmg:45,rng:7,rate:.22,
    desc:'원거리 · 롱보우 & 붉은망토 · 숲의 금발 사수',
    skills:{
      Q:{name:'다중 사격',desc:'여러 적 동시 화살 사격',cd:[9,8,6.5,5],cnt:[3,4,5,6],mul:[.8,1,1.3,1.6],type:'multi'},
      W:{name:'숲의 독화살',desc:'공격에 지속 독 부여',cd:[13,11,9,7],dot:[4,7,11,16],dur:[4,5,6,7],type:'poison_buff'},
      E:{name:'질풍 회피',desc:'이동속도 & 회피율 급증',cd:[22,18,15,11],dur:[4,5,6,7],val:[.25,.35,.45,.6],type:'buff_eva'},
      R:{name:'화살 비',desc:'넓은 범위 화살 폭풍',cd:[55,45,35],mul:[4,6,10],r:6.5,type:'aoe',ulti:1}}},
  assassin:{name:'방랑자 니나',color:0xf97316,hp:420,spd:7,dmg:65,rng:2.2,rate:.30,
    desc:'근접 · 크리스탈 단검 · 땋은머리 여행자 마녀',
    skills:{
      Q:{name:'단검 투척',desc:'원거리 크리스탈 단검',cd:[7,6,5,3.5],mul:[1.6,2,2.8,3.8],type:'proj_single'},
      W:{name:'그림자 은신',desc:'은신+다음 기습 일격 강화',cd:[20,17,14,10],mul:[2.5,3.5,4.5,6],dur:[3,4,5,6],type:'stealth'},
      E:{name:'급소 찌르기',desc:'치명타 확률 증가 (패시브)',cd:[0,0,0,0],val:[.06,.10,.14,.20],type:'passive'},
      R:{name:'크리스탈 난무',desc:'대상에게 순간 폭딜 연타',cd:[50,42,30],mul:[8,12,18],rng:3.5,type:'execute',ulti:1}}},
  paladin:{name:'꼬마 마녀 루루',color:0xdb2777,hp:700,spd:5.2,dmg:50,rng:2.5,rate:.42,
    desc:'근접/치유 · 고대 마법책 & 성스러운 빛 · 핑크모자 마녀',
    skills:{
      Q:{name:'성스러운 찬송',desc:'피해+자신 HP 회복',cd:[9,8,6.5,5],mul:[1.6,2.2,2.8,3.8],heal:[.4,.5,.65,.8],r:3.5,type:'holy'},
      W:{name:'치유의 마법',desc:'자신 HP 대폭 회복',cd:[15,13,11,8],heal:[1.2,1.8,2.5,3.5],type:'heal'},
      E:{name:'수호탑 보호막',desc:'수호탑에 강력한 마법막 부여',cd:[25,22,18,13],val:[120,220,320,500],type:'shield_tower'},
      R:{name:'부활의 서약',desc:'사망 시 즉시 부활 (1회)',cd:[100,85,65],type:'revive',ulti:1}}}
};

/* ─── ENEMIES (Forest Creatures) ─── */
const ETYPES={
  grunt :{name:'숲속 슬라임',hp:80,spd:1.6,dmg:10,gold:8,xp:12,h:1.4,color:0x38bdf8},
  runner:{name:'마법 버섯요괴',hp:55,spd:3.0,dmg:7,gold:10,xp:15,h:1.25,color:0xef4444},
  tank  :{name:'가시덤불 바위병',hp:280,spd:.9,dmg:25,gold:22,xp:32,h:1.9,color:0x475569},
  caster:{name:'어둠의 마녀',hp:140,spd:1.3,dmg:18,gold:20,xp:28,h:1.5,color:0x9333ea},
  brute :{name:'고대 이끼골렘',hp:500,spd:.7,dmg:40,gold:40,xp:50,h:2.4,color:0x16a34a},
  boss  :{name:'보스 Pit Lord',hp:5000,spd:.55,dmg:90,gold:400,xp:500,h:3.8,color:0xdc2626}
};

/* ─── ITEMS ─── */
const ITEMS=[
  {id:'sword',name:'강철검',cost:220,desc:'공격력 +20',stats:{damage:20},tier:1},
  {id:'staff',name:'마력석',cost:220,desc:'스킬 피해 +15%',stats:{power:.15},tier:1},
  {id:'shield',name:'나무 방패',cost:180,desc:'HP +80',stats:{maxHp:80},tier:1},
  {id:'boots',name:'가죽 장화',cost:180,desc:'이동속도 +0.5',stats:{speed:.5},tier:1},
  {id:'ring',name:'힘의 반지',cost:260,desc:'공격력 +12, 치명 +5%',stats:{damage:12,crit:.05},tier:1},
  {id:'cloak',name:'그림자 망토',cost:240,desc:'회피 +8%, 이속 +0.3',stats:{evasion:.08,speed:.3},tier:1},
  {id:'amulet',name:'생명 부적',cost:300,desc:'흡혈 +4, HP +60',stats:{lifesteal:4,maxHp:60},tier:1},
  {id:'gem',name:'속도의 보석',cost:260,desc:'공격속도 +12%',stats:{rateBonus:.12},tier:1},
  {id:'feather',name:'마법의 깃털',cost:200,desc:'쿨타임 감소 8%',stats:{cdReduction:.08},tier:1},
  {id:'resist',name:'저항의 부적',cost:240,desc:'방어 +2, HP +40',stats:{armor:2,maxHp:40},tier:1},
  {id:'lens',name:'정밀의 렌즈',cost:280,desc:'사거리 +0.8, 치명 +4%',stats:{rangeBonus:.8,crit:.04},tier:1},
  {id:'orb',name:'축복의 구슬',cost:300,desc:'HP +60, 스킬 +10%',stats:{maxHp:60,power:.1},tier:1},
];
const RECIPES=[
  {id:'magic_sword',name:'마법검',desc:'공격력 +45, 스킬 +15%',stats:{damage:45,power:.15},tier:2,mats:['sword','staff'],extra:80},
  {id:'guardian',name:'수호 갑옷',desc:'HP +220, 방어 +3',stats:{maxHp:220,armor:3},tier:2,mats:['shield','shield'],extra:80},
  {id:'swift',name:'신속 부츠',desc:'이속 +1.2, 공격력 +12',stats:{speed:1.2,damage:12},tier:2,mats:['boots','ring'],extra:100},
  {id:'shadow',name:'그림자 검',desc:'공격력 +30, 치명 +12%',stats:{damage:30,crit:.12},tier:2,mats:['sword','cloak'],extra:100},
  {id:'vamp',name:'흡혈 구슬',desc:'흡혈 +8, 공속 +12%',stats:{lifesteal:8,rateBonus:.12},tier:2,mats:['amulet','gem'],extra:100},
  {id:'arcane',name:'비전 집중체',desc:'스킬 +35%, 공속 +12%',stats:{power:.35,rateBonus:.12},tier:2,mats:['staff','gem'],extra:120},
  {id:'mage_rod',name:'마법사의 지팡이',desc:'스킬 +28%, 쿨감 10%',stats:{power:.28,cdReduction:.10},tier:2,mats:['staff','feather'],extra:80},
  {id:'iron_wall',name:'강철 수호',desc:'HP +180, 방어 +5',stats:{maxHp:180,armor:5},tier:2,mats:['shield','resist'],extra:60},
  {id:'hunter_bow',name:'사냥꾼의 활',desc:'공 +18, 거리 +1, 치명 +8%',stats:{damage:18,rangeBonus:1,crit:.08},tier:2,mats:['ring','lens'],extra:80},
  {id:'holy_grail',name:'생명의 성배',desc:'흡혈 +6, HP +130, 스킬 +10%',stats:{lifesteal:6,maxHp:130,power:.10},tier:2,mats:['amulet','orb'],extra:100},
  {id:'wind_blade',name:'질풍의 검',desc:'공 +30, 이속 +0.8, 공속 +8%',stats:{damage:30,speed:.8,rateBonus:.08},tier:2,mats:['sword','boots'],extra:60},
  {id:'divine',name:'신성검',desc:'공 +80, 스킬 +25%, 치명 +10%',stats:{damage:80,power:.25,crit:.1},tier:3,mats:['magic_sword','ring'],extra:200},
  {id:'titan',name:'타이탄 갑옷',desc:'HP +500, 방어 +8',stats:{maxHp:500,armor:8},tier:3,mats:['guardian','shield'],extra:250},
  {id:'god_boots',name:'천공 부츠',desc:'이속 +2, 공 +25, 회피 +10%',stats:{speed:2,damage:25,evasion:.1},tier:3,mats:['swift','boots'],extra:200},
  {id:'arch_staff',name:'대마법사의 법구',desc:'스킬 +55%, 쿨감 15%, 공속 +15%',stats:{power:.55,cdReduction:.15,rateBonus:.15},tier:3,mats:['arcane','mage_rod'],extra:250},
  {id:'immortal',name:'불멸의 갑옷',desc:'HP +750, 방어 +14',stats:{maxHp:750,armor:14},tier:3,mats:['titan','iron_wall'],extra:300},
  {id:'storm_bow',name:'폭풍의 활',desc:'공 +55, 이속 +1.5, 치명 +14%',stats:{damage:55,speed:1.5,crit:.14,rangeBonus:1},tier:3,mats:['hunter_bow','swift'],extra:250},
  {id:'worldtree',name:'세계수의 가호',desc:'공 +120, 이속 +2.5, 치명 +18%, 스킬 +30%',stats:{damage:120,speed:2.5,crit:.18,power:.3},tier:4,mats:['divine','god_boots'],extra:500},
  {id:'eternity',name:'영원의 수호자',desc:'HP +1000, 방어 +18, 흡혈 +12',stats:{maxHp:1000,armor:18,lifesteal:12,power:.15},tier:4,mats:['immortal','holy_grail'],extra:500},
];


/* ═══ SCREEN SHAKE & HIT IMPACT ═══ */
let screenShakeTimer = 0, screenShakeMagnitude = 0;
function shakeScreen(amount = 0.2, duration = 0.18) {
  screenShakeMagnitude = Math.max(screenShakeMagnitude, amount);
  screenShakeTimer = Math.max(screenShakeTimer, duration);
}

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
scene.fog=new THREE.FogExp2(0x070b12, 0.012);

const camera=new THREE.OrthographicCamera(-14,14,10,-10,.1,100);
camera.position.set(16,20,16);camera.lookAt(0,0,0);

scene.add(new THREE.HemisphereLight(0xffffff,0x334155,0.45));
const sun=new THREE.DirectionalLight(0xfffbeb,0.6);
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

/* ═══ 2.5D HIGH-DETAIL HD PIXEL ART SPRITE ENGINE ═══ */
const pixelTextureCache = {};
const pixelDataUrlCache = {};

/* ═══ 16-BIT ANIMATED SPRITE SHEET ENGINE (Witchbrook & Little Witch) ═══ */
const HERO_SHEETS = {
  mage: './witch_ellie.png',
  warrior: './knight_leo.png',
  ranger: './archer_robin.png',
  assassin: './witch_nina.png',
  paladin: './witch_lulu.png'
};

/* 👾 2D CUTE PIXEL ART MONSTERS & BOSS SPRITE ENGINE 👾 */
const MONSTER_ASSETS = {
  grunt: './monster_slime.png',
  runner: './monster_mushroom.png',
  tank: './monster_rock.png',
  caster: './monster_witch.png',
  brute: './monster_golem.png'
};
const BOSS_SHEET = './boss_demon.png';

const texLoader = new THREE.TextureLoader();

function createHeroTexture(type) {
  const url = HERO_SHEETS[type];
  if (!url) return null;
  const tex = texLoader.load(url);
  tex.generateMipmaps = false;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.25, 1 / 3); // 4 columns, 3 rows perfectly uniform (320x320 cells)
  tex.offset.set(0, 2 / 3); // Row 0 (Idle: top row in UV space)
  return tex;
}

function createMonsterTexture(kind) {
  const url = MONSTER_ASSETS[kind] || MONSTER_ASSETS.grunt;
  const tex = texLoader.load(url);
  tex.generateMipmaps = false;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  return tex;
}

function createBossTexture() {
  const tex = texLoader.load(BOSS_SHEET);
  tex.generateMipmaps = false;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.25, 1 / 3); // 4 columns, 3 rows (Idle, Walk, Attack)
  tex.offset.set(0, 2 / 3); // Row 0 (Idle: top row)
  return tex;
}

function createChromaKeySpriteMaterial(texture) {
  return new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05
  });
}

function createDropShadow(rx = 0.65, rz = 0.35) {
  const geom = new THREE.CircleGeometry(rx, 24);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x030712,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  const shadow = new THREE.Mesh(geom, mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.0, rz / rx, 1.0);
  shadow.position.y = 0.025;
  return shadow;
}

function createPixelSpriteMaterial(type) {
  const tex = createMonsterTexture(type);
  return new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.05 });
}

/* 🌿 2.5D Enchanted Forest Clearing Ground Texture (Witchbrook & Little Witch style) 🌿 */
function createPixelForestGroundTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 512; cvs.height = 512;
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 1. Lush Green Forest Grass Base (풍성한 잔디 바탕)
  ctx.fillStyle = '#1c422b'; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#225235';
  for(let x = 0; x < 512; x += 16) {
    for(let y = 0; y < 512; y += 16) {
      if ((x + y) % 32 === 0) ctx.fillRect(x, y, 16, 16);
    }
  }

  // 2. Cobblestone & Dirt Paths (중앙과 4방향 관문으로 이어지는 자갈 흙길)
  ctx.fillStyle = '#4a3728';
  // Vertical and horizontal crossroads
  ctx.fillRect(224, 0, 64, 512);
  ctx.fillRect(0, 224, 512, 64);
  // Central clearing circle
  ctx.beginPath(); ctx.arc(256, 256, 110, 0, Math.PI * 2); ctx.fill();

  // Cobblestone stones inside the path
  ctx.fillStyle = '#6b533e';
  for(let x = 16; x < 496; x += 12) {
    for(let y = 16; y < 496; y += 12) {
      if ((Math.abs(x - 256) < 32 || Math.abs(y - 256) < 32 || Math.hypot(x - 256, y - 256) < 100) && Math.random() < 0.4) {
        ctx.fillRect(x, y, 8, 6);
      }
    }
  }

  // Central Stone Podium Ring (타워 아래 룬 원환)
  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(256, 256, 68, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(256, 256, 62, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(256, 256, 56, 0, Math.PI * 2); ctx.stroke();

  // 3. Glowing Forest Mushrooms & Little Wildflowers (마법 숲 버섯 & 들꽃)
  const flowers = ['#fde047', '#f472b6', '#38bdf8', '#c084fc', '#ffffff', '#fb923c'];
  for(let i = 0; i < 600; i++) {
    const rx = Math.floor(Math.random() * 512);
    const ry = Math.floor(Math.random() * 512);
    if (Math.hypot(rx - 256, ry - 256) > 75) {
      ctx.fillStyle = flowers[Math.floor(Math.random() * flowers.length)];
      ctx.fillRect(rx, ry, 3, 3);
    }
  }

  // 4. Wooden Fences near boundaries (외곽 목조 펜스 장식)
  ctx.fillStyle = '#78350f';
  for (let i = 40; i < 480; i += 32) {
    if (Math.abs(i - 256) > 40) {
      ctx.fillRect(i, 36, 6, 14);
      ctx.fillRect(i, 464, 6, 14);
      ctx.fillRect(36, i, 14, 6);
      ctx.fillRect(464, i, 14, 6);
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

/* 🌿 2.5D Enchanted Forest Clearing Ground Map (2D 픽셀아트 배경) 🌿 */
const forestMapTex = texLoader.load('./forest_map.png');
forestMapTex.magFilter = THREE.LinearFilter;
forestMapTex.minFilter = THREE.LinearMipmapLinearFilter;
const groundMat = new THREE.MeshBasicMaterial({ map: forestMapTex });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ═══ 100% 2.5D PIXEL ART SACRED WORLD TREE (중앙 신성한 세계수) ═══ */
const towerGroup = new THREE.Group();

const worldTreeTex = texLoader.load('./world_tree.png');
worldTreeTex.generateMipmaps = false;
worldTreeTex.magFilter = THREE.NearestFilter;
worldTreeTex.minFilter = THREE.NearestFilter;

const worldTreeMat = new THREE.SpriteMaterial({
  map: worldTreeTex,
  transparent: true,
  alphaTest: 0.05
});

const towerSprite = new THREE.Sprite(worldTreeMat);
const tScale = 7.0; // 웅장한 신화 속 세계수 크기
towerSprite.scale.set(tScale, tScale, 1.0);
towerSprite.position.y = tScale * 0.44; // 뿌리가 지면에 자연스럽게 안착
towerGroup.add(towerSprite);

// Under-tree Drop Shadow
const treeShadow = createDropShadow(2.6, 1.3);
treeShadow.position.y = 0.03;
towerGroup.add(treeShadow);

// Mystical Emerald & Cyan Core Glow (은은한 숲의 요정 빛)
const crystalLight = new THREE.PointLight(0x34d399, 1.0, 14);
crystalLight.position.set(0, 3.8, 0);
towerGroup.add(crystalLight);

// Warm Cottage Window Glow in World Tree (은은한 오두막 등불)
const windowLight = new THREE.PointLight(0xfde047, 0.6, 8);
windowLight.position.set(0, 5.0, 0.4);
towerGroup.add(windowLight);

scene.add(towerGroup);



/* ✨ Floating Magical Fireflies (숲속 반딧불이 파티클) ✨ */
const firefliesCount = 36;
const fireflyGeom = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(firefliesCount * 3);
const fireflySpeeds = [];

for (let i = 0; i < firefliesCount; i++) {
  fireflyPos[i * 3 + 0] = (Math.random() - 0.5) * 28;
  fireflyPos[i * 3 + 1] = 0.4 + Math.random() * 2.8;
  fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
  fireflySpeeds.push({
    vx: (Math.random() - 0.5) * 0.4,
    vy: Math.random() * 0.5 + 0.2,
    baseY: fireflyPos[i * 3 + 1],
    phase: Math.random() * Math.PI * 2
  });
}
fireflyGeom.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
const fireflyMat = new THREE.PointsMaterial({
  color: 0xfef08a,
  size: 0.2,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending
});
const fireflyPoints = new THREE.Points(fireflyGeom, fireflyMat);
scene.add(fireflyPoints);

/* Gate Portals (신비로운 소환 결계) */
for(const g of GATES) {
  const gateRune = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 })
  );
  gateRune.rotation.x = -Math.PI / 2;
  gateRune.position.set(g.x, 0.04, g.z);
  scene.add(gateRune);

  const gateLight = new THREE.PointLight(0x38bdf8, 0.4, 5);
  gateLight.position.set(g.x, 0.8, g.z);
  scene.add(gateLight);
}

const twrRing=new THREE.Mesh(new THREE.RingGeometry(TWR_RNG-.12,TWR_RNG,64),new THREE.MeshBasicMaterial({color:0x06b6d4,transparent:true,opacity:.18,side:THREE.DoubleSide}));
twrRing.rotation.x=-Math.PI/2;twrRing.position.y=.03;scene.add(twrRing);

/* ═══ GAME STATE ═══ */
let state='menu';
let hero={};
let tower={hp:4500,maxHp:4500,shield:0,atkTimer:0};
let wave=1,gold=350,spawned=0,spawnClock=.5;
let enemies=[],projectiles=[],effects=[],zones=[];
let inventory=[];
let selectedInvIndex=-1;
let deadTimer=0,curSides=[0];
const keys=new Set();
let shopTab='buy';
let recipeTier='all';

function initHero(type){
  const d=HEROES[type];
  hero={type,pos:new THREE.Vector3(0,0,7),
    hp:d.hp,maxHp:d.hp,speed:d.spd,damage:d.dmg,range:d.rng,rate:d.rate,
    atkTimer:0,crit:.08,power:1,lifesteal:0,evasion:0,armor:0,rateBonus:0,cdReduction:0,
    level:1,xp:0,nextXP:100,skillPoints:1,
    skillLevels:{Q:1,W:0,E:0,R:0},skillCDs:{Q:0,W:0,E:0,R:0},
    buffs:[],dead:false,facing:new THREE.Vector3(0,0,-1),lastDirX:1,
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

/* ═══ 2.5D PIXEL ART HERO BUILDER ═══ */
function makeHero(){
  if(hero.obj)scene.remove(hero.obj);
  const g=new THREE.Group(),d=HEROES[hero.type];

  // 1. 2.5D Underfeet Drop Shadow
  const shadow = createDropShadow(0.68, 0.35);
  g.add(shadow);

  // 2. Hero Selection Ring (Underfeet aura)
  const auraGroup=new THREE.Group();
  const auraInner=new THREE.Mesh(
    new THREE.RingGeometry(0.3,0.76,32),
    new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.65,side:THREE.DoubleSide})
  );
  auraInner.rotation.x=-Math.PI/2;auraInner.position.y=0.035;
  auraGroup.add(auraInner);g.add(auraGroup);

  // 3. 2.5D Animated Sprite Sheet with Shader Chroma-Key
  const tex = createHeroTexture(hero.type);
  const spriteMat = createChromaKeySpriteMaterial(tex);
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.4, 2.4, 1.0);
  sprite.position.y = 1.1;
  g.add(sprite);

  g.position.copy(hero.pos);
  scene.add(g);
  hero.obj=g;
  hero.anim={
    auraGroup, sprite, tex, baseH: 2.4, baseW: 2.4,
    state: 'idle', frame: 0, frameTimer: 0,
    walkTime: 0, attackTimer: 0, hitTimer: 0
  };
}

/* ═══ 2.5D PIXEL ART MONSTER BUILDER (Cute Mobs & Boss Sprite Sheet) ═══ */
function makeEnemy(e){
  const g=new THREE.Group();
  const isBoss = (e.kind === 'boss');
  
  let baseH = 2.0;
  if (isBoss) baseH = 4.8;
  else if (e.kind === 'brute') baseH = 3.3;
  else if (e.kind === 'tank') baseH = 2.5;
  else if (e.kind === 'caster') baseH = 2.1;
  else if (e.kind === 'runner') baseH = 2.0;
  else if (e.kind === 'grunt') baseH = 1.9;
  const baseW = baseH;

  // 1. 2.5D Underfeet Drop Shadow
  const shadow = createDropShadow(baseW * 0.28, baseW * 0.14);
  g.add(shadow);

  // 2. 2.5D Pixel Art Sprite (Single image for mobs, 4x3 sprite sheet for Boss)
  let tex;
  if (isBoss) {
    tex = createBossTexture();
  } else {
    tex = createMonsterTexture(e.kind);
  }

  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(baseW, baseH, 1.0);
  sprite.position.y = baseH * 0.5;
  g.add(sprite);

  // 3. Boss Demonic Aura
  if (isBoss) {
    const bossAura = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.8, 32),
      new THREE.MeshBasicMaterial({color: 0xd97706, transparent: true, opacity: 0.75, side: THREE.DoubleSide})
    );
    bossAura.rotation.x = -Math.PI/2; bossAura.position.y = 0.04;
    g.add(bossAura);
  }

  g.position.copy(e.pos);scene.add(g);e.obj=g;
  e.anim={
    sprite, tex, baseH, baseW, isBoss,
    state: 'walk', frame: 0, frameTimer: 0,
    walkTime: Math.random()*10,
    lungeTimer: 0, hitTimer: 0, attackTimer: 0,
    lastDirX: 1
  };
}

/* ═══ WAVE / SPAWN ═══ */
function enemyCount(){return 8+wave*2+(wave>15?wave-15:0)+(wave>20?wave-18:0)}
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
    if(wave>20&&r<.15)kind='brute';else if(wave>10&&r<.22)kind='tank';
    else if(r<.30)kind='runner';else if(r<.42)kind='caster';else if(wave>15&&r<.52)kind='brute'}
  const d=ETYPES[kind];
  let wM=1+wave*.22,dM=1+wave*.12;
  if(wave>15){wM+=wave*.03;dM+=wave*.015}
  const isElite=wave>=25&&kind!=='boss'&&Math.random()<.3;
  if(isElite){wM*=1.8;dM*=1.5}
  const side=curSides[spawned%curSides.length],g=GATES[side];
  const e={kind,pos:new THREE.Vector3(g.x+(Math.random()-.5)*2,0,g.z+(Math.random()-.5)*2),
    hp:d.hp*wM,maxHp:d.hp*wM,speed:d.spd*(1+wave*.008),dmg:d.dmg*dM,
    gold:Math.round(d.gold*(1+wave*.04)*(isElite?1.5:1)),xp:Math.round(d.xp*(1+wave*.03)*(isElite?1.3:1)),
    h:d.h,color:isElite?0xff6600:d.color,dead:false,stunTimer:0,slowTimer:0,slowAmt:0,
    poisonTimer:0,poisonDmg:0,tauntTimer:0,obj:null,anim:null,hpBarEl:null,
    isElite:isElite,bob:Math.random()*Math.PI*2};
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
  SoundManager.play('hit_monster');
  showDamageText(e.pos, Math.round(dmg), isCrit ? '#fde047' : '#ffffff', isCrit);
  if(e.anim){
    e.anim.hitTimer = 0.12;
    if(e.anim.sprite && e.anim.sprite.material){
      e.anim.sprite.material.color.setHex(isCrit ? 0xfef08a : 0xff7777);
    }
  }
  if(e.hp<=0)killE(e);
}
function killE(e){
  if(e.dead)return;
  e.dead=true;gold+=e.gold;gainXP(e.xp);
  SoundManager.play('monster_die');
  SoundManager.play('gold');
  if(e.hpBarEl){e.hpBarEl.remove();e.hpBarEl=null}
  burst(e.pos,e.kind==='boss'?0xf59e0b:0xe4e4e7,e.kind==='boss'?30:12);
}
function gainXP(v){
  hero.xp+=v;
  while(hero.xp>=hero.nextXP){hero.xp-=hero.nextXP;hero.level++;hero.nextXP=Math.floor(hero.nextXP*1.35);
    hero.skillPoints++;hero.maxHp+=20;hero.hp=Math.min(hero.hp+20,hero.maxHp);hero.damage+=2;
    SoundManager.play('level_up');
    notify('레벨 '+hero.level+'! 스킬포인트 +1');
    if(hero.skillPoints===1)setTimeout(()=>{if(state==='play'&&hero.skillPoints>0){show('skillPing')}},300);
  }
}



/* ═══════════════════════════════════════════════════════════════
   PROCEDURAL COMMERCIAL-GRADE GAME VFX TEXTURES & ADDITIVE SHADERS
   ═══════════════════════════════════════════════════════════════ */
const VFX = {
  textures: {},
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Soft Core Glow (64x64) - For magic orbs, flame particles, halos
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      g.addColorStop(0.25, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      this.textures.glow = new THREE.CanvasTexture(cv);
    }

    // 2. Cross Star Spark (64x64) - Sharp impact hit flash
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 64, 64);
      // Horizontal beam
      let gh = ctx.createLinearGradient(0, 32, 64, 32);
      gh.addColorStop(0, 'rgba(255,255,255,0)');
      gh.addColorStop(0.5, 'rgba(255,255,255,1)');
      gh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gh; ctx.fillRect(0, 30, 64, 4);
      // Vertical beam
      let gv = ctx.createLinearGradient(32, 0, 32, 64);
      gv.addColorStop(0, 'rgba(255,255,255,0)');
      gv.addColorStop(0.5, 'rgba(255,255,255,1)');
      gv.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gv; ctx.fillRect(30, 0, 4, 64);
      // Center round glow
      let gc = ctx.createRadialGradient(32, 32, 0, 32, 32, 14);
      gc.addColorStop(0, 'rgba(255,255,255,1)');
      gc.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(32, 32, 14, 0, Math.PI * 2); ctx.fill();
      this.textures.spark = new THREE.CanvasTexture(cv);
    }

    // 3. Crescent Blade Slash Arc (128x128) - Sharp dynamic sword trail
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);
      // Draw smooth curving crescent trail
      ctx.beginPath();
      ctx.arc(64, 64, 52, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.arc(64, 64, 38, Math.PI * 2.1, Math.PI * 0.9, true);
      ctx.closePath();
      const g = ctx.createLinearGradient(16, 64, 118, 64);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
      g.addColorStop(0.85, 'rgba(255,255,255,1.0)');
      g.addColorStop(1, 'rgba(255,255,255,0.3)');
      ctx.fillStyle = g; ctx.fill();
      this.textures.slash = new THREE.CanvasTexture(cv);
    }

    // 4. Magic Rune Circle (128x128) - Runic spell circle
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      // Outer dual rings
      ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(64, 64, 28, 0, Math.PI * 2); ctx.stroke();
      // Octagram star lines
      for (let i = 0; i < 8; i++) {
        const a1 = (i * Math.PI) / 4;
        const a2 = ((i + 3) * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a1) * 50, 64 + Math.sin(a1) * 50);
        ctx.lineTo(64 + Math.cos(a2) * 50, 64 + Math.sin(a2) * 50);
        ctx.stroke();
      }
      // Center rune dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(64, 64, 6, 0, Math.PI * 2); ctx.fill();
      this.textures.rune = new THREE.CanvasTexture(cv);
    }

    // 5. Energy Shockwave Donut Ring (128x128)
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);
      const g = ctx.createRadialGradient(64, 64, 34, 64, 64, 58);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.9, 'rgba(255,255,255,1.0)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill();
      this.textures.shockwave = new THREE.CanvasTexture(cv);
    }
  }
};

/* ═══ VFX HELPER BUILDERS ═══ */
function addVfxMesh(geom, mat, updateFn, life = 0.4) {
  VFX.init();
  const m = new THREE.Mesh(geom, mat);
  scene.add(m);
  effects.push({ obj: m, life, max: life, update: updateFn });
  return m;
}

// Glowing neon particle burst (Additive Blending)
function sparkBurst(pos, color = 0xffffff, count = 10, speed = 5, size = 0.35) {
  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.glow, color: color,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const planeGeom = new THREE.PlaneGeometry(size, size);

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(planeGeom, mat.clone());
    mesh.position.set(pos.x + (Math.random() - 0.5) * 0.3, pos.y + 0.5 + (Math.random() - 0.5) * 0.3, pos.z + (Math.random() - 0.5) * 0.3);
    mesh.rotation.x = -Math.PI / 3; // Face isometric camera
    scene.add(mesh);

    const ang = Math.random() * Math.PI * 2;
    const up = 1.0 + Math.random() * speed * 0.8;
    const horiz = 0.8 + Math.random() * speed;
    const vel = new THREE.Vector3(Math.cos(ang) * horiz, up, Math.sin(ang) * horiz);

    effects.push({
      obj: mesh, life: 0.38, max: 0.38,
      update(dt, f) {
        vel.y -= 10 * dt;
        mesh.position.addScaledVector(vel, dt);
        const p = f.life / f.max;
        mesh.scale.setScalar(p * 1.4);
        mesh.material.opacity = Math.min(1.0, p * 1.5);
      }
    });
  }
}

// Sharp cross star impact hit
function hitImpactStar(pos, color = 0xffffff, scale = 1.2) {
  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.spark, color: color,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
  mesh.position.set(pos.x, pos.y + 0.6, pos.z);
  mesh.rotation.x = -Math.PI / 3;
  mesh.rotation.z = Math.random() * Math.PI;
  scene.add(mesh);
  effects.push({
    obj: mesh, life: 0.18, max: 0.18,
    update(dt, f) {
      const p = f.life / f.max;
      mesh.scale.setScalar(1 + (1 - p) * 1.2);
      mesh.rotation.z += dt * 8;
      mat.opacity = p;
    }
  });
}

// Brilliant Crescent Blade Slash Arc
function slashArcFx(pos, color, scale = 3.2, facingAngle = 0) {
  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.slash, color: color,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale * 1.8, scale * 1.8), mat);
  // Tilt toward isometric camera for massive volumetric presence
  mesh.rotation.x = -Math.PI / 3.2;
  mesh.rotation.z = facingAngle + Math.PI * 0.2;
  mesh.position.set(pos.x, 0.9, pos.z);
  scene.add(mesh);

  effects.push({
    obj: mesh, life: 0.38, max: 0.38,
    update(dt, f) {
      const p = f.life / f.max;
      mesh.rotation.z += dt * 16;
      mesh.scale.setScalar(0.8 + (1 - p * p) * 1.4);
      mat.opacity = Math.min(1.0, p * 1.3);
    }
  });
}

// Glowing Runic Magic Circle on Ground
function spawnRuneCircle(pos, color = 0x38bdf8, radius = 5.0, duration = 1.2) {
  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.rune, color: color,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.2, radius * 2.2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pos.x, 0.06, pos.z);
  scene.add(mesh);

  effects.push({
    obj: mesh, life: duration, max: duration,
    update(dt, f) {
      const p = f.life / f.max;
      mesh.rotation.z += dt * 2.2;
      mesh.scale.setScalar(0.6 + (1 - p * p) * 0.6);
      mat.opacity = Math.min(1.0, p * 1.6);
    }
  });
}

// Additive Energy Shockwave Ring
function ring(pos, r, color = 0xffffff) {
  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.shockwave, color: color,
    transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pos.x, 0.06, pos.z);
  scene.add(mesh);

  effects.push({
    obj: mesh, life: 0.45, max: 0.45,
    update(dt, f) {
      const p = f.life / f.max;
      mesh.scale.setScalar(1 + (1 - p) * 1.5);
      mat.opacity = p * 0.95;
    }
  });
}

function groundCrackFx(pos, radius, color = 0xf59e0b, duration = 0.6) {
  spawnRuneCircle(pos, color, radius, duration);
  ring(pos, radius * 0.8, color);
}

// Pillar of Holy Light with Glowing Additive Beams
function holyPillarFx(pos, radius = 3.5, duration = 0.6) {
  VFX.init();
  const geom = new THREE.CylinderGeometry(radius, radius * 1.1, 18, 24, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfef08a, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const pillar = new THREE.Mesh(geom, mat);
  pillar.position.set(pos.x, 9, pos.z);
  scene.add(pillar);

  spawnRuneCircle(pos, 0xfde047, radius * 1.3, duration);
  sparkBurst(pos, 0xfef08a, 24, 6.5, 0.38);
  hitImpactStar(pos, 0xffffff, 2.8);

  effects.push({
    obj: pillar, life: duration, max: duration,
    update(dt, f) {
      const p = f.life / f.max;
      pillar.rotation.y += dt * 4;
      mat.opacity = p * 0.75;
      pillar.scale.set(1 + (1 - p) * 0.2, 1, 1 + (1 - p) * 0.2);
    }
  });
}

// Blazing Giant Aether Meteor with Fire Trail & Supernova Crater
function meteorStrikeFx(targetPos, dmg, splash, color = 0xff4400) {
  VFX.init();
  const startPos = new THREE.Vector3(
    targetPos.x + (Math.random() - 0.5) * 6 - 8,
    22,
    targetPos.z + (Math.random() - 0.5) * 6 - 8
  );
  
  const coreMat = new THREE.MeshBasicMaterial({
    map: VFX.textures.glow, color: 0xffe066,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const meteorCore = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), coreMat);
  meteorCore.rotation.x = -Math.PI / 3;
  meteorCore.position.copy(startPos);
  scene.add(meteorCore);

  let flightTimer = 0.5;
  effects.push({
    obj: meteorCore, life: 999, max: 999,
    update(dt, f) {
      flightTimer -= dt;
      const t = Math.max(0, flightTimer / 0.5);
      meteorCore.position.lerpVectors(targetPos, startPos, t);
      // Glowing flame sparks trailing behind
      sparkBurst(meteorCore.position, 0xff5500, 3, 2, 0.28);
      sparkBurst(meteorCore.position, 0xffe066, 2, 1.5, 0.2);

      if (flightTimer <= 0) {
        f.life = 0; // Destroy falling meteor
        SoundManager.play('skill_meteor');
        shakeScreen(0.55, 0.4);

        // Blazing impact explosion
        hitImpactStar(targetPos, 0xffffff, 4.5);
        ring(targetPos, splash || 6.0, 0xff3300);
        ring(targetPos, (splash || 6.0) * 0.6, 0xffaa00);
        spawnRuneCircle(targetPos, 0xff4400, (splash || 6.0) * 0.9, 0.9);
        sparkBurst(targetPos, 0xff3300, 32, 9, 0.45);
        sparkBurst(targetPos, 0xffe066, 20, 7, 0.35);

        for (const e of enemies) {
          if (!e.dead && e.pos.distanceTo(targetPos) <= (splash || 6.0)) {
            hitE(e, dmg, true);
            e.stunTimer = Math.max(e.stunTimer, 1.5);
          }
        }
      }
    }
  });
}

// Arrow Rain of Light Volley
function arrowRainFx(centerPos, radius, count = 32, dmg = 50) {
  VFX.init();
  let spawnedArrows = 0;
  let interval = 0.035;
  let timer = 0;
  spawnRuneCircle(centerPos, 0x84cc16, radius, 1.6);
  ring(centerPos, radius, 0xa3e635);
  shakeScreen(0.2, 0.6);

  effects.push({
    obj: new THREE.Group(), life: 1.6, max: 1.6,
    update(dt, f) {
      timer -= dt;
      if (timer <= 0 && spawnedArrows < count) {
        timer = interval;
        spawnedArrows++;
        const rx = centerPos.x + (Math.random() - 0.5) * radius * 1.8;
        const rz = centerPos.z + (Math.random() - 0.5) * radius * 1.8;
        const landPos = new THREE.Vector3(rx, 0.1, rz);
        const skyPos = new THREE.Vector3(rx - 2, 14, rz - 2);

        const arrowMat = new THREE.MeshBasicMaterial({
          map: VFX.textures.glow, color: 0xa3e635,
          transparent: true, opacity: 1.0,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });
        const arrow = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.4), arrowMat);
        arrow.position.copy(skyPos);
        arrow.rotation.z = Math.PI / 4;
        scene.add(arrow);

        let aTimer = 0.14;
        effects.push({
          obj: arrow, life: 0.22, max: 0.22,
          update(adt, af) {
            aTimer -= adt;
            if (aTimer > 0) {
              arrow.position.lerpVectors(landPos, skyPos, aTimer / 0.14);
            } else {
              if (arrow.visible) {
                arrow.visible = false;
                hitImpactStar(landPos, 0xd9f99d, 1.2);
                sparkBurst(landPos, 0x84cc16, 5, 3.5, 0.22);
                for (const e of enemies) {
                  if (!e.dead && e.pos.distanceTo(landPos) < 1.7) {
                    hitE(e, dmg * 0.25, false);
                  }
                }
              }
            }
          }
        });
      }
    }
  });
}

// Assassin Crystal Blink & Multi-Angle Slash Storm
function crystalBlinkSlashFx(target, totalHits = 6, dmgPerHit = 60) {
  let hitsDone = 0;
  let nextHitTimer = 0.05;
  shakeScreen(0.28, 0.45);

  effects.push({
    obj: new THREE.Group(), life: 0.55, max: 0.55,
    update(dt, f) {
      if (!target || target.dead) return;
      nextHitTimer -= dt;
      if (nextHitTimer <= 0 && hitsDone < totalHits) {
        nextHitTimer = 0.065;
        hitsDone++;
        SoundManager.play('slash');
        shakeScreen(0.18, 0.12);
        hitE(target, dmgPerHit, true);

        const ang = (hitsDone * Math.PI * 2) / totalHits + (Math.random() - 0.5) * 0.4;
        slashArcFx(target.pos, 0xd946ef, 2.4, ang);
        hitImpactStar(target.pos, 0xffffff, 2.0);
        sparkBurst(target.pos, 0xe879f9, 10, 6.5, 0.3);
      }
    }
  });
}

function slashFx(pos, color) {
  slashArcFx(pos, color, 1.8, Math.random() * Math.PI * 2);
}

function burst(pos, color, n) {
  sparkBurst(pos, color, n, 5.0, 0.32);
}

/* ═══ HERO ATTACK WITH NEON WEAPON TRAILS & IMPACTS ═══ */
function heroAttack() {
  if (hero.dead || hero.atkTimer > 0) return;
  const target = nearest(hero.pos, hero.range); if (!target) return;
  const aRate = hero.rate * (1 - Math.min(0.5, hero.rateBonus)); hero.atkTimer = aRate;
  let dmg = hero.damage * hero.power, isCrit = Math.random() < hero.crit; if (isCrit) dmg *= 2;
  if (hero.stealthBonus > 0) {
    dmg *= hero.stealthBonus; hero.stealthBonus = 0;
    hero.buffs = hero.buffs.filter(b => b.type !== 'stealth'); if (hero.obj) hero.obj.visible = true;
  }

  if (hero.anim) {
    hero.anim.attackTimer = 0.28;
    if (hero.anim.attackAction) {
      hero.anim.attackAction.reset();
      hero.anim.attackAction.setLoop(THREE.LoopOnce, 1);
      hero.anim.attackAction.play();
    }
  }

  const isRng = HEROES[hero.type].rng > 4;
  if (isRng) {
    SoundManager.play(hero.type === 'mage' ? 'magic_orb' : 'shoot');
    const col = hero.type === 'mage' ? 0x38bdf8 : 0x22c55e;
    
    // Additive glowing orb projectile
    VFX.init();
    const mat = new THREE.MeshBasicMaterial({
      map: VFX.textures.glow, color: col,
      transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const obj = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), mat);
    obj.rotation.x = -Math.PI / 3;
    obj.position.copy(hero.pos); obj.position.y = 1.2; scene.add(obj);

    const p = { obj, target, dmg, isCrit, splash: 0, col };
    if (hero.poison > 0) { p.poisonDmg = hero.poisonDmg; p.poisonDur = hero.poison; }
    projectiles.push(p);
    sparkBurst(obj.position, col, 6, 2.5, 0.25);
  } else {
    SoundManager.play('slash');
    shakeScreen(isCrit ? 0.18 : 0.08, 0.12);
    hitE(target, dmg, isCrit); if (hero.lifesteal) hero.hp = Math.min(hero.maxHp, hero.hp + hero.lifesteal);
    if (hero.poison > 0) { target.poisonTimer = hero.poison; target.poisonDmg = hero.poisonDmg; }

    const hitAngle = Math.atan2(target.pos.x - hero.pos.x, target.pos.z - hero.pos.z);
    slashArcFx(target.pos, HEROES[hero.type].color, isCrit ? 2.4 : 1.8, hitAngle);
    hitImpactStar(target.pos, isCrit ? 0xfde047 : 0xffffff, isCrit ? 1.8 : 1.2);
    sparkBurst(target.pos, isCrit ? 0xfde047 : HEROES[hero.type].color, isCrit ? 14 : 7, isCrit ? 6 : 4, 0.28);
  }
  hero.facing.set(target.pos.x - hero.pos.x, 0, target.pos.z - hero.pos.z).normalize();
  if (!hero.isMoving) {
    const screenDx = (target.pos.x - hero.pos.x) - (target.pos.z - hero.pos.z);
    if (Math.abs(screenDx) > 0.05) hero.lastDirX = (screenDx < 0) ? -1 : 1;
  }
  if (hero.obj) hero.obj.rotation.y = Math.atan2(hero.facing.x, hero.facing.z);
}

function towerAttack() {
  if (tower.atkTimer > 0) return;
  const t = nearest(new THREE.Vector3(0, 0, 0), TWR_RNG); if (!t) return;
  tower.atkTimer = TWR_RATE;
  SoundManager.play('shoot');

  VFX.init();
  const mat = new THREE.MeshBasicMaterial({
    map: VFX.textures.glow, color: 0x34d399,
    transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const obj = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat);
  obj.rotation.x = -Math.PI / 3;
  obj.position.set(0, 3.8, 0); scene.add(obj);

  projectiles.push({ obj, target: t, dmg: TWR_DMG * (1 + wave * 0.02), splash: 0.6, tower: true, col: 0x34d399 });
  sparkBurst(obj.position, 0x34d399, 8, 3, 0.28);
}

/* ═══ SKILLS WITH COMMERCIAL GLOW & 3D VISUALS ═══ */
function useSkill(key) {
  if (hero.dead || state !== 'play') return;
  const slv = hero.skillLevels[key];
  if (slv <= 0) { notify('스킬을 먼저 배우세요!'); return; }
  if (hero.skillCDs[key] > 0) return;
  const sk = HEROES[hero.type].skills[key];
  if (sk.ulti && hero.level < 8) { notify('레벨 8 이상 필요'); return; }
  const lv = slv - 1;
  hero.skillCDs[key] = sk.cd[lv] * (1 - (hero.cdReduction || 0));

  if (hero.anim) {
    hero.anim.attackTimer = 0.45;
    if (sk.ulti) {
      if (hero.type === 'warrior') hero.anim.skillMotion = { type: 'jump_smash', timer: 0.65, max: 0.65 };
      else if (hero.type === 'mage') hero.anim.skillMotion = { type: 'float_cast', timer: 0.7, max: 0.7 };
      else if (hero.type === 'ranger') hero.anim.skillMotion = { type: 'shoot_sky', timer: 0.5, max: 0.5 };
      else if (hero.type === 'assassin') hero.anim.skillMotion = { type: 'omni_slash', timer: 0.6, max: 0.6 };
      else if (hero.type === 'paladin') hero.anim.skillMotion = { type: 'holy_prayer', timer: 0.6, max: 0.6 };
    } else {
      hero.anim.skillMotion = { type: 'pulse_cast', timer: 0.35, max: 0.35 };
    }
  }
  const t = sk.type;

  if (t === 'aoe' || t === 'multi') {
    SoundManager.play('skill_wind');
  } else if (t === 'aoe_stun' || t === 'proj_aoe' || t === 'execute') {
    SoundManager.play('skill_meteor');
  } else if (t === 'buff_def' || t === 'shield_self' || t === 'shield_tower') {
    SoundManager.play('skill_shield');
  } else if (t === 'taunt' || t === 'poison_buff' || t === 'zone') {
    SoundManager.play('skill_taunt');
  } else if (t === 'holy' || t === 'heal') {
    SoundManager.play('skill_heal');
  } else if (t === 'revive') {
    SoundManager.play('skill_revive');
  } else {
    SoundManager.play('magic_orb');
  }

  // 1. AOE
  if (t === 'aoe') {
    const r = sk.r || 5, dmg = hero.damage * sk.mul[lv] * hero.power;
    if (hero.type === 'warrior') {
      // 3겹 거대 초승달 검기 소용돌이
      for (let a = 0; a < 3; a++) {
        slashArcFx(hero.pos, 0x4ade80, r * 0.95, a * Math.PI * 0.66);
      }
      spawnRuneCircle(hero.pos, 0x22c55e, r, 0.5);
      ring(hero.pos, r * 1.1, 0x86efac);
      sparkBurst(hero.pos, 0x86efac, 22, 7.5, 0.35);
      shakeScreen(0.24, 0.2);
    } else if (hero.type === 'ranger') {
      const tgt = nearest(hero.pos, 10);
      const center = tgt ? tgt.pos.clone() : hero.pos.clone();
      arrowRainFx(center, r, 32, dmg);
      notify(sk.name + '!');
      return;
    } else if (hero.type === 'mage') {
      const tgt = nearest(hero.pos, 10);
      const center = tgt ? tgt.pos.clone() : hero.pos.clone();
      meteorStrikeFx(center, dmg, r, 0x38bdf8);
      notify(sk.name + '!');
      return;
    }
    for (const e of enemies) if (!e.dead && hero.pos.distanceTo(e.pos) < r) hitE(e, dmg, true);
    notify(sk.name + '!');
  }
  // 2. AOE STUN (용기의 일격)
  else if (t === 'aoe_stun') {
    const r = sk.r || 7, dmg = hero.damage * sk.mul[lv] * hero.power;
    shakeScreen(0.5, 0.4);
    spawnRuneCircle(hero.pos, 0xf59e0b, r, 0.8);
    ring(hero.pos, r * 1.1, 0xfde047);
    ring(hero.pos, r * 0.6, 0xf59e0b);
    hitImpactStar(hero.pos, 0xffffff, 3.5);
    sparkBurst(hero.pos, 0xfde047, 30, 8.5, 0.45);
    for (const e of enemies) if (!e.dead && hero.pos.distanceTo(e.pos) < r) { hitE(e, dmg, true); e.stunTimer = 2.5; }
    notify(sk.name + '!');
  }
  // 3. PROJ AOE (별빛 보주)
  else if (t === 'proj_aoe') {
    const tgt = nearest(hero.pos, 8); if (!tgt) { hero.skillCDs[key] = 0; return; }
    const dmg = hero.damage * sk.mul[lv] * hero.power;
    VFX.init();
    const mat = new THREE.MeshBasicMaterial({
      map: VFX.textures.glow, color: 0x38bdf8,
      transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const obj = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), mat);
    obj.rotation.x = -Math.PI / 3;
    obj.position.copy(hero.pos); obj.position.y = 1.2; scene.add(obj);

    sparkBurst(obj.position, 0x38bdf8, 12, 4, 0.3);
    projectiles.push({ obj, target: tgt, dmg, isCrit: true, splash: sk.r || 2.5, skillProj: true, col: 0x38bdf8 });
    notify(sk.name + '!');
  }
  // 4. BUFF DEF (수호 자세)
  else if (t === 'buff_def') {
    hero.buffs.push({ type: 'def', timer: sk.dur[lv], val: sk.val[lv] });
    spawnRuneCircle(hero.pos, 0xfacc15, 3.0, sk.dur[lv]);
    ring(hero.pos, 2.5, 0xfde047);
    sparkBurst(hero.pos, 0xfde047, 20, 5, 0.35);
    notify(sk.name + ' 활성화!');
  }
  // 5. TAUNT (도발의 함성)
  else if (t === 'taunt') {
    const r = sk.r[lv], dur = sk.dur[lv];
    for (const e of enemies) if (!e.dead && hero.pos.distanceTo(e.pos) < r) { e.tauntTimer = dur; }
    ring(hero.pos, r, 0xef4444);
    spawnRuneCircle(hero.pos, 0xdc2626, r * 0.9, 0.6);
    sparkBurst(hero.pos, 0xef4444, 24, 7, 0.35);
    shakeScreen(0.24, 0.22);
    notify(sk.name + '!');
  }
  // 6. ZONE (프로스트 룬)
  else if (t === 'zone') {
    const dmg = hero.damage * sk.mul[lv] * hero.power;
    const tgt = nearest(hero.pos, 8); const zp = tgt ? tgt.pos.clone() : hero.pos.clone(); zp.y = 0.05;
    const r = sk.r || 4, dur = sk.dur || 4;

    VFX.init();
    const runeMat = new THREE.MeshBasicMaterial({
      map: VFX.textures.rune, color: 0x38bdf8,
      transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const obj = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), runeMat);
    obj.rotation.x = -Math.PI / 2;
    obj.position.copy(zp); scene.add(obj);

    ring(zp, r, 0x7dd3fc);
    sparkBurst(zp, 0xa5f3fc, 20, 4.5, 0.3);
    zones.push({ obj, pos: zp, r, dmg: dmg / 5, timer: dur, tickTimer: 0, slow: 0.5 });
    notify(sk.name + '!');
  }
  // 7. SHIELD SELF (마나 쉴드)
  else if (t === 'shield_self') {
    hero.shield += sk.val[lv];
    ring(hero.pos, 2.5, 0x60a5fa);
    spawnRuneCircle(hero.pos, 0x3b82f6, 2.2, 1.2);
    sparkBurst(hero.pos, 0x60a5fa, 18, 4.5, 0.35);
    notify(sk.name + ' +' + sk.val[lv]);
  }
  // 8. MULTI (다중 사격)
  else if (t === 'multi') {
    const cnt = sk.cnt[lv], dmg = hero.damage * sk.mul[lv] * hero.power;
    let ts = []; for (const e of enemies) if (!e.dead) ts.push({ e, d: hero.pos.distanceTo(e.pos) });
    ts.sort((a, b) => a.d - b.d); ts = ts.slice(0, cnt);
    shakeScreen(0.14, 0.16);

    VFX.init();
    const arrowMat = new THREE.MeshBasicMaterial({
      map: VFX.textures.glow, color: 0xa3e635,
      transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    for (const tt of ts) {
      const obj = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), arrowMat.clone());
      obj.rotation.x = -Math.PI / 3;
      obj.position.copy(hero.pos); obj.position.y = 1.2; scene.add(obj);
      projectiles.push({ obj, target: tt.e, dmg, isCrit: false, col: 0xa3e635 });
    }
    sparkBurst(hero.pos, 0xa3e635, 12, 4.5, 0.28);
    notify(sk.name + '!');
  }
  // 9. POISON BUFF (숲의 독화살)
  else if (t === 'poison_buff') {
    hero.poison = sk.dur[lv]; hero.poisonDmg = sk.dot[lv];
    ring(hero.pos, 2.4, 0x22c55e);
    sparkBurst(hero.pos, 0x4ade80, 18, 4, 0.32);
    notify(sk.name + ' 활성화!');
  }
  // 10. BUFF EVA (질풍 회피)
  else if (t === 'buff_eva') {
    hero.buffs.push({ type: 'evasion', timer: sk.dur[lv], val: sk.val[lv] });
    ring(hero.pos, 2.8, 0x84cc16);
    sparkBurst(hero.pos, 0xfacc15, 16, 5, 0.3);
    notify(sk.name + ' 활성화!');
  }
  // 11. PROJ SINGLE (단검 투척)
  else if (t === 'proj_single') {
    const tgt = nearest(hero.pos, 8); if (!tgt) { hero.skillCDs[key] = 0; return; }
    const dmg = hero.damage * sk.mul[lv] * hero.power;

    VFX.init();
    const dMat = new THREE.MeshBasicMaterial({
      map: VFX.textures.spark, color: 0xc084fc,
      transparent: true, opacity: 1.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const obj = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), dMat);
    obj.rotation.x = -Math.PI / 3;
    obj.position.copy(hero.pos); obj.position.y = 1.2; scene.add(obj);

    sparkBurst(obj.position, 0xc084fc, 8, 3.5, 0.28);
    projectiles.push({ obj, target: tgt, dmg, isCrit: true, col: 0xc084fc });
    notify(sk.name + '!');
  }
  // 12. STEALTH (그림자 은신)
  else if (t === 'stealth') {
    hero.stealthBonus = sk.mul[lv]; hero.buffs.push({ type: 'stealth', timer: sk.dur[lv] });
    if (hero.obj) hero.obj.visible = false;
    ring(hero.pos, 3.0, 0x9333ea);
    sparkBurst(hero.pos, 0x9333ea, 24, 5.5, 0.38);
    sparkBurst(hero.pos, 0x3b0764, 16, 4, 0.3);
    notify(sk.name + ' 활성화!');
  }
  // 13. PASSIVE
  else if (t === 'passive') {
    hero.skillCDs[key] = 0;
  }
  // 14. EXECUTE (크리스탈 난무)
  else if (t === 'execute') {
    const tgt = nearest(hero.pos, sk.rng || 4.5); if (!tgt) { hero.skillCDs[key] = 0; return; }
    crystalBlinkSlashFx(tgt, 6, (hero.damage * sk.mul[lv] * hero.power) / 6);
    notify(sk.name + '!');
  }
  // 15. HOLY (성스러운 찬송)
  else if (t === 'holy') {
    const r = sk.r || 3.5, dmg = hero.damage * sk.mul[lv] * hero.power, heal = dmg * sk.heal[lv];
    holyPillarFx(hero.pos, r, 0.6);
    for (const e of enemies) if (!e.dead && hero.pos.distanceTo(e.pos) < r) hitE(e, dmg, true);
    hero.hp = Math.min(hero.maxHp, hero.hp + heal);
    showDamageText(hero.pos, '+' + Math.round(heal), '#4ade80');
    notify(sk.name + '!');
  }
  // 16. HEAL (치유의 마법)
  else if (t === 'heal') {
    const heal = hero.damage * sk.heal[lv]; hero.hp = Math.min(hero.maxHp, hero.hp + heal);
    showDamageText(hero.pos, '+' + Math.round(heal), '#4ade80');
    holyPillarFx(hero.pos, 2.4, 0.55);
    sparkBurst(hero.pos, 0x4ade80, 22, 5, 0.35);
    notify('HP +' + Math.round(heal));
  }
  // 17. SHIELD TOWER (수호탑 보호막)
  else if (t === 'shield_tower') {
    tower.shield += sk.val[lv];
    holyPillarFx(new THREE.Vector3(0, 0, 0), 4.2, 0.7);
    sparkBurst(new THREE.Vector3(0, 3.5, 0), 0x38bdf8, 30, 6.5, 0.4);
    ring(new THREE.Vector3(0, 0, 0), 4.5, 0x60a5fa);
    notify('수호탑 보호막 +' + sk.val[lv]);
  }
  // 18. REVIVE (부활의 서약)
  else if (t === 'revive') {
    hero.hasRevive = true; hero.skillCDs[key] = 0;
    holyPillarFx(hero.pos, 3.2, 0.8);
    sparkBurst(hero.pos, 0xfde047, 32, 7.5, 0.45);
    notify('부활 준비 완료!');
  }
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

  // Screen-space horizontal movement determination for isometric quarter-view camera (16,20,16):
  // Screen right is (+x, -z) -> screenDx = x - z.
  const screenDx = x - z;
  if (keys.has('a') || keys.has('arrowleft')) {
    hero.lastDirX = -1;
  } else if (keys.has('d') || keys.has('arrowright')) {
    hero.lastDirX = 1;
  } else if (Math.abs(screenDx) > 0.05) {
    hero.lastDirX = (screenDx < 0) ? -1 : 1;
  }

  const v = new THREE.Vector3(x, 0, z).multiplyScalar(hero.speed * dt);
  hero.pos.add(v);hero.pos.x=THREE.MathUtils.clamp(hero.pos.x,-MAP_H+1,MAP_H-1);
  hero.pos.z=THREE.MathUtils.clamp(hero.pos.z,-MAP_H+1,MAP_H-1);
  hero.facing.set(v.x,0,v.z).normalize();
  if(hero.obj){hero.obj.position.copy(hero.pos);}
}

/* ═══ 2.5D SQUISH & STRETCH ANIMATIONS & HEALTH BARS ═══ */
function updateAnimations(dt){
  // 1. Hero 16-Bit Pixel Animated Sprite Machine (Witchbrook & Little Witch)
  if(hero.anim && hero.obj && !hero.dead){
    const a = hero.anim;
    if(a.auraGroup) a.auraGroup.rotation.y += dt * 1.2;

    if(a.hitTimer > 0){
      a.hitTimer -= dt;
      if(a.hitTimer <= 0 && a.sprite && a.sprite.material){
        a.sprite.material.color.setHex(0xffffff);
      }
    }

    // Determine current animation state & FPS
    let targetState = 'idle';
    let frameRate = 3.5; // FPS for idle breathing

    // Skill special motions (jump smash, float cast, omni slash, etc)
    if (a.skillMotion && a.skillMotion.timer > 0) {
      targetState = 'attack';
      frameRate = 14;
      a.skillMotion.timer -= dt;
      const prog = 1 - (a.skillMotion.timer / a.skillMotion.max);
      const type = a.skillMotion.type;
      
      if (type === 'jump_smash') {
        // High jump up then ground slam
        const jumpY = Math.sin(prog * Math.PI) * 2.2;
        hero.obj.position.copy(hero.pos);
        hero.obj.position.y += jumpY;
      } else if (type === 'float_cast') {
        // Gentle float up
        hero.obj.position.copy(hero.pos);
        hero.obj.position.y += Math.sin(prog * Math.PI) * 0.8;
      } else if (type === 'shoot_sky') {
        // Recoil back and tilt up
        const back = hero.facing.clone().multiplyScalar(-0.25 * Math.sin(prog * Math.PI));
        hero.obj.position.copy(hero.pos).add(back);
        hero.obj.position.y += Math.sin(prog * Math.PI) * 0.3;
      } else if (type === 'omni_slash') {
        // Rapid jitter blink
        hero.obj.position.copy(hero.pos);
        hero.obj.position.x += (Math.random() - 0.5) * 0.8;
        hero.obj.position.z += (Math.random() - 0.5) * 0.8;
      } else {
        hero.obj.position.copy(hero.pos);
        hero.obj.position.y += Math.sin(prog * Math.PI) * 0.4;
      }
      if (a.skillMotion.timer <= 0) a.skillMotion = null;
    } else if (a.attackTimer > 0) {
      targetState = 'attack';
      frameRate = 12;
      a.attackTimer -= dt;
      const progress = 1 - (a.attackTimer / 0.28);
      const curve = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
      
      // Hero-specific attack motions
      if (hero.type === 'warrior') {
        // Forward power lunge
        const forward = hero.facing.clone().multiplyScalar(curve * 0.45);
        hero.obj.position.copy(hero.pos).add(forward);
      } else if (hero.type === 'ranger') {
        // Recoil kickback
        const recoil = hero.facing.clone().multiplyScalar(-curve * 0.22);
        hero.obj.position.copy(hero.pos).add(recoil);
      } else if (hero.type === 'mage') {
        // Floating pulse
        hero.obj.position.copy(hero.pos);
        hero.obj.position.y += curve * 0.35;
      } else if (hero.type === 'assassin') {
        // Lightning dash
        const dash = hero.facing.clone().multiplyScalar(curve * 0.55);
        hero.obj.position.copy(hero.pos).add(dash);
      } else {
        // Paladin bounce
        hero.obj.position.copy(hero.pos);
        hero.obj.position.y += curve * 0.3;
      }
    } else if (hero.isMoving) {
      targetState = 'walk';
      frameRate = 9; // 9 FPS for walking & running
      hero.obj.position.copy(hero.pos);
    } else {
      targetState = 'idle';
      frameRate = 3.5;
      hero.obj.position.copy(hero.pos);
    }

    // State change resets frame index
    if (a.state !== targetState) {
      a.state = targetState;
      a.frame = 0;
      a.frameTimer = 0;
    }

    // Advance animation frame timer
    a.frameTimer += dt;
    if (a.frameTimer >= 1 / frameRate) {
      a.frameTimer = 0;
      a.frame = (a.frame + 1) % 4;
    }

    // UV Offset Frame Swapping & Directional Flip (GPU Hardware Accelerated)
    if (a.tex) {
      const col = a.frame; // 0, 1, 2, 3
      // Row 0 = Idle (Top: 2/3), Row 1 = Walk (Mid: 1/3), Row 2 = Attack (Bot: 0.0)
      let rowY = 2 / 3;
      if (a.state === 'walk') rowY = 1 / 3;
      else if (a.state === 'attack') rowY = 0.0;

      const isLeft = (hero.lastDirX < 0);
      if (isLeft) {
        a.tex.repeat.set(-0.25, 1 / 3);
        a.tex.offset.set((col + 1) * 0.25, rowY);
      } else {
        a.tex.repeat.set(0.25, 1 / 3);
        a.tex.offset.set(col * 0.25, rowY);
      }
    }

    // Directional Flip & Subtle Step Bounce
    const bounce = (a.state === 'walk') ? Math.abs(Math.sin(a.frame * Math.PI * 0.5)) * 0.08 : 0;
    a.sprite.scale.set(a.baseW, a.baseH, 1.0);
    a.sprite.position.y = 1.1 + bounce;
  }

  // 2. Enemy 2.5D Pixel Bobbing & Horizontal HTML Health Bars
  const container=$('hpBars');
  for(const e of enemies){
    if(e.dead||state!=='play'){
      if(e.hpBarEl){e.hpBarEl.remove();e.hpBarEl=null}
      continue;
    }

    if(e.anim && e.anim.sprite){
      const a = e.anim;
      if(a.hitTimer > 0){
        a.hitTimer -= dt;
        if(a.hitTimer <= 0 && a.sprite.material){
          a.sprite.material.color.setHex(0xffffff);
        }
      }

      const isLeft = (a.lastDirX < 0);

      if (a.isBoss) {
        // 👑 보스 몬스터 4x3 스프라이트 시트 애니메이션
        let targetState = 'walk';
        let frameRate = 5;

        if (a.attackTimer > 0) {
          targetState = 'attack';
          frameRate = 7;
          a.attackTimer -= dt;
        } else if (e.distToTarget !== undefined && e.distToTarget < 2.6) {
          targetState = 'attack';
          frameRate = 6;
        } else {
          targetState = 'walk';
          frameRate = 5;
        }

        if (a.state !== targetState) {
          a.state = targetState;
          a.frame = 0;
          a.frameTimer = 0;
        }

        a.frameTimer += dt;
        if (a.frameTimer >= 1 / frameRate) {
          a.frameTimer = 0;
          a.frame = (a.frame + 1) % 4;
        }

        if (a.tex) {
          const col = a.frame;
          // Row 0 = Idle (Top: 2/3), Row 1 = Walk (Mid: 1/3), Row 2 = Attack (Bot: 0.0)
          let rowY = 2 / 3;
          if (a.state === 'walk') rowY = 1 / 3;
          else if (a.state === 'attack') rowY = 0.0;

          if (isLeft) {
            a.tex.repeat.set(-0.25, 1 / 3);
            a.tex.offset.set((col + 1) * 0.25, rowY);
          } else {
            a.tex.repeat.set(0.25, 1 / 3);
            a.tex.offset.set(col * 0.25, rowY);
          }
        }

        const bossBounce = (a.state === 'walk') ? Math.abs(Math.sin(a.frame * Math.PI * 0.5)) * 0.12 : 0;
        a.sprite.scale.set(a.baseW, a.baseH, 1.0);
        a.sprite.position.y = a.baseH * 0.52 + bossBounce;

      } else {
        // 👾 귀여운 잡몹 낱장 이미지: 젤리 스쿼시 & 통통 바운스
        a.walkTime += dt * 9;
        const bounce = Math.abs(Math.sin(a.walkTime)) * 0.16;
        const squish = Math.sin(a.walkTime * 2) * 0.06;

        if (a.tex) {
          if (isLeft) {
            a.tex.repeat.set(-1, 1);
            a.tex.offset.set(1, 0);
          } else {
            a.tex.repeat.set(1, 1);
            a.tex.offset.set(0, 0);
          }
        }

        a.sprite.scale.set(a.baseW * (1 - squish), a.baseH * (1 + squish), 1.0);
        const floatY = (e.kind === 'caster') ? 0.25 + Math.sin(a.walkTime * 0.6) * 0.1 : 0; // 어둠의 마녀 부유
        a.sprite.position.y = a.baseH * 0.48 + bounce + floatY;
      }
    }

    if(e.lungeTimer > 0){
      e.lungeTimer -= dt;
      const progress = e.lungeTimer / 0.22;
      const lungeOffset = Math.sin((1 - progress) * Math.PI) * 0.3;
      if(e.obj){
        const forward = new THREE.Vector3(0,0,0).sub(e.pos).normalize().multiplyScalar(lungeOffset);
        e.obj.position.copy(e.pos).add(forward);
      }
    } else if(e.obj && !e.dead){
      e.obj.position.copy(e.pos);
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

    // 3. Hero Overhead Health & Shield Bar
    if (container) {
      if (!window.heroHpBarEl) {
        const el = document.createElement('div');
        el.id = 'heroOverheadBar';
        el.className = 'overheadBar heroOverhead';
        el.innerHTML = `
          <div class="ovhLevel">Lv.<span class="ovhLvNum">1</span></div>
          <div class="ovhTrack">
            <div class="ovhHpFill"></div>
            <div class="ovhShieldFill"></div>
          </div>
          <div class="ovhHpText">800/800</div>
        `;
        container.appendChild(el);
        window.heroHpBarEl = el;
      }
      const hBar = window.heroHpBarEl;
      if (hero.dead || state !== 'play') {
        hBar.style.display = 'none';
      } else {
        hBar.style.display = 'flex';
        const p = hero.pos.clone(); p.y += 2.4;
        p.project(camera);
        const x = (p.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(p.y * 0.5) + 0.5) * window.innerHeight;
        hBar.style.left = x + 'px';
        hBar.style.top = y + 'px';

        const hpRatio = Math.max(0, Math.min(1, hero.hp / hero.maxHp));
        const shieldRatio = Math.max(0, Math.min(1, hero.shield / hero.maxHp));
        hBar.querySelector('.ovhLvNum').textContent = hero.level;
        hBar.querySelector('.ovhHpFill').style.width = (hpRatio * 100) + '%';
        hBar.querySelector('.ovhShieldFill').style.width = (shieldRatio * 100) + '%';
        hBar.querySelector('.ovhHpText').textContent = Math.ceil(hero.hp) + (hero.shield > 0 ? ` (+${Math.ceil(hero.shield)})` : '');
      }

      // 4. World Tree Overhead Health & Shield Bar
      if (!window.towerHpBarEl) {
        const el = document.createElement('div');
        el.id = 'towerOverheadBar';
        el.className = 'overheadBar towerOverhead';
        el.innerHTML = `
          <div class="ovhTowerBadge">🌿 세계수</div>
          <div class="ovhTrack wide">
            <div class="ovhHpFill tower"></div>
            <div class="ovhShieldFill"></div>
          </div>
          <div class="ovhHpText">5000/5000</div>
        `;
        container.appendChild(el);
        window.towerHpBarEl = el;
      }
      const tBar = window.towerHpBarEl;
      if (state !== 'play') {
        tBar.style.display = 'none';
      } else {
        tBar.style.display = 'flex';
        const p = new THREE.Vector3(0, 7.0, 0);
        p.project(camera);
        const x = (p.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(p.y * 0.5) + 0.5) * window.innerHeight;
        tBar.style.left = x + 'px';
        tBar.style.top = y + 'px';

        const hpRatio = Math.max(0, Math.min(1, tower.hp / tower.maxHp));
        const shieldRatio = Math.max(0, Math.min(1, tower.shield / tower.maxHp));
        tBar.querySelector('.ovhHpFill').style.width = (hpRatio * 100) + '%';
        tBar.querySelector('.ovhShieldFill').style.width = (shieldRatio * 100) + '%';
        tBar.querySelector('.ovhHpText').textContent = Math.ceil(tower.hp) + (tower.shield > 0 ? ` (+${Math.ceil(tower.shield)})` : '');
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
    // Trail spark particle
    if(Math.random() < 0.45) sparkBurst(p.obj.position, p.col || 0x38bdf8, 1, 1.2, 0.08);
    if(p.obj.position.distanceTo(to)<.28){
      const hitCol = p.col || 0x38bdf8;
      if(p.splash&&p.splash>0){
        for(const e of enemies)if(!e.dead&&e.pos.distanceTo(p.target.pos)<p.splash)hitE(e,p.dmg*(e===p.target?1:.5),p.isCrit);
        ring(p.target.pos, p.splash, hitCol);
        sparkBurst(p.target.pos, hitCol, 14, 5, 0.16);
      }else{
        hitE(p.target,p.dmg,p.isCrit);
        sparkBurst(p.target.pos, hitCol, p.isCrit ? 10 : 5, 4, 0.12);
      }
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
    e.distToTarget = dist;

    if(dist<2.6&&tx===0&&tz===0){
      let dmg=e.dmg*dt;
      e.atkCool = (e.atkCool || 0) - dt;
      if (e.atkCool <= 0) {
        e.atkCool = 0.8;
        e.lungeTimer = 0.22;
        if (e.anim && e.anim.isBoss) {
          e.anim.attackTimer = 0.65; // 👑 보스 대검 휘두르기 공격 모션 트리거
        }
      }
      if(tower.shield>0){const ab=Math.min(tower.shield,dmg);tower.shield-=ab;dmg-=ab}
      tower.hp-=dmg;
    }else if(dist>0.3){
      let spd=e.speed;if(e.slowTimer>0){spd*=(1-e.slowAmt);e.slowTimer-=dt}
      dir.normalize();e.pos.addScaledVector(dir,spd*dt);
      // Screen-space horizontal movement determination for isometric camera (16,20,16): dir.x - dir.z
      const screenDx = dir.x - dir.z;
      if(e.anim && Math.abs(screenDx) > 0.04) e.anim.lastDirX = (screenDx < 0) ? -1 : 1;
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
      if(hero.anim && hero.anim.sprite && hero.anim.sprite.material){
        hero.anim.hitTimer = 0.12;
        hero.anim.sprite.material.color.setHex(0xff7777);
      }
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
      hero.dead=true;deadTimer=RESPAWN;gold=Math.max(0,Math.floor(gold*.85));
      if(hero.obj){scene.remove(hero.obj);hero.obj=null}
      show('deadOverlay');notify('사망! '+RESPAWN+'초 후 부활')
    }
  }

  /* effects */
  for(const f of effects){
    f.life-=dt;
    if(f.update){
      f.update(dt, f);
    } else {
      if(f.v){f.obj.position.addScaledVector(f.v,dt);f.v.multiplyScalar(.91)}
      if(f.isSlash){
        f.obj.rotation.z+=dt*15;
        f.obj.scale.setScalar(1+(f.max-f.life)*2.5);
        if(f.obj.material)f.obj.material.opacity=(f.life/f.max);
      }else{
        f.obj.scale.setScalar(1+(f.max-f.life)*1.8);
      }
    }
  }
  for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0){
    if(effects[i].onDestroy) effects[i].onDestroy();
    scene.remove(effects[i].obj);
    effects.splice(i,1);
  }

  /* clean dead */
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead){
    if(enemies[i].hpBarEl){enemies[i].hpBarEl.remove();enemies[i].hpBarEl=null}
    scene.remove(enemies[i].obj);enemies.splice(i,1);
  }

  /* wave done */
  /* wave clear */
  if(spawned>=enemyCount()&&alive===0){
    if(wave>=MAX_WAVE){state='victory';
      $('victoryDetail').textContent=`레벨 ${hero.level} · ${gold}G · ${HEROES[hero.type].name}`;
      SoundManager.play('victory');
      show('victory');return}
    wave++;spawned=0;spawnClock=2;gold+=60+wave*8;
    tower.hp=Math.min(tower.maxHp,tower.hp+150);pickSides();
    SoundManager.play('level_up');
    notify('웨이브 '+wave+' · '+curSides.map(i=>GNAMES[i]).join('+'))
  }

  /* tower fall */
  if(tower.hp<=0){tower.hp=0;state='over';
    $('overDetail').textContent=`웨이브 ${wave}/${MAX_WAVE} · 레벨 ${hero.level} · ${gold}G · ${HEROES[hero.type].name}`;
    SoundManager.play('gameover');
    show('gameover')}

  syncHud();
}

/* ═══ ITEMS ═══ */
function recalcStats(){
  let s={damage:0,maxHp:0,speed:0,crit:0,power:0,lifesteal:0,evasion:0,armor:0,rateBonus:0,cdReduction:0,rangeBonus:0};
  for(const it of inventory)for(const k of Object.keys(s))s[k]+=it.stats[k]||0;
  const d=HEROES[hero.type];
  hero.damage=d.dmg+2*(hero.level-1)+s.damage;
  hero.maxHp=d.hp+20*(hero.level-1)+s.maxHp;
  hero.speed=d.spd+s.speed;hero.crit=.08+s.crit;hero.power=1+s.power;
  hero.lifesteal=s.lifesteal;hero.evasion=s.evasion;hero.armor=s.armor;hero.rateBonus=s.rateBonus;
  hero.cdReduction=Math.min(.4,s.cdReduction);hero.range=d.rng+s.rangeBonus;
  if(hero.type==='assassin'&&hero.skillLevels.E>0){const sk=HEROES.assassin.skills.E;hero.crit+=sk.val[hero.skillLevels.E-1]}
  hero.hp=Math.min(hero.hp,hero.maxHp);
}
function buyItem(item){
  if(inventory.length>=8){notify('인벤토리 가득!');return}
  if(gold<item.cost){notify('골드 부족!');return}
  gold-=item.cost;inventory.push({...item,stats:{...item.stats}});recalcStats();
  SoundManager.play('buy');
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
  recalcStats();notify(r.name+' 조합 완료!');selectedInvIndex=-1;
  SoundManager.play('craft');
  renderShop();syncHud();
}
function sellItem(idx){
  const it=inventory[idx];if(!it)return;
  gold+=Math.floor((it.cost||0)*.5);inventory.splice(idx,1);recalcStats();
  notify(it.name+' 판매 완료');selectedInvIndex=-1;
  SoundManager.play('gold');
  renderShop();syncHud();
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
  if($('towerText')) $('towerText').textContent=Math.ceil(tower.hp)+' / '+tower.maxHp+(tower.shield>0?' (+'+Math.ceil(tower.shield)+')':'');
  if($('towerBar')) $('towerBar').style.width=Math.max(0,tower.hp/tower.maxHp*100)+'%';
  if($('heroHpText')) $('heroHpText').textContent=hero.dead?'사망':Math.ceil(hero.hp)+' / '+hero.maxHp+(hero.shield>0?' (+'+Math.ceil(hero.shield)+')':'');
  if($('heroBar')) $('heroBar').style.width=hero.dead?'0':Math.max(0,hero.hp/hero.maxHp*100)+'%';
  /* skills */
  for(const key of SK){
    const el=$('skill'+key);if(!el)continue;
    const sk=HEROES[hero.type]?.skills[key];if(!sk)continue;
    const lv=hero.skillLevels[key],cd=hero.skillCDs[key];
    const iconUrl=`./icons/skill_${hero.type}_${key}.png`;
    if(el.dataset.bg!==iconUrl){
      el.style.backgroundImage=`url('${iconUrl}')`;
      el.dataset.bg=iconUrl;
    }
    el.title=`${sk.name} [${'1234'['QWER'.indexOf(key)]}]\n${sk.desc}`;
    el.querySelector('.sk-name').textContent=sk.name;
    el.querySelector('.sk-lv').textContent=lv>0?'Lv'+lv:'-';
    const cdEl=el.querySelector('.sk-cd');
    cdEl.textContent=cd>0?cd.toFixed(1):'';
    el.classList.toggle('on-cd',cd>0);el.classList.toggle('not-learned',lv<=0);
    el.classList.toggle('locked',!!(sk.ulti&&hero.level<8));
  }
  $('skillPoints').textContent=hero.skillPoints>0?'스킬포인트: '+hero.skillPoints:'';
  if(hero.dead){show('deadOverlay');$('deadTimer').textContent=Math.ceil(deadTimer)+'초'}else hide('deadOverlay');
}

function renderShop(){
  const box=$('shopItems'),rbox=$('recipeItems'),inv=$('shopInventory');
  if(!box)return;$('shopGold').textContent=gold+' G';

  box.replaceChildren();
  for(const item of ITEMS){
    const b=document.createElement('button');b.type='button';b.className='shopItem compact';
    const iconUrl=`./icons/item_${item.id}.png`;
    b.innerHTML=`
      <div class="itemIcon sm" style="background-image: url('${iconUrl}')"></div>
      <div class="itemDetails">
        <strong>${item.name}</strong>
        <span>${item.desc}</span>
        <em>${item.cost} G</em>
      </div>
    `;
    b.onclick=()=>buyItem(item);box.appendChild(b);
  }

  if(rbox){
    rbox.replaceChildren();
    const sortedRecipes = [...RECIPES].sort((a,b)=> (canCombine(b)?1:0) - (canCombine(a)?1:0));
    for(const r of sortedRecipes){
      const can=canCombine(r);const b=document.createElement('button');
      b.type='button';b.className='shopItem compact recipe'+(can?' canCraft':'');
      const iconUrl=`./icons/item_${r.id}.png`;
      const tierColor=r.tier>=4?'#ff6644':r.tier===3?'#ff9944':'#66bbff';
      const mats=r.mats.map(id=>{const x=ITEMS.find(i=>i.id===id)||RECIPES.find(i=>i.id===id);return x?x.name:id}).join(' + ');
      b.innerHTML=`
        <div class="itemIcon sm" style="background-image: url('${iconUrl}')"></div>
        <div class="itemDetails">
          <strong>${r.name} <small style="color:${tierColor}">[T${r.tier}]</small></strong>
          <span>${r.desc}</span>
          <small class="mats">${mats}${r.extra>0?' +'+r.extra+'G':''}</small>
        </div>
      `;
      b.title=`${r.name} [T${r.tier}]\n${r.desc}\n재료: ${mats}${r.extra>0?' +'+r.extra+'G':''}`;
      b.onclick=()=>{if(can)doCombine(r);else notify('재료 부족!')};
      rbox.appendChild(b);
    }
  }

  if(inv){
    inv.replaceChildren();
    inventory.forEach((it,i)=>{
      const b=document.createElement('button');b.type='button';
      const isSel=(i===selectedInvIndex);
      b.className='invItem compact'+(isSel?' selected':'');
      const iconUrl=`./icons/item_${it.id}.png`;
      const tierColor=it.tier>=4?'#ff6644':it.tier===3?'#ff9944':it.tier===2?'#66bbff':'#ccc';
      b.innerHTML=`
        <div class="itemIcon sm" style="background-image: url('${iconUrl}')"></div>
        <div class="itemDetails">
          <strong style="color:${tierColor}">${it.name} <small>[T${it.tier}]</small></strong>
          <small>${it.desc}</small>
        </div>
      `;
      b.onclick=()=>{selectedInvIndex=i;renderShop()};
      inv.appendChild(b);
    });
    for(let i=inventory.length;i<8;i++){
      const b=document.createElement('button');b.type='button';b.className='invItem compact empty';b.disabled=true;
      b.innerHTML=`
        <div class="itemIcon sm" style="background:rgba(0,0,0,0.3);border-style:dashed;border-color:#334e68;"></div>
        <div class="itemDetails"><strong>\ube48 \uc2ac\ub86f</strong></div>
      `;
      inv.appendChild(b);
    }

    if(selectedInvIndex>=0 && selectedInvIndex<inventory.length){
      const item=inventory[selectedInvIndex];
      const sellPrice=Math.floor((item.cost||0)*0.5);
      const confBox=document.createElement('div');
      confBox.className='sellConfirmBox';
      confBox.innerHTML=`
        <div class="itemIcon big" style="background-image: url('./icons/item_${item.id}.png')"></div>
        <div class="sellConfirmInfo">
          <strong>${item.name} [T${item.tier}]</strong>
          <span>${item.desc}</span>
        </div>
        <div class="sellConfirmBtns">
          <button type="button" class="confirmSellBtn">\ud83d\udcb0 ${sellPrice}G \ud310\ub9e4</button>
          <button type="button" class="cancelSellBtn">\ucde8\uc18c</button>
        </div>
      `;
      confBox.querySelector('.confirmSellBtn').onclick=()=>{sellItem(selectedInvIndex)};
      confBox.querySelector('.cancelSellBtn').onclick=()=>{selectedInvIndex=-1;renderShop()};
      inv.appendChild(confBox);
    }
  }
}

function renderSkillUp(){
  const box=$('skillChoices');if(!box)return;box.replaceChildren();$('spRemain').textContent=hero.skillPoints;
  for(const key of SK){
    const sk=HEROES[hero.type].skills[key],lv=hero.skillLevels[key],mx=sk.ulti?3:4;
    const can=lv<mx&&(!sk.ulti||hero.level>=8)&&hero.skillPoints>0;
    const iconUrl=`./icons/skill_${hero.type}_${key}.png`;
    const b=document.createElement('button');b.type='button';
    b.className='skillChoice'+(can?' available':'');b.disabled=!can;
    b.innerHTML=`
      <div class="skChoiceIcon" style="background-image: url('${iconUrl}')">
        <div class="sk-key-big">${'1234'['QWER'.indexOf(key)]}</div>
      </div>
      <strong>${sk.name}</strong>
      <small>${sk.desc}</small>
      <span>Lv ${lv} / ${mx}</span>
    `;
    b.onclick=()=>{if(!can)return;hero.skillLevels[key]++;hero.skillPoints--;
      if(sk.type==='passive')recalcStats();
      if(sk.type==='revive'&&hero.skillLevels[key]>0)hero.hasRevive=true;
      if(hero.skillPoints<=0){closeSkillUp()}else renderSkillUp();syncHud()};
    box.appendChild(b);
  }
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
    const sheetUrl = HERO_SHEETS[key] || '';
    const b=document.createElement('button');b.type='button';b.className='heroChoice';
    const skList=Object.entries(h.skills).map(([k,s])=>`<b>${'1234'['QWER'.indexOf(k)]}</b> ${s.name}`).join(' · ');
    b.innerHTML=`
      <div class="heroPortrait" style="background-image: url('${sheetUrl}')"></div>
      <b style="color:#${h.color.toString(16).padStart(6,'0')}">${h.name}</b>
      <small>${h.desc}</small>
      <small class="sk-list">${skList}</small>
    `;
    b.onclick=()=>beginHero(key);box.appendChild(b);
  }
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
  SoundManager.init();SoundManager.playBgm();SoundManager.play('click');
  initHero(type);resetRun();makeHero();hideAll();state='play';
  notify('웨이브 1 · '+curSides.map(i=>GNAMES[i]).join('+')+' 방향');syncHud();
}

/* ═══ INPUT ═══ */
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  keys.add(k);
  if(k==='escape'){
    if(!$('soundModal').classList.contains('hidden')){
      SoundManager.closeModal();
      return;
    }
  }
  if(state==='play'){
    if(k==='1')useSkill('Q');if(k==='2')useSkill('W');if(k==='3')useSkill('E');if(k==='4')useSkill('R');
    if(k==='i'){SoundManager.play('click');openShop()}
    if(k==='k'){SoundManager.play('click');openSkillUp()}
    if(k==='m'||k==='o'){SoundManager.play('click');SoundManager.openModal()}
    if(k==='escape'){state='pause';show('pause')}
  }else if(state==='shop'){
    if(k==='escape'||k==='i'){SoundManager.play('click');closeShop()}
  }else if(state==='skillUp'){
    if(k==='escape'||k==='k'){SoundManager.play('click');closeSkillUp()}
  }else if(state==='pause'){
    if(k==='escape'){state='play';hide('pause')}
  }
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

/* skill bar click */
for(const key of SK){const el=$('skill'+key);if(el)el.addEventListener('click',()=>{
  if(state==='play')useSkill(key)})}

/* buttons */
const sBtn=$('soundBtn');if(sBtn)sBtn.onclick=e=>{e.preventDefault();SoundManager.init();SoundManager.toggleMute()};
$('startBtn').onclick=()=>{SoundManager.init();SoundManager.playBgm();SoundManager.play('click');hide('start');buildHeroSelect();show('heroSelect')};
$('shopBtn').onclick=e=>{e.preventDefault();SoundManager.play('click');if(state==='shop')closeShop();else openShop()};
$('skillBtn').onclick=e=>{e.preventDefault();SoundManager.play('click');if(state==='skillUp')closeSkillUp();else openSkillUp()};
$('tabBuy').onclick=()=>{SoundManager.play('click');setShopTab('buy')};
$('tabRecipe').onclick=()=>{SoundManager.play('click');setShopTab('recipe')};
$('tabInv').onclick=()=>{SoundManager.play('click');setShopTab('inv')};
$('shopClose').onclick=()=>{SoundManager.play('click');closeShop()};
$('skillUpClose').onclick=()=>{SoundManager.play('click');closeSkillUp()};
$('resumeBtn').onclick=()=>{SoundManager.play('click');state='play';hide('pause')};
$('restartBtn').onclick=()=>{SoundManager.play('click');hideAll();show('start');state='menu'};
$('victoryBtn').onclick=()=>{SoundManager.play('click');hideAll();show('start');state='menu'};

/* ═══ MOBILE DYNAMIC FLOATING JOYSTICK CONTROLLER ═══ */
const joystickEl = $('touchJoystick');
const knobEl = $('joystickKnob');

if (joystickEl && knobEl) {
  let joystickActive = false;
  let touchId = null;
  let centerX = 0, centerY = 0;
  const maxRadius = 45;

  const isGameplayTouch = target => {
    if (state !== 'play') return false;
    if (!target || !target.closest) return true;
    return !target.closest(
      'button, input, select, textarea, a, .skillSlot, .overlay, #hud, #skillBar, .hudAction'
    );
  };

  function showJoystickAt(x, y) {
    centerX = x;
    centerY = y;
    joystickEl.style.display = 'block';
    joystickEl.style.left = (centerX - maxRadius) + 'px';
    joystickEl.style.top = (centerY - maxRadius) + 'px';
    knobEl.style.transform = 'translate(0px, 0px)';
  }

  function updateJoystick(clientX, clientY) {
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
    joystickEl.style.display = 'none';
    knobEl.style.transform = 'translate(0px, 0px)';
    touchDir.x = 0;
    touchDir.z = 0;
  }

  // Floating joystick appears on touch in gameplay area
  window.addEventListener('touchstart', e => {
    if (state !== 'play' || joystickActive || !e.changedTouches.length) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (!isGameplayTouch(e.target)) continue;
      if (t.clientX < window.innerWidth * 0.65 && t.clientY > 65) {
        touchId = t.identifier;
        joystickActive = true;
        showJoystickAt(t.clientX, t.clientY);
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (!joystickActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        e.preventDefault();
        updateJoystick(t.clientX, t.clientY);
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (!joystickActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        resetJoystick();
        break;
      }
    }
  }, { passive: false });

  window.addEventListener('touchcancel', resetJoystick, { passive: true });

  // Desktop mouse support for testing floating joystick
  let isMouseDown = false;
  window.addEventListener('mousedown', e => {
    if (state !== 'play' || isMouseDown) return;
    if (!isGameplayTouch(e.target)) return;
    if (e.clientX < window.innerWidth * 0.6 && e.clientY > 65) {
      isMouseDown = true;
      joystickActive = true;
      showJoystickAt(e.clientX, e.clientY);
    }
  });
  window.addEventListener('mousemove', e => {
    if (isMouseDown) updateJoystick(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      resetJoystick();
    }
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

  // Screen shake camera offset
  if (screenShakeTimer > 0) {
    screenShakeTimer -= dt;
    const ox = (Math.random() - 0.5) * screenShakeMagnitude;
    const oz = (Math.random() - 0.5) * screenShakeMagnitude;
    camera.position.set(16 + ox, 20, 16 + oz);
    if (screenShakeTimer <= 0) camera.position.set(16, 20, 16);
  }

  // World Tree Gentle Breathing & Runic Glow
  if (typeof towerSprite !== 'undefined' && towerSprite) {
    towerSprite.position.y = (7.0 * 0.44) + Math.sin(now * 0.002) * 0.04;
  }
  if (typeof crystalLight !== 'undefined' && crystalLight) {
    crystalLight.intensity = 2.8 + Math.sin(now * 0.004) * 0.6;
  }



  // Floating Fireflies in Enchanted Forest
  if (typeof fireflyPoints !== 'undefined' && fireflyPoints) {
    const pos = fireflyGeom.attributes.position.array;
    for (let i = 0; i < firefliesCount; i++) {
      const sp = fireflySpeeds[i];
      pos[i * 3 + 0] += sp.vx * dt;
      pos[i * 3 + 1] = sp.baseY + Math.sin(now * 0.002 + sp.phase) * 0.4;
      if (Math.abs(pos[i * 3 + 0]) > 14) sp.vx *= -1;
    }
    fireflyGeom.attributes.position.needsUpdate = true;
  }

  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.testSpawnBoss = function() {
  const g = GATES[0]; // 북쪽 게이트
  const e = {
    kind: 'boss',
    pos: new THREE.Vector3(g.x, 0, g.z),
    hp: 4000, maxHp: 4000, speed: 1.6, dmg: 40,
    gold: 500, xp: 500, h: 3.8, color: 0xdc2626,
    dead: false, stunTimer: 0, slowTimer: 0, slowAmt: 0,
    poisonTimer: 0, poisonDmg: 0, tauntTimer: 0,
    obj: null, anim: null, hpBarEl: null, bob: 0
  };
  makeEnemy(e);
  enemies.push(e);
  console.log('👑 Test Boss Demon spawned:', e);
  return e;
};

SoundManager.init();

})();

