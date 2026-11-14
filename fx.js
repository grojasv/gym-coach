// Gym Coach: the fun layer. Pure decoration on top of the app, so the hub and the player work the same without it.
//  - the intro when the app opens (El Titán drops into the ring, the title slams in); a tap skips it
//  - the hub's first-paint entrance, and El Titán striking a pose when tapped
//  - the player: an entrance for each new step and confetti on the end screen
// It never touches timers, speech or data: it watches what app.js and player.js render and only adds classes and
// throwaway elements. With prefers-reduced-motion nothing here runs (style.css also switches every animation off).
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const titan = (pose) => (window.Titan ? window.Titan.svg(pose) : '');
  const el = (cls, html = '') => Object.assign(document.createElement('div'), { className: cls, innerHTML: html });

  // ---------- intro: once per app open, hub only, about 1.9 s ----------
  const INTRO_KEY = 'gym-coach.intro';
  const seen = () => { try { return sessionStorage.getItem(INTRO_KEY); } catch { return '1'; } };
  function firstPaint() { // the hub's cards and hero come in once, right after the intro
    document.body.classList.add('fx-first');
    setTimeout(() => document.body.classList.remove('fx-first'), 1500);
  }
  function intro() {
    if (calm.matches || seen() || !window.Titan || !/^(#\/?)?$/.test(location.hash)) return;
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* private mode */ }
    const sparks = Array.from({ length: 10 }, (_, i) => `<i style="--a:${i * 36 + 10}deg;--d:${70 + (i % 3) * 22}px"></i>`).join('');
    const box = el('fx-intro', `<div class="intro-rays"></div>
      <div class="intro-stage">
        <div class="intro-titan">${titan('cheer')}</div>
        <div class="intro-sparks">${sparks}</div>
        <div class="intro-title"><span>Gym</span><b>Coach</b></div>
      </div>
      <div class="intro-ropes"><i></i><i></i><i></i></div>`);
    box.setAttribute('aria-hidden', 'true');
    let gone = false;
    const leave = (fast) => {
      if (gone) return; gone = true;
      box.classList.add(fast ? 'skip' : 'out');
      firstPaint();
      setTimeout(() => box.remove(), fast ? 160 : 320);
    };
    box.addEventListener('pointerdown', () => leave(true));
    document.body.append(box);
    setTimeout(leave, 1650);
  }
  intro();

  // ---------- hub: tap El Titán and he strikes a pose ----------
  const SHOW = ['work', 'cheer', 'rest'];
  let showN = 0, showT = 0;
  document.getElementById('view')?.addEventListener('click', (e) => {
    const m = e.target.closest('#heroMascot');
    if (!m || !window.Titan) return;
    const pose = SHOW[showN++ % SHOW.length];
    m.innerHTML = titan(pose); m.className = `mascot pose-${pose} wiggle`;
    clearTimeout(showT);
    showT = setTimeout(() => { if (m.isConnected) { m.innerHTML = titan('idle'); m.className = 'mascot pose-idle'; } }, 1400);
  });

  // ---------- player: step entrances and the end-screen confetti ----------
  const player = document.getElementById('player');
  let lastKey = '', rain = null, rainT = 0;
  function stopRain() { clearTimeout(rainT); rain?.remove(); rain = null; }
  function confetti() {
    stopRain();
    if (calm.matches) return;
    const colors = ['var(--gold)', 'var(--red)', 'var(--teal)', 'var(--leaf)', '#fff', 'var(--orange)'];
    const rnd = (a, b) => a + Math.random() * (b - a);
    rain = el('confetti', Array.from({ length: 44 }, (_, i) => `<i class="${i % 5 === 0 ? 'star' : i % 3 === 0 ? 'dot' : ''}" style="left:${rnd(0, 100).toFixed(1)}%;
      --c:${colors[i % colors.length]};--x:${rnd(-60, 60).toFixed(0)}px;--r:${rnd(360, 1080).toFixed(0)}deg;
      animation-delay:${rnd(0, 0.7).toFixed(2)}s;animation-duration:${rnd(1.9, 3.2).toFixed(2)}s"></i>`).join(''));
    rain.setAttribute('aria-hidden', 'true');
    document.body.append(rain);
    rainT = setTimeout(stopRain, 4200);
  }
  if (player) {
    // player.js replaces the whole screen on every render (pause, mute and overlays too). A step is new only when its
    // kind or its title changed: then the stage gets .fx-enter, which style.css animates. Runs before the next paint.
    new MutationObserver(() => {
      const stage = player.querySelector('.p-stage');
      if (!stage) { lastKey = ''; stopRain(); return; }
      if (stage.classList.contains('fx-enter')) return;
      const key = `${stage.className}|${player.querySelector('.p-label')?.textContent}|${stage.querySelector('.p-title')?.textContent}`;
      if (key === lastKey) return;
      lastKey = key;
      if (calm.matches) return;
      stage.classList.add('fx-enter');
      if (stage.classList.contains('kind-done')) confetti();
    }).observe(player, { childList: true });
  }
})();
