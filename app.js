// Gym Coach: the hub (routines, exercise library, history) and the shell (languages, install, footer).
// No build step; data in data/*.json; the player lives in player.js and El Titán in mascot.js.
(() => {
  const VERSION = '0.8.0'; // keep in sync with CHANGELOG.md
  const LANGS = ['es', 'ca', 'en'];
  const LOG_KEY = 'gym-coach.log';
  const FEEL_KEY = 'gym-coach.feel';
  const EASY_IN_A_ROW = 2; // an exercise marked easy this many times in a row is a level-up candidate

  const TEXT = {
    routines: { es: 'Rutinas', ca: 'Rutines', en: 'Routines' },
    library: { es: 'Ejercicios', ca: 'Exercicis', en: 'Exercises' },
    history: { es: 'Historial', ca: 'Historial', en: 'History' },
    noHistory: { es: 'Aún no hay entrenos. ¡El ring te espera!', ca: 'Encara no hi ha entrenaments. El ring t’espera!', en: 'No workouts yet. The ring is waiting!' },
    play: { es: 'Entrenar', ca: 'Entrena', en: 'Train' },
    sets: { es: 'series', ca: 'sèries', en: 'sets' },
    set: { es: 'serie', ca: 'sèrie', en: 'set' },
    last: { es: 'Última vez', ca: 'Última vegada', en: 'Last time' },
    back: { es: '‹ Volver', ca: '‹ Torna', en: '‹ Back' },
    done: { es: 'completo', ca: 'complet', en: 'complete' },
    partial: { es: 'parcial', ca: 'parcial', en: 'partial' },
    notFound: { es: 'No encontrado.', ca: 'No trobat.', en: 'Not found.' },
    loadError: { es: 'No se han podido cargar los datos.', ca: 'No s’han pogut carregar les dades.', en: 'Couldn’t load the data.' },
    disclaimer: { es: 'No es consejo médico. Si algo duele, para.', ca: 'No és consell mèdic. Si alguna cosa fa mal, atura’t.', en: 'Not medical advice. If something hurts, stop.' },
    install: { es: 'Instala la app', ca: 'Instal·la l’app', en: 'Install the app' },
    installOther: { es: 'Abre el menú del navegador (⋮) y elige «Instalar aplicación».', ca: 'Obre el menú del navegador (⋮) i tria «Instal·la l’aplicació».', en: 'Open the browser menu (⋮) and choose “Install app”.' },
    more: { es: 'Más rutinas', ca: 'Més rutines', en: 'More routines' },
    up: { es: 'subir', ca: 'pujar', en: 'level up' },
    toLevel: { es: 'Para subir', ca: 'Per pujar', en: 'To level up' },
    toLevelHint: { es: 'Los marcaste fáciles 2 veces seguidas. Ajústalos y pulsa ✓.', ca: 'Els vas marcar fàcils 2 vegades seguides. Ajusta’ls i prem ✓.', en: 'You marked these easy twice in a row. Adjust them, then tap ✓.' },
    easyTimes: { es: 'Fácil ×{n}', ca: 'Fàcil ×{n}', en: 'Easy ×{n}' },
    adjusted: { es: 'Ajustado', ca: 'Ajustat', en: 'Adjusted' },
    hello: { es: '¡Qué pasa, fiera! ¡A darle con todo!', ca: 'Què passa, fiera? A donar-ho tot!', en: 'What’s up, beast? Let’s give it everything!' },
  };
  const EQUIP = Detail.EQUIP; // shared with the player's info overlay (detail.js)

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  const guess = (navigator.language || '').slice(0, 2);
  let lang = LANGS.includes(store.get('gym-coach.lang')) ? store.get('gym-coach.lang') : LANGS.includes(guess) ? guess : 'es';
  const t = (o) => (o && (o[lang] ?? o.es)) || '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (id) => document.getElementById(id);
  const view = $('view'), playerEl = $('player'), foot = $('foot');

  const openSet = new Set((() => { try { return JSON.parse(store.get('gym-coach.open') || '[]'); } catch { return []; } })());
  view.addEventListener('toggle', (e) => {
    const k = e.target.dataset?.key; if (!k) return;
    if (e.target.open) openSet.add(k); else openSet.delete(k);
    store.set('gym-coach.open', JSON.stringify([...openSet]));
  }, true);

  let data = null; // { exercises, routines, lines }; routines have their includes resolved

  // A block may be { "routine": "<id>" }: it is replaced by that routine's blocks (SPEC § routines).
  function resolveRoutines(list) {
    const byId = Object.fromEntries(list.map((r) => [r.id, r]));
    const expand = (r, seen) => r.blocks.flatMap((b) => {
      if (!b.routine) return [b];
      const sub = byId[b.routine];
      if (!sub || seen.includes(sub.id)) throw new Error(`Bad include ${b.routine} in ${r.id}`);
      return expand(sub, [...seen, sub.id]);
    });
    return list.map((r) => ({ ...r, includes: r.blocks.filter((b) => b.routine).map((b) => b.routine), blocks: expand(r, [r.id]) }));
  }
  let player = null;

  // ---------- history ----------
  const readLog = () => { try { return JSON.parse(store.get(LOG_KEY) || '[]'); } catch { return []; } };
  function addLog(entry) { store.set(LOG_KEY, JSON.stringify([entry, ...readLog()].slice(0, 200))); }
  // Level-up marks (SPEC § Level-up marks): gym-coach.feel is [{ at, routine, ex, v: easy|ok|hard|adjusted }], newest first.
  const readFeel = () => { try { return JSON.parse(store.get(FEEL_KEY) || '[]'); } catch { return []; } };
  const writeFeel = (list) => store.set(FEEL_KEY, JSON.stringify(list.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 500)));
  function setFeel(routine, ex, v, at) {
    const list = readFeel().filter((f) => !(f.at === at && f.ex === ex)); // re-rating in the same session replaces it
    if (v) list.push({ at, routine, ex, v });
    writeFeel(list);
  }
  // ex id → { easy: count in a row, routines: [ids] } for exercises whose latest ratings are easy N times in a row.
  function candidates() {
    const run = {}, stopped = new Set();
    for (const f of readFeel()) {
      if (stopped.has(f.ex)) continue;
      if (f.v !== 'easy') { stopped.add(f.ex); continue; }
      const c = (run[f.ex] ||= { easy: 0, routines: [] });
      c.easy++; if (!c.routines.includes(f.routine)) c.routines.push(f.routine);
    }
    return Object.fromEntries(Object.entries(run).filter(([id, c]) => c.easy >= EASY_IN_A_ROW && data.exercises[id]));
  }
  const upTag = () => `<span class="up" title="${esc(t(TEXT.toLevel))}">⬆ ${esc(t(TEXT.up))}</span>`;
  function lastWeights() {
    const w = {};
    readLog().slice().reverse().forEach((e) => Object.assign(w, e.weights || {}));
    return w;
  }
  const dateFmt = (iso) => new Intl.DateTimeFormat({ es: 'es-ES', ca: 'ca-ES', en: 'en-GB' }[lang], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  // ---------- views ----------
  const mascot = (pose) => (window.Titan ? window.Titan.svg(pose) : '<div class="mascot-fallback">🦾</div>');
  // Equipment a routine needs, in EQUIP order; floor-only routines show "Floor".
  function routineEquipment(r) {
    const used = new Set(r.blocks.flatMap((b) => b.steps.flatMap((s) => data.exercises[s.exercise]?.equipment || [])));
    const list = Object.keys(EQUIP).filter((e) => used.has(e) && e !== 'floor');
    return list.length ? list : ['floor'];
  }
  function routineCard(r, group) {
    const items = Player.buildTimeline(r, data.exercises);
    const sets = items.filter((i) => i.kind === 'work').length;
    const last = readLog().find((e) => e.routine === r.id);
    return `<a class="card routine c-${group?.color || 'red'}" href="#/play/${encodeURIComponent(r.id)}">
      <div class="r-head"><div><h3>${num('R', r.n)}${esc(t(r.name))}</h3>${r.subtitle ? `<p class="sub">${esc(t(r.subtitle))}</p>` : ''}</div>
        <span class="pill">${Player.fmtLen(Player.duration(items))}</span></div>
      <p class="chips">${routineEquipment(r).map((e) => `<span class="chip">${esc(t(EQUIP[e]))}</span>`).join('')}${(() => {
        const ups = new Set(r.blocks.flatMap((b) => b.steps.map((s) => s.exercise)).filter((id) => cand[id])).size;
        return ups ? `<span class="up">⬆ ${ups}</span>` : ''; })()}</p>
      <div class="r-foot"><span>${sets} ${esc(t(sets === 1 ? TEXT.set : TEXT.sets))}${last ? ` · ${esc(t(TEXT.last))}: ${esc(dateFmt(last.at))}` : ''}</span>
        <span class="btn small go">▶ ${esc(t(TEXT.play))}</span></div></a>`;
  }
  // Stable reference numbers (E7, R3) so exercises and routines can be named in a request. See SPEC § Numbers.
  const num = (p, n) => (n ? `<span class="num">${p}${n}</span>` : '');
  // Folding sections: routines by data/groups.json, exercises by main equipment. Open ones are remembered.
  const section = (key, title, count, body, cls = '') => `<details class="group ${cls}" data-key="${key}"${openSet.has(key) ? ' open' : ''}>
    <summary>${title} <span class="pill">${count}</span></summary>${body}</details>`;
  let cand = {};
  function levelUpSection() {
    const ids = Object.keys(cand).sort((a, b) => data.exercises[a].n - data.exercises[b].n);
    if (!ids.length) return '';
    const rn = (rid) => { const r = data.routines.find((x) => x.id === rid); return r?.n ? `R${r.n}` : rid; };
    return `<h2 class="sec">⬆ ${esc(t(TEXT.toLevel))}</h2>
      <div class="card levelup"><p class="muted">${esc(t(TEXT.toLevelHint))}</p><ul>${ids.map((id) => `<li>
        <a href="#/ex/${encodeURIComponent(id)}">${num('E', data.exercises[id].n)}${esc(t(data.exercises[id].name))}</a>
        <span class="muted">${esc(t(TEXT.easyTimes).replace('{n}', cand[id].easy))} · ${esc(cand[id].routines.map(rn).join(', '))}</span>
        <button type="button" class="btn small" data-adjusted="${esc(id)}">✓ ${esc(t(TEXT.adjusted))}</button></li>`).join('')}</ul></div>`;
  }
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-adjusted]'); if (!b) return;
    const list = readFeel(); list.push({ at: new Date().toISOString(), routine: null, ex: b.dataset.adjusted, v: 'adjusted' }); writeFeel(list);
    hubState.y = window.scrollY; renderHub(); window.scrollTo(0, hubState.y);
  });
  // Main routines (pinned group) sit open on top; the other groups fold inside "Más rutinas". See SPEC § groups.
  function groupSection(g) {
    const list = data.routines.filter((r) => r.group === g.id);
    if (!list.length) return '';
    const lens = list.map((r) => Player.fmtLen(Player.duration(Player.buildTimeline(r, data.exercises)))).join(' · ');
    return section(`r:${g.id}`, `<span class="g-emoji" aria-hidden="true">${g.emoji}</span><span class="g-title">${esc(t(g.name))}<small>${esc(lens)}</small></span>`,
      list.length, `<div class="list">${list.map((r) => routineCard(r, g)).join('')}</div>`, `g-${g.color}`);
  }
  function renderHub() {
    cand = candidates();
    const log = readLog().slice(0, 5);
    const helloPool = data.lines?.hello?.[lang];
    const hello = helloPool?.length ? helloPool[Math.floor(Math.random() * helloPool.length)] : t(TEXT.hello);
    view.innerHTML = `
      <section class="hero">
        <div class="mascot pose-idle" id="heroMascot">${mascot('idle')}</div>
        <div class="bubble">${esc(hello)}</div>
      </section>
      ${levelUpSection()}
      <h2 class="sec">${esc(t(TEXT.routines))}</h2>
      ${data.groups.filter((g) => g.pinned).map((g) => {
        const list = data.routines.filter((r) => r.group === g.id);
        return list.length ? `<div class="list pinned">${list.map((r) => routineCard(r, g)).join('')}</div>` : '';
      }).join('')}
      ${(() => {
        const more = data.groups.filter((g) => !g.pinned).map(groupSection).join('');
        const n = data.routines.filter((r) => !data.groups.find((g) => g.id === r.group)?.pinned).length;
        return more ? section('r:more', `<span class="g-emoji" aria-hidden="true">📦</span><span class="g-title">${esc(t(TEXT.more))}</span>`, n, `<div class="more-groups">${more}</div>`, 'more') : '';
      })()}
      <h2 class="sec">${esc(t(TEXT.library))}</h2>
      ${Object.keys(EQUIP).map((eq) => {
        const group = Object.entries(data.exercises).filter(([, ex]) => ex.equipment[0] === eq);
        if (!group.length) return '';
        return section(`e:${eq}`, `<span class="g-title">${esc(t(EQUIP[eq]))}</span>`, group.length,
          `<div class="list grid">${group.map(([id, ex]) => `
            <a class="card ex" href="#/ex/${encodeURIComponent(id)}"><h3>${num('E', ex.n)}${esc(t(ex.name))}</h3>${cand[id] ? upTag() : ''}
              <p>${ex.equipment.map((e) => esc(t(EQUIP[e]) || e)).join(' · ')}</p></a>`).join('')}</div>`);
      }).join('')}
      <h2 class="sec">${esc(t(TEXT.history))}</h2>
      ${log.length ? `<ul class="card history">${log.map((e) => {
        const r = data.routines.find((x) => x.id === e.routine);
        return `<li><span>${esc(dateFmt(e.at))}</span><b>${esc(r ? t(r.name) : e.routine)}</b>
          <span class="tag ${e.done ? 'ok' : ''}">${e.steps}/${e.total} ${esc(t(e.done ? TEXT.done : TEXT.partial))}</span></li>`;
      }).join('')}</ul>` : `<p class="empty">${esc(t(TEXT.noHistory))}</p>`}`;
    $('heroMascot').addEventListener('click', (e) => { const m = e.currentTarget; m.classList.remove('wiggle'); void m.offsetWidth; m.classList.add('wiggle'); });
  }
  function renderExercise(id) {
    const ex = data.exercises[id];
    if (!ex) { view.innerHTML = `<p class="empty">${esc(t(TEXT.notFound))}</p>`; return; }
    view.innerHTML = `
      <a class="back" href="#/">${esc(t(TEXT.back))}</a>
      <article class="card detail">${Detail.html(ex, lang, { extraChips: candidates()[id] ? upTag() : '' })}
      </article>`;
  }
  function openPlayer(id) {
    const routine = data.routines.find((r) => r.id === id);
    if (!routine) { location.hash = '#/'; return; }
    document.body.classList.add('playing');
    playerEl.hidden = false;
    player = Player.open(playerEl, {
      routine, exercises: data.exercises, lines: data.lines, getLang: () => lang, store, lastWeights: lastWeights(),
      onFinish: (r) => addLog({ at: new Date().toISOString(), routine: id, ...r }),
      onFeel: (ex, v, at) => setFeel(id, ex, v, at),
      onExit: () => { player = null; location.hash = '#/'; },
    });
    player.id = id;
  }
  function closePlayer() {
    if (player) { const p = player; player = null; p.close(true); }
    playerEl.hidden = true; playerEl.innerHTML = '';
    document.body.classList.remove('playing');
  }

  // The hub keeps its scroll position and open library groups when you visit an exercise or a routine and come back.
  const hubState = { y: 0 };
  let onHub = false;
  function saveHub() {
    if (!onHub) return;
    hubState.y = window.scrollY;
    onHub = false;
  }

  function route() {
    if (!data) return;
    saveHub();
    const [, kind, id] = location.hash.match(/^#\/(\w+)\/(.+)$/) || [];
    if (kind === 'play') {
      const rid = decodeURIComponent(id);
      if (player?.id !== rid) { closePlayer(); openPlayer(rid); }
      return;
    }
    closePlayer();
    if (kind === 'ex') { renderExercise(decodeURIComponent(id)); window.scrollTo(0, 0); return; }
    renderHub();
    onHub = true;
    window.scrollTo(0, hubState.y);
  }

  // ---------- shell ----------
  let installEvent = null;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function renderFoot() {
    foot.innerHTML = `<p>${esc(t(TEXT.disclaimer))}</p>
      ${standalone ? '' : `<button class="btn small" id="installBtn" type="button">📲 ${esc(t(TEXT.install))}</button>
      <p class="install-help" id="installHelp" hidden>${esc(t(TEXT.installOther))}</p>`}
      <p class="ver">Gym Coach v${VERSION}</p>`;
    $('installBtn')?.addEventListener('click', async () => {
      if (!installEvent) { $('installHelp').hidden = !$('installHelp').hidden; return; }
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
    });
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

  function setLang(next) {
    lang = next;
    store.set('gym-coach.lang', next);
    document.documentElement.lang = next;
    document.querySelectorAll('.langs button').forEach((b) => b.classList.toggle('active', b.dataset.lang === next));
    renderFoot();
    if (player) player.rerender(); else route();
  }
  document.querySelector('.langs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]');
    if (b) setLang(b.dataset.lang);
  });
  window.addEventListener('hashchange', route);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });

  const get = (f) => fetch(`data/${f}`, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(f); return r.json(); });
  Promise.all([get('exercises.json'), get('routines.json'), get('groups.json'), get('lines.json').catch(() => ({}))])
    .then(([exercises, routines, groups, lines]) => { data = { exercises, routines: resolveRoutines(routines), groups, lines }; setLang(lang); })
    .catch(() => { view.innerHTML = `<p class="empty">⚠️ ${esc(t(TEXT.loadError))}</p>`; renderFoot(); });
})();
