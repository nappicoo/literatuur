/* ============================================================
   THE LORD OF THE RINGS — Presentation Engine
   Navigation · Parallax · Golden particles · Ambience · Notes
   ============================================================ */

(function () {
  'use strict';

  /* ---------- DOM ---------- */
  const slides     = Array.from(document.querySelectorAll('.slide'));
  const dotsWrap   = document.getElementById('dots');
  const counterEl  = document.getElementById('counter');
  const fillEl     = document.getElementById('progressFill');
  const progressEl = document.querySelector('.progress');
  const notesPanel = document.getElementById('notes');
  const notesBody  = document.getElementById('notesBody');
  const notesBtn   = document.getElementById('notesToggle');
  const prevBtn    = document.getElementById('prev');
  const nextBtn    = document.getElementById('next');
  const fullBtn    = document.getElementById('fullBtn');
  const soundBtn   = document.getElementById('soundBtn');
  const deck       = document.getElementById('deck');

  const TOTAL = slides.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover     = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- FULL SPEAKER SCRIPT ---------- */
  const SPEAKER_NOTES = [
    `Today, I would like to introduce one of the most famous fantasy stories in the world: The Lord of the Rings. It was written by J. R. R. Tolkien and later became a successful movie trilogy. The story takes place in a magical world called Middle-earth, filled with different creatures, beautiful kingdoms, powerful wizards and dangerous enemies. But behind all the magic, it tells us something deeper about friendship, courage and the power of hope.`,

    `The story begins in a peaceful place called the Shire, where a young hobbit named Frodo Baggins lives. One day, he receives a mysterious golden ring from his uncle Bilbo. At first, it seems like an ordinary object, but the wizard Gandalf discovers its terrible secret. It is the One Ring, created by the dark lord Sauron to control the world. If Sauron gets it back, darkness will cover all of Middle-earth.`,

    `To save the world, Frodo must take the ring to Mordor and destroy it in the fires of Mount Doom. He does not travel alone. His friends join him, including Sam, Gandalf, Aragorn, Legolas and Gimli. Together, they form the Fellowship of the Ring. Their journey is full of danger, difficult decisions and unexpected adventures. They must learn to trust each other because their mission is bigger than any one of them.`,

    `As the journey continues, the group faces many enemies and difficult situations. Eventually, the Fellowship separates, and Frodo and Sam continue towards Mordor together. The ring becomes heavier for Frodo, not because of its physical weight, but because of its dark power. Sam stays beside him and never gives up on his friend. Their friendship becomes one of the strongest parts of the story. It shows that sometimes, having one loyal friend is more valuable than having great power.`,

    `Finally, Frodo and Sam reach Mount Doom, where the ring was created. After a long and difficult journey, the One Ring is destroyed, and Sauron's power comes to an end. Middle-earth is saved, and peace returns. The heroes survive, but they are changed forever by everything they have experienced. Their victory shows that even the darkest moments can be overcome with courage and determination.`,

    `In my opinion, The Lord of the Rings is much more than a fantasy adventure. It teaches us about loyalty, sacrifice, friendship and hope. Frodo shows us that even an ordinary person can do something extraordinary. Sam reminds us that true friendship means staying beside someone, even when life becomes difficult. And I would like to finish with one important thought: You don't have to be powerful to be a hero. Sometimes, the smallest people can change the world.`
  ];

  const SLIDE_TITLES = [
    'Enter Middle-earth',
    'The Mysterious Ring',
    'The Fellowship',
    'A Journey of Friendship',
    'The Final Journey',
    'The Meaning Behind the Story'
  ];

  /* ---------- STATE ---------- */
  let index = 0;
  let locked = false;
  const LOCK_MS = 520;

  /* ============================================================
     1. NAVIGATION
     ============================================================ */

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.title = SLIDE_TITLES[i] || ('Slide ' + (i + 1));
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ': ' + (SLIDE_TITLES[i] || ''));
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(i) {
    i = Math.max(0, Math.min(TOTAL - 1, i));
    if (i === index || locked) return;

    locked = true;
    window.setTimeout(() => { locked = false; }, LOCK_MS);

    const out = slides[index];
    out.classList.remove('is-active');
    out.setAttribute('aria-hidden', 'true');

    index = i;

    const inSlide = slides[index];
    inSlide.classList.add('is-active');
    inSlide.setAttribute('aria-hidden', 'false');

    render();
  }

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  function render() {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));

    counterEl.textContent =
      String(index + 1).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');

    fillEl.style.transform = 'scaleX(' + ((index + 1) / TOTAL) + ')';
    progressEl.setAttribute('aria-valuenow', String(index + 1));

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === TOTAL - 1;

    notesBody.textContent = SPEAKER_NOTES[index] || '';

    document.body.dataset.scene = slides[index].dataset.scene || 'shire';
    recolorParticles();
    resetParallax();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault(); prev(); break;

      case 'Home':
        e.preventDefault(); goTo(0); break;

      case 'End':
        e.preventDefault(); goTo(TOTAL - 1); break;

      case 'n':
      case 'N':
        e.preventDefault(); toggleNotes(); break;

      case 'f':
      case 'F':
        e.preventDefault(); toggleFullscreen(); break;

      case 'Escape':
        notesPanel.classList.remove('is-open');
        notesBtn.setAttribute('aria-expanded', 'false');
        break;
    }
  });

  /* ---------- Touch swipe ---------- */
  let tX = 0, tY = 0, tT = 0;

  deck.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    tX = t.clientX; tY = t.clientY; tT = Date.now();
  }, { passive: true });

  deck.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - tX;
    const dy = t.clientY - tY;
    if (Date.now() - tT > 800) return;
    if (Math.abs(dx) < 55) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.4) return;
    dx < 0 ? next() : prev();
  }, { passive: true });

  /* ---------- Speaker notes ---------- */
  function toggleNotes() {
    const open = notesPanel.classList.toggle('is-open');
    notesBtn.setAttribute('aria-expanded', String(open));
  }
  notesBtn.addEventListener('click', toggleNotes);
  notesBtn.setAttribute('aria-expanded', 'false');

  /* ---------- Fullscreen ---------- */
  function toggleFullscreen() {
    const el = document.documentElement;
    const doc = document;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (doc.exitFullscreen || doc.webkitExitFullscreen || function () {}).call(doc);
    }
  }
  fullBtn.addEventListener('click', toggleFullscreen);

  /* ============================================================
     2. PARALLAX
     ============================================================ */

  let tx = 0, ty = 0, cx = 0, cy = 0, pRAF = null;

  function resetParallax() {
    cx = tx; cy = ty;
  }

  function updateParallax() {
    cx += (tx - cx) * 0.075;
    cy += (ty - cy) * 0.075;

    const groups = slides[index].querySelectorAll('.px');
    for (let i = 0; i < groups.length; i++) {
      const el = groups[i];
      const d = parseFloat(el.dataset.depth) || 0.5;
      el.style.transform =
        'translate3d(' + (-cx * d * 26).toFixed(2) + 'px,' +
                        (-cy * d * 16).toFixed(2) + 'px,0)';
    }

    if (Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015) {
      pRAF = requestAnimationFrame(updateParallax);
    } else {
      pRAF = null;
    }
  }

  if (canHover && !reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!pRAF) pRAF = requestAnimationFrame(updateParallax);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!pRAF) pRAF = requestAnimationFrame(updateParallax);
    });
  }

  /* ============================================================
     3. GOLDEN PARTICLES / EMBERS
     ============================================================ */

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = 1;
  let particles = [];
  let rafId = null;
  let lastTime = 0;
  let clock = 0;

  const PALETTES = {
    shire:   ['212,175,55', '247,236,196', '138,205,160'],
    ring:    ['212,175,55', '255,236,170'],
    journey: ['230,214,160', '212,175,55', '180,215,190'],
    forest:  ['212,175,55', '255,215,130'],
    battle:  ['255,140,60', '212,175,55', '255,190,110'],
    dawn:    ['255,236,170', '212,175,55', '255,215,140']
  };

  const glowCache = new Map();

  function glowSprite(rgb) {
    if (glowCache.has(rgb)) return glowCache.get(rgb);

    const S = 64;
    const c = document.createElement('canvas');
    c.width = c.height = S;

    const g = c.getContext('2d');
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0,    'rgba(' + rgb + ',1)');
    grad.addColorStop(0.20, 'rgba(' + rgb + ',0.60)');
    grad.addColorStop(0.50, 'rgba(' + rgb + ',0.15)');
    grad.addColorStop(1,    'rgba(' + rgb + ',0)');

    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);

    glowCache.set(rgb, c);
    return c;
  }

  function palette() {
    return PALETTES[document.body.dataset.scene] || PALETTES.shire;
  }

  function makeParticle(fromBottom) {
    const p = palette();
    return {
      x: Math.random() * W,
      y: fromBottom ? H + 30 : Math.random() * H,
      r: 1 + Math.random() * 2.4,
      rgb: p[(Math.random() * p.length) | 0],
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.09 + Math.random() * 0.38),
      sway: 0.35 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.28 + Math.random() * 0.55,
      pulse: 0.55 + Math.random() * 1.6
    };
  }

  function spawnParticles() {
    const count = reduceMotion ? 18 : (W < 720 ? 38 : 64);
    particles = [];
    for (let i = 0; i < count; i++) particles.push(makeParticle(false));
  }

  function recolorParticles() {
    if (!particles.length) return;
    const p = palette();
    for (let i = 0; i < particles.length; i++) {
      particles[i].rgb = p[(Math.random() * p.length) | 0];
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function drawFrame(now) {
    const dt = Math.min(50, now - lastTime) / 16.6667;
    lastTime = now;
    clock += dt * 0.016;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx * dt + Math.sin(clock * p.sway + p.phase) * 0.25 * dt;
      p.y += p.vy * dt;

      if (p.y < -50) { particles[i] = makeParticle(true); continue; }
      if (p.x < -50) p.x = W + 50;
      else if (p.x > W + 50) p.x = -50;

      const flick = 0.55 + 0.45 * Math.sin(clock * p.pulse + p.phase);
      const size = p.r * 15 * (0.72 + flick * 0.55);

      ctx.globalAlpha = p.alpha * flick;
      ctx.drawImage(glowSprite(p.rgb), p.x - size / 2, p.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    rafId = requestAnimationFrame(drawFrame);
  }

  function startLoop() {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(drawFrame);
  }

  function stopLoop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); spawnParticles(); }, 180);
  });

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopLoop() : startLoop();
  });

  /* ============================================================
     4. AMBIENT SOUND (generated — no audio files needed)
     ============================================================ */

  let audio = null;
  let soundOn = false;

  function createAmbience() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const actx = new AC();

    const master = actx.createGain();
    master.gain.value = 0;

    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.7;

    // warm, low pad — A minor-ish drone
    const freqs = [110, 164.81, 220, 329.63];
    freqs.forEach((f, i) => {
      const osc = actx.createOscillator();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 7;

      const g = actx.createGain();
      g.gain.value = 0.16 / (i + 1);

      osc.connect(g).connect(filter);
      osc.start();
    });

    // slow shimmer
    const lfo = actx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = actx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    filter.connect(master).connect(actx.destination);

    return { ctx: actx, master };
  }

  function toggleSound() {
    if (!audio) audio = createAmbience();
    if (!audio) return;

    if (audio.ctx.state === 'suspended') audio.ctx.resume();

    soundOn = !soundOn;
    const t = audio.ctx.currentTime;
    audio.master.gain.cancelScheduledValues(t);
    audio.master.gain.linearRampToValueAtTime(soundOn ? 0.055 : 0.0001, t + 1.2);

    soundBtn.classList.toggle('is-on', soundOn);
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.querySelector('.ico-off').style.display = soundOn ? 'none' : '';
    soundBtn.querySelectorAll('.ico-on').forEach(p => {
      p.style.display = soundOn ? '' : 'none';
    });
  }

  soundBtn.addEventListener('click', toggleSound);

  /* ============================================================
     5. INIT
     ============================================================ */

  function init() {
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === 0);
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    document.body.dataset.scene = slides[0].dataset.scene || 'shire';

    resize();
    spawnParticles();
    render();
    startLoop();

    // preload the ring gradient references used by CSS
    void document.body.offsetHeight;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
