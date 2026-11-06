#!/usr/bin/env node
// Validates data/*.json against the rules in SPEC.md. No dependencies.   node scripts/validate.mjs
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const LANGS = ['es', 'ca', 'en'];
const EQUIPMENT = ['pullup-bar', 'dip-bars', 'knee-raise', 'rower', 'dumbbells', 'handgrip', 'ab-wheel', 'floor'];
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const words = (s) => s.trim().split(/\s+/).length;

function localized(where, o, { list = false, maxWords } = {}) {
  if (!o || typeof o !== 'object') return err(where, 'missing');
  for (const l of LANGS) {
    const v = o[l];
    if (list) {
      if (!Array.isArray(v) || !v.length) { err(where, `no ${l} list`); continue; }
      v.forEach((x, i) => { if (typeof x !== 'string' || !x.trim()) err(`${where}.${l}[${i}]`, 'empty');
        else if (maxWords && words(x) > maxWords) err(`${where}.${l}[${i}]`, `${words(x)} words > ${maxWords}`); });
      if (v.length !== o.es?.length) err(where, `${l} has ${v.length} items, es has ${o.es?.length}`);
    } else if (typeof v !== 'string' || !v.trim()) err(where, `no ${l}`);
    else if (maxWords && words(v) > maxWords) err(`${where}.${l}`, `${words(v)} words > ${maxWords}`);
  }
}

const exercises = read('exercises.json');
for (const [id, ex] of Object.entries(exercises)) {
  const w = `exercise ${id}`;
  if (!/^[a-z0-9-]+$/.test(id)) err(w, 'id must be kebab-case');
  localized(`${w}.name`, ex.name);
  localized(`${w}.how`, ex.how);
  localized(`${w}.cues`, ex.cues, { list: true, maxWords: 14 });
  localized(`${w}.mistakes`, ex.mistakes, { list: true, maxWords: 14 });
  if (ex.targets) localized(`${w}.targets`, ex.targets, { list: true });
  if (ex.safety) localized(`${w}.safety`, ex.safety);
  if (!Array.isArray(ex.equipment) || !ex.equipment.length) err(w, 'no equipment');
  else ex.equipment.forEach((e) => { if (!EQUIPMENT.includes(e)) err(w, `unknown equipment ${e}`); });
}

// Stable reference numbers: E<n> for exercises, R<n> for routines. Unique; new items take the next free number.
const uniqueNums = (kind, list) => {
  const seen = new Map();
  list.forEach(([id, n]) => {
    if (!Number.isInteger(n) || n < 1) err(`${kind} ${id}`, 'n must be a positive integer');
    else if (seen.has(n)) err(`${kind} ${id}`, `n ${n} already used by ${seen.get(n)}`); else seen.set(n, id);
  });
};
uniqueNums('exercise', Object.entries(exercises).map(([id, ex]) => [id, ex.n]));

const groups = read('groups.json');
const COLORS = ['red', 'gold', 'teal', 'green'];
groups.forEach((g) => { localized(`group ${g.id}.name`, g.name); if (!g.emoji) err(`group ${g.id}`, 'no emoji'); if (!COLORS.includes(g.color)) err(`group ${g.id}`, `color must be one of ${COLORS}`); });

const routines = read('routines.json');
const ids = new Set();
for (const r of routines) {
  const w = `routine ${r.id}`;
  if (ids.has(r.id)) err(w, 'duplicate id'); ids.add(r.id);
  localized(`${w}.name`, r.name);
  localized(`${w}.summary`, r.summary);
  if (r.subtitle) localized(`${w}.subtitle`, r.subtitle);
  if (!groups.some((g) => g.id === r.group)) err(w, `group ${r.group} not in groups.json`);
  (r.blocks || []).forEach((b, bi) => {
    if (b.routine) { if (!routines.some((x) => x.id === b.routine)) err(`${w}.blocks[${bi}]`, `includes unknown routine ${b.routine}`); return; }
    localized(`${w}.blocks[${bi}].name`, b.name);
    (b.steps || []).forEach((s, si) => {
      const sw = `${w}.blocks[${bi}].steps[${si}]`;
      if (!exercises[s.exercise]) err(sw, `unknown exercise ${s.exercise}`);
      if (s.mode === 'time') {
        if (!(s.seconds > 0)) err(sw, 'time step needs seconds');
        const limit = s.beeps === false ? s.seconds : s.seconds - 3;
        (s.cues || []).forEach((c, ci) => {
          localized(`${sw}.cues[${ci}].text`, c.text, { maxWords: 12 });
          if (!(c.at >= 0 && c.at < limit)) err(`${sw}.cues[${ci}]`, `at ${c.at} must be in [0, ${limit})`);
        });
        const ats = (s.cues || []).map((c) => c.at);
        if (ats.some((a, i) => i && a <= ats[i - 1])) err(sw, 'cue times must increase');
      } else if (s.mode === 'reps') {
        if (!(s.reps > 0) && !s.toFailure) err(sw, 'reps step needs reps or toFailure');
        if (s.cues?.length) err(sw, 'reps steps take no timed cues');
      } else err(sw, `mode must be time or reps, got ${s.mode}`);
      if (s.restAfter != null && !(s.restAfter >= 0)) err(sw, 'bad restAfter');
    });
  });
}
uniqueNums('routine', routines.map((r) => [r.id, r.n]));
// No include cycles.
const byId = Object.fromEntries(routines.map((r) => [r.id, r]));
const walk = (id, seen) => (byId[id]?.blocks || []).forEach((b) => {
  if (!b.routine) return;
  if (seen.includes(b.routine)) err(`routine ${seen[0]}`, `include cycle via ${b.routine}`); else walk(b.routine, [...seen, b.routine]);
});
routines.forEach((r) => walk(r.id, [r.id]));

const KEYS = ['hello', 'start', 'prep', 'go', 'halfway', 'last3', 'repsGo', 'repsDone', 'rest', 'nextUp', 'roundDone', 'finish', 'motto', 'paused'];
const lines = read('lines.json');
for (const k of KEYS) localized(`lines.${k}`, lines[k], { list: true, maxWords: 18 });
LANGS.forEach((l) => {
  (lines.nextUp?.[l] || []).forEach((x, i) => { if (!x.includes('{name}')) err(`lines.nextUp.${l}[${i}]`, 'needs {name}'); });
  (lines.repsGo?.[l] || []).forEach((x, i) => { if (!x.includes('{reps}')) err(`lines.repsGo.${l}[${i}]`, 'needs {reps}'); });
});

if (errors.length) { console.error(errors.join('\n')); console.error(`\n✗ ${errors.length} problem(s)`); process.exit(1); }
console.log(`✓ ${Object.keys(exercises).length} exercises, ${routines.length} routines, ${KEYS.length} line pools`);
