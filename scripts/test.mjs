#!/usr/bin/env node
// Tests for the player's timeline (player.js buildTimeline) and the progress rules (progress.js). No dependencies.
//   node scripts/test.mjs
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
globalThis.window = globalThis; // the app's files are browser scripts that hang their API on window
globalThis.document = { addEventListener() {}, documentElement: { lang: 'es' } };
for (const f of ['detail.js', 'player.js', 'progress.js']) vm.runInThisContext(read(f), { filename: f });
const { Player, Progress, Detail } = globalThis;

const exercises = JSON.parse(read('data/exercises.json'));
const routines = JSON.parse(read('data/routines.json'));
const byId = Object.fromEntries(routines.map((r) => [r.id, r]));
const expand = (r) => ({ ...r, blocks: r.blocks.flatMap((b) => (b.routine ? expand(byId[b.routine]).blocks : [b])) }); // as app.js resolveRoutines

let failed = 0, count = 0;
function test(name, fn) {
  count++;
  try { fn(); } catch (e) { failed++; console.error(`✗ ${name}\n  ${e.message.split('\n').join('\n  ')}`); }
}
const kinds = (items) => items.map((i) => (i.kind === 'work' ? i.exId : `${i.kind}${i.seconds ?? ''}`)).join(' ');

// ----- a small made-up routine: exact timeline -----
const EX = {
  a: { name: { es: 'A' }, equipment: ['floor'] },
  d: { name: { es: 'D' }, equipment: ['dumbbells'] },
  p: { name: { es: 'P' }, equipment: ['pullup-bar'] },
  k: { name: { es: 'K' }, equipment: ['knee-raise'] },
};
const mini = { id: 'mini', prepare: 10, blocks: [
  { name: { es: 'One' }, rounds: 2, restBetweenRounds: 60, steps: [
    { exercise: 'a', mode: 'time', seconds: 30, restAfter: 15 },
    { exercise: 'd', mode: 'reps', reps: 10, repsMax: 12, estSeconds: 40, weight: true, restAfter: 20 }] },
  { name: { es: 'Two' }, rounds: 1, steps: [
    { exercise: 'p', mode: 'reps', reps: 1, estSeconds: 10, restAfter: 0 },
    { exercise: 'k', mode: 'time', seconds: 20, restAfter: 30 }] },
] };
const m = Player.buildTimeline(mini, EX);

test('order: prep, sets, rests; the between-rounds rest replaces the last step rest; no rest at the end', () => {
  assert.equal(kinds(m), 'prep10 a rest15 d rest60 a rest15 d rest20 p k done');
});
test('duration is the sum of the steps, reps sets by their estimate', () => {
  assert.equal(Player.duration(m), 10 + 30 + 15 + 40 + 60 + 30 + 15 + 40 + 20 + 10 + 20);
});
test('rounds are numbered and each prep/rest knows the next set', () => {
  assert.deepEqual(m.filter((i) => i.exId === 'd').map((i) => `${i.round}/${i.rounds}`), ['1/2', '2/2']);
  assert.equal(m[0].next.exId, 'a');
  assert.equal(m[2].next.exId, 'd');
});
test('stations: set up before the first use, put away after the last; bar and knee raise are one tower', () => {
  assert.deepEqual(m[2].setUp, ['dumbbells']); // the rest before the first d
  assert.deepEqual(m[8].setUp, ['tower']); // the rest before p
  assert.deepEqual(m[8].putAway, ['dumbbells']); // the step after the last d
  assert.equal(m.filter((i) => i.setUp?.includes('tower')).length, 1);
  assert.equal(m.some((i) => i.putAway?.includes('tower')), false); // the routine ends on it
});
test('the dumbbell weight is asked once: on the first weighted set and the rest before it', () => {
  assert.deepEqual(m.map((i, n) => (i.askKg ? n : null)).filter((n) => n != null), [2, 3]);
});
test('a reps set with no estimate gets one: reps × 4 s, or 45 s to failure', () => {
  const r = { blocks: [{ name: {}, steps: [{ exercise: 'a', mode: 'reps', reps: 5 }, { exercise: 'a', mode: 'reps', toFailure: true }] }] };
  assert.deepEqual(Player.buildTimeline(r, EX).filter((i) => i.kind === 'work').map((i) => i.est), [20, 45]);
});
test('an unknown exercise throws', () => {
  assert.throws(() => Player.buildTimeline({ blocks: [{ name: {}, steps: [{ exercise: 'nope', mode: 'time', seconds: 5 }] }] }, EX));
});

