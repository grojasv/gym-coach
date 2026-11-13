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
    rep: { es: 'rep', ca: 'rep', en: 'rep' },
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
    to: { es: 'a', ca: 'a', en: 'to' },
    rangeHint: { es: '¿{max} en todas las series? La próxima, baja en 3 segundos.', ca: '{max} a totes les sèries? La propera, baixa en 3 segons.', en: '{max} in every set? Next time, lower in 3 seconds.' },
    weightOnce: { es: 'El mismo para todo el entreno', ca: 'El mateix per a tot l’entrenament', en: 'The same for the whole workout' },
    setUp: { es: 'Prepara', ca: 'Prepara', en: 'Set up' },
    putAway: { es: 'Recoge', ca: 'Recull', en: 'Put away' },
    note: { es: 'Apuntar una nota', ca: 'Apunta una nota', en: 'Write a note' },
    noteTitle: { es: 'Nota para mejorar', ca: 'Nota per millorar', en: 'Note to improve' },
    noteHint: { es: 'Se guarda en Notas, en el hub, para pasármela luego.', ca: 'Es desa a Notes, al hub, per passar-me-la després.', en: 'Saved in Notes, on the hub, to send me later.' },
    notePh: { es: 'Opcional: qué cambiarías', ca: 'Opcional: què canviaries', en: 'Optional: what you would change' },
    save: { es: 'Guardar', ca: 'Desa', en: 'Save' },
    cancel: { es: 'Cancelar', ca: 'Cancel·la', en: 'Cancel' },
    saved: { es: 'Nota guardada.', ca: 'Nota desada.', en: 'Note saved.' },
    short: { es: 'Corto', ca: 'Curt', en: 'Too short' },
    long: { es: 'Largo', ca: 'Llarg', en: 'Too long' },
    feelAsk: { es: '¿Cómo te ha ido cada ejercicio?', ca: 'Com t’ha anat cada exercici?', en: 'How did each exercise feel?' },
    feelHint: { es: 'Si algo te sobró, márcalo fácil: a las 2 veces seguidas sale para subir.', ca: 'Si alguna cosa et va sobrar, marca-la fàcil: a les 2 vegades seguides surt per pujar.', en: 'If something was too easy, mark it: after 2 in a row it’s flagged to level up.' },
    easy: { es: 'Fácil', ca: 'Fàcil', en: 'Easy' },
    ok: { es: 'Bien', ca: 'Bé', en: 'Good' },
    hard: { es: 'Duro', ca: 'Dur', en: 'Hard' },
    info: { es: 'Ver cómo se hace', ca: 'Mira com es fa', en: 'See how it’s done' },
    close: { es: 'Cerrar', ca: 'Tanca', en: 'Close' },
  };
  const VOICE_LANG = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  const REPS_EST = 4; // seconds per rep when a reps step has no estSeconds
  const FAILURE_EST = 45; // a to-failure set with no estSeconds
  // Speech pacing (SPEC § Cue rules). sayTime is the same estimate validate.mjs uses: conservative, in seconds.
  const sayTime = (text) => 0.5 + String(text).trim().split(/\s+/).length / 2.2;
  const TIP_GAP = 8; // seconds of silence before El Titán adds an exercise tip during a set

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
            reps: step.reps, repsMax: step.repsMax, toFailure: !!step.toFailure, beeps: step.beeps !== false, weight: !!step.weight, exId: step.exercise, ex, cues: step.cues || [], block, round: r + 1, rounds });
          const lastStep = s === block.steps.length - 1;
          const rest = lastStep && r < rounds - 1 && block.restBetweenRounds != null ? block.restBetweenRounds : step.restAfter;
          if (rest > 0) items.push({ kind: 'rest', seconds: rest });
        });
      }
    });
    while (items.length && items[items.length - 1].kind === 'rest') items.pop(); // no rest after the last set
    items.push({ kind: 'done', seconds: null });
    // Stations (SPEC § Player): "set up" on the prep/rest before a station's first use, "put away" after its last use.
    const STATION = window.Detail?.STATION || {};
    const work = items.map((it, i) => [it, i]).filter(([it]) => it.kind === 'work');
    work.forEach(([it]) => { it.station = STATION[it.ex.equipment[0]] || null; });
    const where = (i) => (items[i] && items[i].kind !== 'done' ? items[i] : null);
    [...new Set(work.map(([it]) => it.station).filter(Boolean))].forEach((st) => {
      const uses = work.filter(([it]) => it.station === st).map(([, i]) => i);
      const before = items[uses[0] - 1], at = before && before.kind !== 'work' ? before : items[uses[0]];
      (at.setUp ||= []).push(st);
      const after = where(uses[uses.length - 1] + 1);
      if (after) (after.putAway ||= []).push(st);
    });
    // One pair of dumbbells, one weight: asked on the first weighted set (and on the rest that sets the dumbbells up).
    const firstKg = items.findIndex((it) => it.kind === 'work' && it.weight);
    if (firstKg >= 0) { items[firstKg].askKg = true; if (items[firstKg - 1]?.kind !== 'work' && items[firstKg - 1]) items[firstKg - 1].askKg = true; }
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
    let kg = opts.lastKg ?? ''; // the one dumbbell weight for this session
    // busyUntil: when the voice should be done with what it was given (estimated, since speechSynthesis.speaking is
    // unreliable on Android). Tips only go into the silence after it.
    // queue: lines a step says on entry (rest, next up, set up, put away, reps target). They are said one at a time when
    // the voice is free, and dropped if they no longer fit before the countdown or the next cue (the screen shows them).
    let queue = [], queuing = false;
    let busyUntil = 0, tipsSaid = 0; // tipsSaid: tips said in the current set (one pass through the list per set)
    const tipNext = {}; // exercise id -> index of its next tip, so back-to-back sets move on through the list
    let idx = -1, endAt = 0, repEnd = 0, startedAt = 0, pausedLeft = null, fired = new Set(), timer = null, spoken = '';
    let muted = store.get('gym-coach.muted') === '1';
    let infoId = null; // the exercise whose explanation is open over the player (see infoOverlay)
    let noteOpen = false, noteResume = false, noteTag = null; // the 📝 overlay (see noteOverlay)
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
      if (queuing) { queue.push([shown, voiced]); return; }
      spoken = shown;
      busyUntil = Math.max(busyUntil, Date.now()) + sayTime(voiced) * 1000; // queued lines play one after the other
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
    function hush() { synth?.cancel(); busyUntil = 0; }

    // ----- rendering -----
    const pose = (it) => (!it ? 'idle' : it.kind === 'work' ? 'work' : it.kind === 'rest' ? 'rest' : it.kind === 'done' ? 'champ' : 'idle');
    const mascot = (p) => (window.Titan ? window.Titan.svg(p) : '<div class="mascot-fallback">🦾</div>');
    const ring = (frac) => {
      const C = 2 * Math.PI * 54;
      return `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="ring-bg"/>
        <circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>`;
    };
    // An exercise name that opens its explanation (Detail.html) in an overlay; the timer pauses while it is open.
    const exName = (id, label, prefix = '') => `<button type="button" class="p-name" data-act="info" data-ex="${esc(id)}"
      aria-label="${esc(`${t(TEXT.info)}: ${t(exercises[id].name)}`)}">${prefix}${num('E', exercises[id].n)}${esc(label)} <i aria-hidden="true">ⓘ</i></button>`;
    function infoOverlay() {
      const ex = infoId && exercises[infoId];
      if (!ex || !window.Detail) return '';
      return `<div class="p-info" role="dialog" aria-modal="true" aria-labelledby="p-info-title">
        <div class="p-info-top"><button type="button" class="icon-btn" data-act="info-close" aria-label="${esc(t(TEXT.close))}">✕</button></div>
        <article class="card detail">${window.Detail.html(ex, L(), { titleId: 'p-info-title' })}</article>
        <button type="button" class="btn big" data-act="info-close">${esc(t(TEXT.close))}</button></div>`;
    }
    function showInfo() {
      root.querySelector('.p-info')?.remove();
      if (!infoId) return;
      root.insertAdjacentHTML('beforeend', infoOverlay());
      root.querySelector('.p-info [data-act="info-close"]')?.focus();
    }
    const STN = (st) => t(window.Detail?.STATION_NAME?.[st]) || st;
    const kgField = () => `<label class="weight">${esc(t(TEXT.weight))}
      <input type="number" inputmode="decimal" min="0" step="0.5" data-weight value="${esc(kg)}"> ${esc(t(TEXT.kg))}<small>${esc(t(TEXT.weightOnce))}</small></label>`;
    const equipLine = (it) => (it.setUp || it.putAway ? `<p class="p-equip">${(it.putAway || []).map((st) => `<span>📦 ${esc(t(TEXT.putAway))} ${esc(STN(st))}</span>`).join('')}${(it.setUp || []).map((st) => `<span>🧰 ${esc(t(TEXT.setUp))} ${esc(STN(st))}</span>`).join('')}</p>` : '');
    const noteTags = (it) => (it.kind === 'work' ? ['easy', 'hard'] : it.kind === 'rest' ? ['short', 'long'] : []);
    function noteOverlay() {
      const it = items[idx];
      if (!noteOpen || !it) return '';
      return `<div class="p-info p-note" role="dialog" aria-modal="true" aria-labelledby="p-note-title">
        <article class="card detail"><h2 id="p-note-title">📝 ${esc(t(TEXT.noteTitle))}</h2>
          <p class="p-hint">${esc(noteContext(it))}</p>
          ${noteTags(it).length ? `<p class="note-tags">${noteTags(it).map((v) => `<button type="button" data-act="note-tag" data-v="${v}" class="${noteTag === v ? 'on' : ''}" aria-pressed="${noteTag === v}">${esc(t(TEXT[v]))}</button>`).join('')}</p>` : ''}
          <textarea data-note rows="3" placeholder="${esc(t(TEXT.notePh))}"></textarea>
          <p class="p-hint">${esc(t(TEXT.noteHint))}</p></article>
        <div class="note-btns"><button type="button" class="btn" data-act="note-cancel">${esc(t(TEXT.cancel))}</button>
          <button type="button" class="btn go" data-act="note-save">${esc(t(TEXT.save))}</button></div></div>`;
    }
    const prevWorkOf = (i) => items.slice(0, i).reverse().find((x) => x.kind === 'work');
    function noteContext(it) {
      const ex = it.kind === 'work' ? it : it.next;
      const name = ex ? `${ex.ex.n ? `E${ex.ex.n} ` : ''}${t(ex.ex.name)}` : '';
      if (it.kind === 'rest') return `${t(TEXT.rest)} ${it.seconds} s · ${t(TEXT.next)}: ${name}`;
      if (it.kind === 'prep') return `${t(TEXT.prep)} · ${name}`;
      return `${name} · ${t(TEXT.round)} ${it.round}/${it.rounds}`;
    }
    function showNote() {
      root.querySelector('.p-note')?.remove();
      if (!noteOpen) return;
      root.insertAdjacentHTML('beforeend', noteOverlay());
    }
    function closeNote(save) {
      const it = items[idx];
      if (save) {
        const text = (root.querySelector('[data-note]')?.value || '').trim();
        if (text || noteTag) {
          const ex = it.kind === 'work' ? it : it.next, prev = it.kind === 'rest' ? prevWorkOf(idx) : null;
          opts.onNote?.({ at: new Date().toISOString(), routine: routine.id, kind: it.kind, ex: ex?.exId || null, prev: prev?.exId || null,
            seconds: it.kind === 'work' ? (it.seconds || it.est) : it.seconds, round: (ex || {}).round, rounds: (ex || {}).rounds,
            block: ex ? t(ex.block.name) : '', tag: noteTag, text });
          // Fácil / Duro mid-workout is the same rating as the end screen (same session), so it never counts twice.
          if (it.kind === 'work' && noteTag) { feels[it.exId] = noteTag; opts.onFeel?.(it.exId, noteTag, sid); }
          spoken = t(TEXT.saved);
        }
      }
      noteOpen = false; noteTag = null;
      if (noteResume) { resume(); noteResume = false; }
      renderItem();
    }
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
          <ul class="p-list">${exIds.map((id) => `<li>${exName(id, t(exercises[id].name))}</li>`).join('')}</ul>
          <p class="p-hint">🔊 ${esc(t(TEXT.voiceHint))}${noCa ? `<br>${esc(TEXT.noCaVoice.ca)}` : ''}</p>
        </div>
        <div class="p-controls"><button class="btn big go" data-act="start">▶ ${esc(t(TEXT.start))}</button></div>`;
      showInfo();
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
        center = `<div class="p-phase">${esc(t(TEXT.work))} · <span class="rep-clock">⏱ <span class="rsecs">${repLeft()}</span></span></div>
          <h2 class="p-title">${exName(it.exId, t(it.ex.name))}</h2>
          ${it.toFailure ? `<div class="reps-target fail">${esc(t(TEXT.toFailure))}<small>${esc(t(TEXT.toFailureHint))}</small></div>`
            : `<div class="reps-target"><b>${it.reps}${it.repsMax ? `–${it.repsMax}` : ''}</b> ${esc(t(it.reps === 1 && !it.repsMax ? TEXT.rep : TEXT.reps))}${it.repsMax
              ? `<small>${esc(t(TEXT.rangeHint).replace('{max}', it.repsMax))}</small>` : ''}</div>`}
          ${it.askKg ? kgField() : ''}
          <button class="btn big go" data-act="done">✔ ${esc(t(TEXT.finished))}</button>`;
      } else {
        const nameIt = it.kind === 'work' ? it : it.next;
        // Time left, so a re-render while paused (pause, info overlay, mute) shows where the clock stopped.
        const left = Math.min(it.seconds, Math.max(0, (pausedLeft != null ? pausedLeft : endAt - Date.now()) / 1000));
        center = `<div class="p-phase">${esc(t(TEXT[it.kind]))}</div>
          <div class="timer">${ring(left / it.seconds)}<span class="secs">${fmt(Math.ceil(left))}</span></div>
          <h2 class="p-title small">${nameIt ? exName(nameIt.exId, t(nameIt.ex.name), it.kind === 'work' ? '' : `${esc(t(TEXT.next))}: `) : ''}</h2>
          ${it.kind !== 'work' ? equipLine(it) : ''}${it.kind !== 'work' && it.askKg ? kgField() : ''}`;
      }
      root.innerHTML = `
        <div class="p-top"><button class="icon-btn" data-act="exit" aria-label="${esc(t(TEXT.exit))}">✕</button>
          <span class="p-label">${esc(label)}</span>
          ${it.kind !== 'done' ? `<button class="icon-btn" data-act="note" aria-label="${esc(t(TEXT.note))}">📝</button>` : ''}
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
      showInfo(); showNote();
    }
    // A reps set has a target time too (its estimate): it counts down, then up as overtime. Only Done moves on.
    function repLeft() {
      const left = (pausedLeft != null ? pausedLeft : repEnd - Date.now()) / 1000;
      return left >= 0 ? fmt(Math.ceil(left)) : `+${fmt(Math.floor(-left))}`;
    }

    // ----- engine -----
    function enter(i, from = Date.now()) {
      idx = i; fired = new Set(); tipsSaid = 0; queue = [];
      const it = items[idx];
      endAt = it.seconds ? from + it.seconds * 1000 : 0;
      repEnd = it.kind === 'work' && it.mode === 'reps' ? from + it.est * 1000 : 0;
      startedAt = from;
      const live = !it.seconds || Date.now() < endAt; // false while catching up after the page was hidden
      if (live) {
        renderItem();
        queuing = true; // everything said below goes to the queue (finish() speaks later, outside it)
        const equip = () => { (it.putAway || []).forEach((st) => sayKey('equipAway', { x: STN(st) })); (it.setUp || []).forEach((st) => sayKey('equipSet', { x: STN(st) })); };
        if (it.kind === 'prep') { if (it.seconds >= 15) sayKey('start'); sayKey('prep', { name: it.next ? t(it.next.ex.name) : '' }); equip(); }
        else if (it.kind === 'work') {
          beep(1320, 380);
          equip();
          if (it.mode === 'reps') { if (it.toFailure) say(t(TEXT.toFailureHint)); else if (it.reps === 1 && !it.repsMax && lines?.repsOne) sayKey('repsOne');
            else sayKey('repsGo', { reps: it.repsMax ? `${it.reps} ${t(TEXT.to)} ${it.repsMax}` : it.reps }); }
          else if (!it.cues.length) sayKey('go'); // authored cues replace the generic lines
        } else if (it.kind === 'rest') {
          beep(660, 380);
          const prevWork = items.slice(0, idx).reverse().find((x) => x.kind === 'work');
          if (prevWork && prevWork.round === prevWork.rounds && it.next && it.next.block !== prevWork.block) sayKey('roundDone');
          else sayKey('rest');
          equip();
          if (it.next) sayKey('nextUp', { name: t(it.next.ex.name) });
          const tips = it.next?.ex.cues;
          const n = tips ? Math.floor(Math.random() * (tips.es || []).length) : -1;
          if (it.seconds >= 25 && n >= 0) sayL(Object.fromEntries(Object.entries(tips).map(([k, v]) => [k, v[n % v.length]])));
        } else if (it.kind === 'done') finish();
        queuing = false;
        if (!(it.kind === 'work' && it.seconds)) drain(); // a timed set says its first cue first (tick)
      }
      return live;
    }
    // Seconds the voice has before it must be quiet: the 3-2-1 countdown of a prep or rest, a timed set's next authored
    // cue or countdown. A reps set and the end screen have no limit.
    function room() {
      const it = items[idx], now = Date.now();
      if (!it.seconds) return Infinity;
      const el = it.seconds - (endAt - now) / 1000;
      if (it.kind !== 'work') return it.seconds - 3 - el;
      const next = it.cues.find((c, n) => !fired.has(`c${n}`))?.at ?? (it.beeps ? it.seconds - 3 : it.seconds);
      return next - el;
    }
    function drain() {
      while (queue.length && Date.now() >= busyUntil) {
        const [shown, voiced] = queue.shift();
        if (sayTime(voiced) <= room()) say(shown, voiced);
      }
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
      const once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
      // Catch up: steps that ended while the page was hidden are passed silently, keeping the clock continuous.
      while (it.seconds && Date.now() >= endAt && it.kind !== 'done') { advance(true); it = items[idx]; }
      if (!it.seconds) {
        drain();
        if (repEnd && !queue.length) {
          maybeTip(it, (repEnd - Date.now()) / 1000); // no tips once the target time has passed
          const s = root.querySelector(".rsecs"); if (s) s.textContent = repLeft();
          const over = Date.now() >= repEnd;
          root.querySelector('.rep-clock')?.classList.toggle('over', over);
          if (over) once('repEnd', () => beep(660, 250));
        }
        talkAnim(); return;
      }
      const left = (endAt - Date.now()) / 1000, elapsed = it.seconds - left, secs = Math.ceil(left);
      const s = root.querySelector('.secs'); if (s) s.textContent = fmt(secs);
      const fg = root.querySelector('.ring-fg');
      if (fg) fg.setAttribute('stroke-dashoffset', String(2 * Math.PI * 54 * (1 - left / it.seconds)));
      if (it.kind === 'work') {
        // Only the latest due cue is said, so a page that was hidden doesn't fire a burst. The first cue cuts off what is
        // left from the rest; later ones fit by validate.mjs's speech rule, so they never cut each other off.
        let due = -1;
        it.cues.forEach((c, n) => { if (elapsed >= c.at && !fired.has(`c${n}`)) due = n; });
        if (due >= 0) { for (let n = 0; n <= due; n++) fired.add(`c${n}`); if (due === 0) hush(); sayL(it.cues[due].text); }
        drain();
        if (!queue.length) maybeTip(it, room());
        if (!it.cues.length && it.seconds >= 20 && elapsed >= it.seconds / 2) once('half', () => sayKey('halfway'));
        if (!it.cues.length && it.seconds >= 12 && secs === 6) once('last', () => sayKey('last3'));
      } else drain(); // prep and rest
      if (secs <= 3 && secs >= 1 && (it.kind !== 'work' || it.beeps)) once(`b${secs}`, () => beep(880, 120));
      talkAnim();
    }
    // An exercise tip from its own list (the posture cues in exercises.json) when the voice has been quiet for TIP_GAP
    // and the tip fits before the next authored cue, the countdown or the reps target time. Long sets get more tips,
    // up to one pass through the list per set.
    function maybeTip(it, room) {
      const now = Date.now();
      const tips = it.ex.cues?.es;
      if (!tips?.length || tipsSaid >= tips.length || now < busyUntil + TIP_GAP * 1000) return;
      const n = (tipNext[it.exId] || 0) % tips.length;
      const tip = Object.fromEntries(Object.entries(it.ex.cues).map(([k, v]) => [k, v[n % v.length]]));
      if (sayTime(tip[speechLang(L())] || tip.es) + 1 > room) return;
      tipNext[it.exId] = n + 1; tipsSaid++;
      sayL(tip);
    }
    function talkAnim() {
      const m = root.querySelector('.mascot');
      if (m) m.classList.toggle('talking', !!synth?.speaking && !muted);
    }
    function finish() {
      releaseAwake();
      setTimeout(() => { sayKey('finish'); const f = spoken; sayKey('motto'); spoken = `${f} ${spoken}`; const b = root.querySelector('.bubble'); if (b) b.textContent = spoken; }, 300);
      opts.onFinish?.({ done: true, steps: doneSet.size, total: items.filter((i) => i.kind === 'work').length, weights: weights() });
      logged = true;
    }
    let logged = false;
    // The log keeps a weight per exercise (older entries do too); with one pair of dumbbells they all share kg.
    function weights() {
      if (kg === '' || kg == null) return {};
      const w = { dumbbells: Number(kg) };
      doneSet.forEach((i) => { if (items[i].weight) w[items[i].exId] = Number(kg); });
      return w;
    }
    // quiet: closed by the app (route change), so don't call onExit, which would navigate.
    function close(quiet = false) {
      clearInterval(timer); timer = null; hush(); releaseAwake();
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('keydown', onKey);
      if (!logged && doneSet.size > 0) opts.onFinish?.({ done: false, steps: doneSet.size, total: items.filter((i) => i.kind === 'work').length, weights: weights() });
      if (!quiet) onExit?.();
    }
    function onVis() {
      if (document.visibilityState === 'visible' && idx >= 0 && items[idx].kind !== 'done') { keepAwake(); tick(); }
    }

    function pause() { pausedLeft = endAt ? endAt - Date.now() : repEnd ? repEnd - Date.now() : 0; hush(); }
    function resume() {
      if (endAt) endAt = Date.now() + pausedLeft; else if (repEnd) repEnd = Date.now() + pausedLeft;
      pausedLeft = null; busyUntil = Date.now(); // a tip waits TIP_GAP after a resume instead of firing at once
    }
    const running = () => idx >= 0 && items[idx].kind !== 'done' && pausedLeft == null;
    // Closes the ⓘ or 📝 overlay if one is open (the app calls it on the phone's back button).
    function closeOverlay() {
      if (noteOpen) { closeNote(false); return true; }
      if (infoId) { infoId = null; showInfo(); return true; }
      return false;
    }
    function onKey(e) { if (e.key === 'Escape') closeOverlay(); }
    document.addEventListener('keydown', onKey);
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
        if (muted) hush();
        renderItem();
      } else if (act === 'pause') {
        if (pausedLeft == null) { pause(); sayKey('paused'); } else resume();
        renderItem();
      } else if (act === 'info') {
        // Opening the explanation pauses a running set or rest (same mechanism as the pause button), quietly.
        const wasRunning = running();
        if (wasRunning) pause();
        infoId = b.dataset.ex;
        if (wasRunning) renderItem(); else showInfo();
      } else if (act === 'info-close') {
        infoId = null; showInfo();
        root.querySelector('[data-act="pause"], [data-act="start"]')?.focus();
      } else if (act === 'note') {
        noteResume = running();
        if (noteResume) pause();
        noteOpen = true; noteTag = null; renderItem();
        root.querySelector('[data-note]')?.focus({ preventScroll: true });
      } else if (act === 'note-tag') {
        noteTag = noteTag === b.dataset.v ? null : b.dataset.v;
        b.parentElement.querySelectorAll('button').forEach((x) => { const on = x.dataset.v === noteTag; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      } else if (act === 'note-save' || act === 'note-cancel') {
        closeNote(act === 'note-save');
      } else if (act === 'skip' || act === 'done') {
        hush(); pausedLeft = null;
        if (act === 'done') sayKey('repsDone');
        advance(false, act === 'done');
      } else if (act === 'prev') {
        let i = idx - 1; while (i > 0 && items[i].kind !== 'work') i--;
        if (items[idx].kind === 'work' && Date.now() - startedAt > 3000) i = idx; // restart the current set first
        hush(); pausedLeft = null; enter(Math.max(0, i));
      }
    };
    root.addEventListener('input', (e) => {
      if (e.target.matches('[data-weight]')) kg = e.target.value;
    });
    renderIntro();
    return { close, closeOverlay, isActive: () => idx >= 0 && items[idx].kind !== 'done', rerender: () => (idx < 0 ? renderIntro() : renderItem()) };
  }

  const exitAsk = () => { const l = document.documentElement.lang; return TEXT.exitAsk[l] || TEXT.exitAsk.es; };
  window.Player = { open, buildTimeline, duration, fmtLen, exitAsk };
})();
