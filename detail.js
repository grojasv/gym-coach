// Gym Coach: the exercise explanation (name, equipment, targets, how, cues, mistakes, safety), shared by the hub's
// exercise page (app.js) and the player's info overlay (player.js), so the two never drift.
(() => {
  const TEXT = {
    how: { es: 'Cómo se hace', ca: 'Com es fa', en: 'How to do it' },
    cues: { es: 'Claves de postura', ca: 'Claus de postura', en: 'Posture cues' },
    mistakes: { es: 'Errores comunes', ca: 'Errors comuns', en: 'Common mistakes' },
    safety: { es: 'Seguridad', ca: 'Seguretat', en: 'Safety' },
    targets: { es: 'Trabaja', ca: 'Treballa', en: 'Works' },
  };
  const EQUIP = {
    'pullup-bar': { es: 'Barra de dominadas', ca: 'Barra de dominades', en: 'Pull-up bar' },
    'dip-bars': { es: 'Paralelas', ca: 'Paral·leles', en: 'Dip bars' },
    'knee-raise': { es: 'Silla romana', ca: 'Cadira romana', en: 'Roman chair' },
    rower: { es: 'Remo', ca: 'Rem', en: 'Rower' },
    dumbbells: { es: 'Mancuernas', ca: 'Manuelles', en: 'Dumbbells' },
    handgrip: { es: 'Hand grip', ca: 'Hand grip', en: 'Hand grip' },
    'ab-wheel': { es: 'Rueda abdominal', ca: 'Roda abdominal', en: 'Ab wheel' },
    floor: { es: 'Suelo', ca: 'Terra', en: 'Floor' },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (p, n) => (n ? `<span class="num">${p}${n}</span>` : '');

  // extraChips: trusted HTML appended after the equipment pills (the hub's level-up tag).
  // titleId: an id for the heading, so the player overlay can label its dialog with it.
  function html(ex, lang, { extraChips = '', titleId = '' } = {}) {
    const t = (o) => (o && (o[lang] ?? o.es)) || '';
    const list = (o) => `<ul>${(o?.[lang] || o?.es || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `
      <h2${titleId ? ` id="${titleId}"` : ''}>${num('E', ex.n)}${esc(t(ex.name))}</h2>
      <p class="chips">${ex.equipment.map((e) => `<span class="pill">${esc(t(EQUIP[e]) || e)}</span>`).join('')}${extraChips}</p>
      ${ex.targets ? `<p class="muted"><b>${esc(t(TEXT.targets))}:</b> ${esc((ex.targets[lang] || ex.targets.es).join(', '))}</p>` : ''}
      <h3>${esc(t(TEXT.how))}</h3><p>${esc(t(ex.how))}</p>
      <h3>✅ ${esc(t(TEXT.cues))}</h3>${list(ex.cues)}
      <h3>❌ ${esc(t(TEXT.mistakes))}</h3>${list(ex.mistakes)}
      ${ex.safety ? `<div class="safety"><b>⚠️ ${esc(t(TEXT.safety))}:</b> ${esc(t(ex.safety))}</div>` : ''}`;
  }

  window.Detail = { html, EQUIP };
})();