// ----- every real routine: invariants -----
for (const r of routines.map(expand)) {
  const items = Player.buildTimeline(r, exercises);
  const work = items.filter((i) => i.kind === 'work');
  test(`${r.id}: shape`, () => {
    assert.equal(items.at(-1).kind, 'done');
    assert.equal(items.filter((i) => i.kind === 'done').length, 1);
    assert.equal(items.at(-2).kind, 'work', 'ends on a set, not a rest');
    items.forEach((it, n) => { if (it.kind === 'rest') assert.notEqual(items[n + 1].kind, 'rest', `two rests in a row at ${n}`); });
    assert.ok(work.length > 0);
    assert.ok(Player.duration(items) > 0 && Number.isInteger(Player.duration(items)));
  });
  test(`${r.id}: every prep and rest has a next set`, () => {
    items.filter((i) => i.kind !== 'work' && i.kind !== 'done').forEach((i) => assert.ok(i.next?.kind === 'work'));
  });
  test(`${r.id}: each station is set up once, before its first use, and put away at most once, after its last`, () => {
    const stations = [...new Set(work.map((i) => i.station).filter(Boolean))];
    for (const st of stations) {
      const first = items.findIndex((i) => i.station === st), last = items.findLastIndex((i) => i.station === st);
      const ups = items.map((i, n) => (i.setUp?.includes(st) ? n : -1)).filter((n) => n >= 0);
      const aways = items.map((i, n) => (i.putAway?.includes(st) ? n : -1)).filter((n) => n >= 0);
      assert.equal(ups.length, 1, `${st} set up ${ups.length} times`);
      assert.ok(ups[0] === first || ups[0] === first - 1, `${st} set up at ${ups[0]}, first use ${first}`);
      assert.ok(aways.length <= 1 && aways.every((n) => n === last + 1), `${st} put away at ${aways}, last use ${last}`);
    }
    work.forEach((i) => assert.equal(i.station, Detail.STATION[i.ex.equipment[0]] || null));
  });
  test(`${r.id}: the weight is asked exactly on the first dumbbell set`, () => {
    const first = items.findIndex((i) => i.kind === 'work' && i.weight);
    assert.deepEqual(items.map((i, n) => (i.kind === 'work' && i.askKg ? n : -1)).filter((n) => n >= 0), first < 0 ? [] : [first]);
  });
}
test('R1 is its phases, in order, sharing one get-ready', () => {
  const r1 = byId['codigo-titan'];
  const whole = Player.buildTimeline(expand(r1), exercises).filter((i) => i.kind === 'work').map((i) => i.exId);
  const parts = r1.blocks.flatMap((b) => Player.buildTimeline(expand(byId[b.routine]), exercises).filter((i) => i.kind === 'work').map((i) => i.exId));
  assert.deepEqual(whole, parts);
});

// ----- progress rules -----
const log = (...sessions) => sessions.map((results, n) => ({ at: `2026-11-${10 + n}T10:00:00Z`, routine: 'r', results })).reverse(); // newest first, as stored
test('progress: series are oldest first, capped, and sum the sets', () => {
  const s = Progress.series(log({ x: { sets: [10, 9] } }, { x: { sets: [12, 12], max: 12 } }, {}), 8);
  assert.deepEqual(s.x.map((e) => e.value), [19, 24]);
  assert.equal(Progress.series(log(...Array(10).fill({ x: { sets: [1] } })), 8).x.length, 8);
  assert.deepEqual(Progress.series([{ at: 'a', routine: 'r' }]), {}); // old entries have no results
});
test('progress: all singles twice in a row → try a double', () => {
  const ok = { p: { sets: [1, 1, 1], single: true } }, miss = { p: { sets: [1, 0, 1], single: true } };
  assert.equal(Progress.advice(Progress.series(log(ok, ok)).p), 'double');
  assert.equal(Progress.advice(Progress.series(log(ok, miss)).p), null);
  assert.equal(Progress.advice(Progress.series(log(miss, ok)).p), null);
  assert.equal(Progress.advice(Progress.series(log(ok)).p), null); // once is not enough
});
test('progress: the top of the range in every set twice in a row → harder', () => {
  const top = { d: { sets: [12, 12], max: 12 } }, short = { d: { sets: [12, 11], max: 12 } };
  assert.equal(Progress.advice(Progress.series(log(top, top)).d), 'top');
  assert.equal(Progress.advice(Progress.series(log(short, top)).d), null);
  assert.equal(Progress.advice(Progress.series(log({ d: { sets: [30] } }, { d: { sets: [30] } })).d), null); // no range, no rule
});
test('progress: latest is the newest result per exercise', () => {
  assert.deepEqual(Progress.latest(log({ x: { sets: [8] } }, { x: { sets: [9] } })).x.sets, [9]);
});

if (failed) { console.error(`\n✗ ${failed} of ${count} tests failed`); process.exit(1); }
console.log(`✓ ${count} tests`);
