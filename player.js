// Gym Coach player: turns a routine into a timeline (prep → work → rest … → done) and plays it with El Titán.
// Countdowns come from timestamps (endAt), never from counting ticks, so a throttled or backgrounded page catches up.
// Cues are scheduled on the timeline (not on speech onend, which is unreliable). See SPEC.md § Player.
(() => {
  const TEXT = {
    prep: { es: 'Prepárate', ca: 'Prepara’t', en: 'Get ready' },
    work: { es: '¡A tope!', ca: 'A tope!', en: 'Go!' },
    rest: { es: 'Descanso', ca: 'Descans', en: 'Rest' },
    done: { es: '¡Victoria!', ca: 'Victòria!', en: 'Victory!' },
    start: { es: 'Empezar', ca: 'Comença', en: 'Start' },
    finished: { es: 'Hecho', ca: 'Fet', en: 'Done' },
    next: { es: 'Siguiente', ca: 'Següent', en: 'Next' },
    round: { es: 'Ronda', ca: 'Ronda', en: 'Round' },
    reps: { es: 'reps', ca: 'reps', en: 'reps' },
    toFailure: { es: 'Al fallo técnico', ca: 'Fins a la fallada tècnica', en: 'To technical failure' },
    toFailureHint: { es: 'Para cuando la postura se rompa', ca: 'Atura’t quan la postura es trenqui', en: 'Stop when your form breaks' },
    kg: { es: 'kg', ca: 'kg', en: 'kg' },
    weight: { es: 'Peso por mancuerna', ca: 'Pes per manuella', en: 'Weight per dumbbell' },
    exit: { es: 'Salir', ca: 'Surt', en: 'Exit' },
    back: { es: 'Volver al hub', ca: 'Torna al hub', en: 'Back to the hub' },
    pause: { es: 'Pausa', ca: 'Pausa', en: 'Pause' },
    resume: { es: 'Seguir', ca: 'Continua', en: 'Resume' },
    skip: { es: 'Saltar', ca: 'Salta', en: 'Skip' },
    prev: { es: 'Anterior', ca: 'Anterior', en: 'Previous' },
    mute: { es: 'Voz', ca: 'Veu', en: 'Voice' },
    paused: { es: 'En pausa', ca: 'En pausa', en: 'Paused' },
    total: { es: 'Duración', ca: 'Durada', en: 'Length' },
    steps: { es: 'Series', ca: 'Sèries', en: 'Sets' },
    voiceHint: { es: 'Sube el volumen: El Titán te habla.', ca: 'Apuja el volum: el Titan et parla.', en: 'Turn the volume up: El Titán talks to you.' },
    noCaVoice: { es: '', ca: 'Aquest mòbil no té veu en català: el Titan parlarà en castellà.', en: '' },
    exitAsk: { es: '¿Salir del entreno?', ca: 'Vols sortir de l’entrenament?', en: 'Leave the workout?' },
    summary: { es: 'Series completadas', ca: 'Sèries completades', en: 'Sets completed' },
    feelAsk: { es: '¿Cómo te ha ido cada ejercicio?', ca: 'Com t’ha anat cada exercici?', en: 'How did each exercise feel?' },
    feelHint: { es: 'Si algo te sobró, márcalo fácil: a las 2 veces seguidas sale para subir.', ca: 'Si alguna cosa et va sobrar, marca-la fàcil: a les 2 vegades seguides surt per pujar.', en: 'If something was too easy, mark it: after 2 in a row it’s flagged to level up.' },
    easy: { es: 'Fácil', ca: 'Fàcil', en: 'Easy' },
    ok: { es: 'Bien', ca: 'Bé', en: 'Good' },
    hard: { es: 'Duro', ca: 'Dur', en: 'Hard' },
  };
  const VOICE_LANG = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  const REPS_EST = 4; // seconds per rep when a reps step has no estSeconds
  const FAILURE_EST = 45; // a to-failure set with no estSeconds

  // ---------- timeline ----------
  function buildTimeline(routine, exercises) {
    const items = [];
    if (routine.prepare) items.push({ kind: 'prep', seconds: routine.prepare });
    routine.blocks.forEach((block, b) => {
      const rounds = block.rounds || 1;
      for (let r = 0; r < rounds; r++) {
        block.steps.forEach((step, s) => {
          const ex = exercises[step.exercise];
          if (!ex) throw new Error(`Unknown exercise ${step.exercise}`);
          const est = step.mode === 'time' ? step.seconds
            : (step.estSeconds || (step.toFailure ? FAILURE_EST : (step.reps || 10) * REPS_EST));
          items.push({ kind: 'work', mode: step.mode, seconds: step.mode === 'time' ? step.seconds : null, est,
            reps: step.reps, toFailure: !!step.toFailure, beeps: step.beeps !== false, weight: !!step.weight, exId: step.exercise, ex, cues: step.cues || [], block, round: r + 1, rounds });
          const lastStep = s === block.steps.length - 1;
          const rest = lastStep && r < rounds - 1 && block.restBetweenRounds != null ? block.restBetweenRounds : step.restAfter;
          if (rest > 0) items.push({ kind: 'rest', seconds: rest });
        });
      }
    });
    while (items.length && items[items.length - 1].kind === 'rest') items.pop(); // no rest after the last set
    items.push({ kind: 'done', seconds: null });
    for (let i = items.length - 1, nextWork = null; i >= 0; i--) { // each prep/rest knows what comes next
      if (items[i].kind === 'work') nextWork = items[i]; else items[i].next = nextWork;
    }
    return items;
  }
  const itemSeconds = (it) => (it.kind === 'work' ? it.est : it.seconds || 0);
  const duration = (items) => items.reduce((a, it) => a + itemSeconds(it), 0);

  // ---------- sound ----------
  let audio = null;
  function beep(freq = 880, ms = 120, vol = 0.25) {
    if (!audio) return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + ms / 1000 + 0.02);
  }

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [];
  const loadVoices = () => { voices = synth ? synth.getVoices() : []; };
  if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }
  function voiceFor(lang) {
    const want = VOICE_LANG[lang], pre = lang;
    return voices.find((v) => v.lang === want) || voices.find((v) => v.lang?.toLowerCase().startsWith(pre))
      || null;
  }
  // Catalan falls back to a Spanish voice (SPEC); the text stays the Catalan line only if a CA voice exists.
  const speechLang = (lang) => (lang === 'ca' && voices.length && !voiceFor('ca') ? 'es' : lang);

  // ---------- wake lock ----------
  let lock = null;
  async function keepAwake() {
    try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); }
    catch { /* low battery or unsupported */ }
  }
  function releaseAwake() { try { lock?.release(); } catch { /* already released */ } lock = null; }

  // ---------- player ----------
  const num = (p, n) => (n ? `<span class="num">${p}${n}</span>` : '');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (sec) => { sec = Math.max(0, Math.round(sec)); return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : String(sec); };
  const fmtLen = (sec) => (sec < 60 ? `${sec} s` : `${Math.round(sec / 60)} min`);

  function open(root, opts) {
    const { routine, exercises, lines, getLang, store, onExit } = opts;
    const L = () => getLang();
    const t = (o) => (o && (o[L()] ?? o.es)) || '';
    const items = buildTimeline(routine, exercises);
    const total = duration(items);
    const lastLine = {};
    const weights = { ...(opts.lastWeights || {}) };
    let idx = -1, endAt = 0, startedAt = 0, pausedLeft = null, fired = new Set(), timer = null, spoken = '';
    let muted = store.get('gym-coach.muted') === '1';
    const doneSet = new Set(); // indices of finished work items (a redone set counts once)
    // End-screen ratings (see SPEC § Level-up marks): one per exercise per session, reported through onFeel.
    const sid = new Date().toISOString(), feels = {};
    const FEELS = [['easy', '😌'], ['ok', '💪'], ['hard', '🥵']];

    // A line is shown in the UI language and spoken in the voice's language (CA falls back to ES, same index).
    const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? '');
    function sayKey(key, vars) {
      const pool = lines?.[key]?.[L()] || lines?.[key]?.es || [];
      if (!pool.length) return;
      let i = Math.floor(Math.random() * pool.length);
      if (pool.length > 1 && i === lastLine[key]) i = (i + 1) % pool.length;
      lastLine[key] = i;
      const vpool = lines[key][speechLang(L())] || pool;
      say(fill(pool[i], vars), fill(vpool[i % vpool.length], vars));
    }
    function say(shown, voiced = shown) {
      if (!shown) return;
      spoken = shown;
      const b = root.querySelector('.bubble'); if (b) b.textContent = shown;
      if (muted || !synth) return;
      const u = new SpeechSynthesisUtterance(voiced);
      const sl = speechLang(L());
      u.lang = VOICE_LANG[sl];
      const v = voiceFor(sl); if (v) u.voice = v;
      u.rate = 1.05; u.pitch = 0.9;
      synth.speak(u);
    }
    const sayL = (o) => say(t(o), (o && o[speechLang(L())]) || t(o)); // a localized object {es,ca,en}

    // ----- rendering -----
    const pose = (it) => (!it ? 'idle' : it.kind === 'work' ? 'work' : it.kind === 'rest' ? 'rest' : it.kind === 'done' ? 'cheer' : 'idle');
    const mascot = (p) => (window.Titan ? window.Titan.svg(p) : '<div class="mascot-fallback">🦾</div>');
    const ring = (frac) => {
      const C = 2 * Math.PI * 54;
      return `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="ring-bg"/>
        <circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>`;
    };
    function renderIntro() {
      const sets = items.filter((i) => i.kind === 'work').length;
      const exIds = [...new Set(items.filter((i) => i.kind === 'work').map((i) => i.exId))];
      const noCa = L() === 'ca' && voices.length && !voiceFor('ca');
      root.innerHTML = `
        <div class="p-top"><button class="icon-btn" data-act="exit" aria-label="${esc(t(TEXT.exit))}">✕</button>
          <span class="p-label">${esc(t(routine.name))}</span><span></span></div>
        <div class="p-stage intro">
          <div class="mascot pose-idle">${mascot('idle')}</div>
          <div class="bubble">${esc(t(routine.summary))}</div>
          <h2 class="p-title">${num('R', routine.n)}${esc(t(routine.name))}</h2>
          ${routine.subtitle ? `<p class="p-meta sub">${esc(t(routine.subtitle))}</p>` : ''}
          <p class="p-meta">${esc(t(TEXT.total))}: <b>${fmtLen(total)}</b> · ${esc(t(TEXT.steps))}: <b>${sets}</b></p>
          <ul class="p-list">${exIds.map((id) => `<li>${num('E', exercises[id].n)}${esc(t(exercises[id].name))}</li>`).join('')}</ul>
          <p class="p-hint">🔊 ${esc(t(TEXT.voiceHint))}${noCa ? `<br>${esc(TEXT.noCaVoice.ca)}` : ''}</p>
        </div>
        <div class="p-controls"><button class="btn big go" data-act="start">▶ ${esc(t(TEXT.start))}</button></div>`;
    }
    function feelList() {
      const ids = [...new Set([...doneSet].map((i) => items[i].exId))];
      if (!ids.length || !opts.onFeel) return '';
      return `<section class="feel"><h3>${esc(t(TEXT.feelAsk))}</h3><p class="p-hint">${esc(t(TEXT.feelHint))}</p>
        <ul>${ids.map((id) => `<li><span class="f-name">${num('E', exercises[id].n)}${esc(t(exercises[id].name))}</span>
          <span class="f-btns">${FEELS.map(([v, e]) => `<button type="button" data-act="feel" data-ex="${esc(id)}" data-v="${v}"
            class="${feels[id] === v ? 'on' : ''}" aria-pressed="${feels[id] === v}">${e}<small>${esc(t(TEXT[v]))}</small></button>`).join('')}</span></li>`).join('')}</ul></section>`;
    }
    function renderItem() {
      const it = items[idx];
      const workIdx = items.slice(0, idx + 1).filter((i) => i.kind === 'work').length;
      const sets = items.filter((i) => i.kind === 'work').length;
      const shown = it.kind === 'work' ? it : it.next;
      const label = shown && shown.kind === 'work'
        ? `${t(shown.block.name)} · ${t(TEXT.round)} ${shown.round}/${shown.rounds}` : t(routine.name);
      let center = '';
      if (it.kind === 'done') {
        center = `<h2 class="p-title">${esc(t(TEXT.done))}</h2>
          <p class="p-meta">${esc(t(TEXT.summary))}: <b>${doneSet.size}/${sets}</b></p>
          ${feelList()}`;
      } else if (it.kind === 'work' && it.mode === 'reps') {
        center = `<div class="p-phase">${esc(t(TEXT.work))}</div>
          <h2 class="p-title">${num('E', it.ex.n)}${esc(t(it.ex.name))}</h2>
          ${it.toFailure ? `<div class="reps-target fail">${esc(t(TEXT.toFailure))}<small>${esc(t(TEXT.toFailureHint))}</small></div>`
            : `<div class="reps-target"><b>${it.reps}</b> ${esc(t(TEXT.reps))}</div>`}
          ${it.weight ? `<label class="weight">${esc(t(TEXT.weight))}
            <input type="number" inputmode="decimal" min="0" step="0.5" data-weight value="${weights[it.exId] ?? ''}"> ${esc(t(TEXT.kg))}</label>` : ''}
          <button class="btn big go" data-act="done">✔ ${esc(t(TEXT.finished))}</button>`;
      } else {
        const name = it.kind === 'work' ? t(it.ex.name) : it.next ? `${t(TEXT.next)}: ${t(it.next.ex.name)}` : '';
        const nameEx = it.kind === 'work' ? it.ex : it.next?.ex;
        center = `<div class="p-phase">${esc(t(TEXT[it.kind]))}</div>
          <div class="timer">${ring(1)}<span class="secs">${fmt(it.seconds)}</span></div>
          <h2 class="p-title small">${name && nameEx ? num('E', nameEx.n) : ''}${esc(name)}</h2>`;
      }
      root.innerHTML = `
        <div class="p-top"><button class="icon-btn" data-act="exit" aria-label="${esc(t(TEXT.exit))}">✕</button>
          <span class="p-label">${esc(label)}</span>
          <button class="icon-btn ${muted ? 'off' : ''}" data-act="mute" aria-pressed="${!muted}" aria-label="${esc(t(TEXT.mute))}">${muted ? '🔇' : '🔊'}</button></div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${sets}" aria-valuenow="${workIdx}"><i style="width:${(idx / (items.length - 1)) * 100}%"></i></div>
        <div class="p-stage kind-${it.kind}${it.kind === 'done' && doneSet.size ? ' scroll' : ''}">
          <div class="mascot pose-${pose(it)}">${mascot(pose(it))}</div>
          <div class="bubble">${esc(spoken)}</div>
          ${center}
        </div>
        <div class="p-controls">${it.kind === 'done'
          ? `<button class="btn big go" data-act="exit">${esc(t(TEXT.back))}</button>`
          : `<button class="icon-btn lg" data-act="prev" aria-label="${esc(t(TEXT.prev))}">⏮</button>
             <button class="icon-btn lg" data-act="pause" aria-label="${esc(t(pausedLeft != null ? TEXT.resume : TEXT.pause))}">${pausedLeft != null ? '▶' : '⏸'}</button>
             <button class="icon-btn lg" data-act="skip" aria-label="${esc(t(TEXT.skip))}">⏭</button>`}</div>`;
      root.classList.toggle('is-paused', pausedLeft != null);
    }

    // ----- engine -----
    function enter(i, from = Date.now()) {
      idx = i; fired = new Set();
      const it = items[idx];
      endAt = it.seconds ? from + it.seconds * 1000 : 0;
      startedAt = from;
      const live = !it.seconds || Date.now() < endAt; // false while catching up after the page was hidden
      if (live) {
        renderItem();
        if (it.kind === 'prep') { if (it.seconds >= 15) sayKey('start'); sayKey('prep', { name: it.next ? t(it.next.ex.name) : '' }); }
        else if (it.kind === 'work') {
          beep(1320, 380);
          if (it.mode === 'reps') { if (it.toFailure) say(t(TEXT.toFailureHint)); else sayKey('repsGo', { reps: it.reps }); }
          else if (!it.cues.length) sayKey('go'); // authored cues replace the generic lines
        } else if (it.kind === 'rest') {
          beep(660, 380);
          const prevWork = items.slice(0, idx).reverse().find((x) => x.kind === 'work');
          if (prevWork && prevWork.round === prevWork.rounds && it.next && it.next.block !== prevWork.block) sayKey('roundDone');
          else sayKey('rest');
          if (it.next) sayKey('nextUp', { name: t(it.next.ex.name) });
          const tips = it.next?.ex.cues;
          const n = tips ? Math.floor(Math.random() * (tips.es || []).length) : -1;
          if (it.seconds >= 25 && n >= 0) sayL(Object.fromEntries(Object.entries(tips).map(([k, v]) => [k, v[n % v.length]])));
        } else if (it.kind === 'done') finish();
      }
      return live;
    }
    // counted: the set was finished (its time ran out or Done was tapped), not skipped.
    function advance(fromEnd, counted = fromEnd) {
      const it = items[idx];
      if (it.kind === 'work' && counted) doneSet.add(idx);
      if (idx < items.length - 1) enter(idx + 1, fromEnd ? endAt : Date.now());
    }
    function tick() {
      if (idx < 0 || pausedLeft != null) return;
      let it = items[idx];
      // Catch up: steps that ended while the page was hidden are passed silently, keeping the clock continuous.
      while (it.seconds && Date.now() >= endAt && it.kind !== 'done') { advance(true); it = items[idx]; }
      if (!it.seconds) { talkAnim(); return; }
      const left = (endAt - Date.now()) / 1000, elapsed = it.seconds - left, secs = Math.ceil(left);
      const s = root.querySelector('.secs'); if (s) s.textContent = fmt(secs);
      const fg = root.querySelector('.ring-fg');
      if (fg) fg.setAttribute('stroke-dashoffset', String(2 * Math.PI * 54 * (1 - left / it.seconds)));
      const once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
      if (it.kind === 'work') {
        // A timed cue cuts off whatever is still being said, so the voice stays on the clock.
        it.cues.forEach((c, n) => { if (elapsed >= c.at) once(`c${n}`, () => { if (!muted) synth?.cancel(); sayL(c.text); }); });
        if (!it.cues.length && it.seconds >= 20 && elapsed >= it.seconds / 2) once('half', () => sayKey('halfway'));
        if (!it.cues.length && it.seconds >= 12 && secs === 6) once('last', () => sayKey('last3'));
      }
      if (secs <= 3 && secs >= 1 && (it.kind !== 'work' || it.beeps)) once(`b${secs}`, () => beep(880, 120));
      talkAnim();
    }
    function talkAnim() {
      const m = root.querySelector('.mascot');
      if (m) m.classList.toggle('talking', !!synth?.speaking && !muted);
    }
    function finish() {
      releaseAwake();
      setTimeout(() => { sayKey('finish'); const f = spoken; sayKey('motto'); spoken = `${f} ${spoken}`; const b = root.querySelector('.bubble'); if (b) b.textContent = spoken; }, 300);
      opts.onFinish?.({ done: true, steps: doneSet.size, total: items.filter((i) => i.kind === 'work').length, weights });
      logged = true;
    }
    let logged = false;
    // quiet: closed by the app (route change), so don't call onExit, which would navigate.
    function close(quiet = false) {
      clearInterval(timer); timer = null; synth?.cancel(); releaseAwake();
      document.removeEventListener('visibilitychange', onVis);
      if (!logged && doneSet.size > 0) opts.onFinish?.({ done: false, steps: doneSet.size, total: items.filter((i) => i.kind === 'work').length, weights });
      if (!quiet) onExit?.();
    }
    function onVis() {
      if (document.visibilityState === 'visible' && idx >= 0 && items[idx].kind !== 'done') { keepAwake(); tick(); }
    }

    root.onclick = (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'start') {
        // The gesture gate: everything that needs a user tap happens here.
        try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch { audio = null; }
        if (synth) { synth.cancel(); synth.speak(Object.assign(new SpeechSynthesisUtterance(' '), { volume: 0 })); }
        keepAwake();
        document.addEventListener('visibilitychange', onVis);
        timer = setInterval(tick, 200);
        enter(0);
      } else if (act === 'exit') {
        if (idx >= 0 && items[idx].kind !== 'done' && !confirm(t(TEXT.exitAsk))) return;
        close();
      } else if (act === 'feel') {
        const { ex, v } = b.dataset;
        feels[ex] = feels[ex] === v ? null : v; // a second tap clears it
        opts.onFeel?.(ex, feels[ex], sid);
        b.parentElement.querySelectorAll('button').forEach((x) => { const on = x.dataset.v === feels[ex]; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      } else if (act === 'mute') {
        muted = !muted; store.set('gym-coach.muted', muted ? '1' : '0');
        if (muted) synth?.cancel();
        renderItem();
      } else if (act === 'pause') {
        if (pausedLeft == null) { pausedLeft = endAt ? endAt - Date.now() : 0; synth?.cancel(); sayKey('paused'); }
        else { if (endAt) endAt = Date.now() + pausedLeft; pausedLeft = null; }
        renderItem();
      } else if (act === 'skip' || act === 'done') {
        const w = root.querySelector('[data-weight]');
        if (w && w.value !== '') weights[items[idx].exId] = Number(w.value);
        synth?.cancel(); pausedLeft = null;
        if (act === 'done') sayKey('repsDone');
        advance(false, act === 'done');
      } else if (act === 'prev') {
        let i = idx - 1; while (i > 0 && items[i].kind !== 'work') i--;
        if (items[idx].kind === 'work' && Date.now() - startedAt > 3000) i = idx; // restart the current set first
        synth?.cancel(); pausedLeft = null; enter(Math.max(0, i));
      }
    };
    root.addEventListener('input', (e) => {
      if (e.target.matches('[data-weight]') && e.target.value !== '') weights[items[idx].exId] = Number(e.target.value);
    });
    renderIntro();
    return { close, rerender: () => (idx < 0 ? renderIntro() : renderItem()) };
  }

  window.Player = { open, buildTimeline, duration, fmtLen };
})();
