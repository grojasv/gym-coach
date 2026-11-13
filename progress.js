// Gym Coach: progress from the history log (SPEC § Progress). Pure functions, so scripts/test.mjs can run them.
// A log entry may have results: { exerciseId: { sets: [n, …], max?: repsMax, single?: true } }.
// single: one-rep sets such as a strict pull-up, where each set is 1 (it came out) or 0 (it didn't).
(() => {
  const value = (s) => s.sets.reduce((a, b) => a + b, 0);
  // exercise id → its last n sessions with results, oldest first: [{ at, routine, sets, max, single, value }]
  function series(log, n = 8) {
    const out = {};
    for (const e of [...log].sort((a, b) => (a.at < b.at ? -1 : 1))) {
      for (const [ex, r] of Object.entries(e.results || {})) {
        if (!Array.isArray(r?.sets) || !r.sets.length) continue;
        (out[ex] ||= []).push({ at: e.at, routine: e.routine, sets: r.sets, max: r.max ?? null, single: !!r.single, value: value(r) });
      }
    }
    for (const ex of Object.keys(out)) out[ex] = out[ex].slice(-n);
    return out;
  }
  // The next step, from the last 2 sessions: 'double' (every single came out, with at least 2 singles each time),
  // 'top' (every set reached the top of its range), or null.
  function advice(list) {
    const last = list.slice(-2);
    if (last.length < 2) return null;
    if (last.every((s) => s.single && s.sets.length >= 2 && s.sets.every((v) => v === 1))) return 'double';
    if (last.every((s) => !s.single && s.max && s.sets.every((v) => v >= s.max))) return 'top';
    return null;
  }
  // The newest result of each exercise, to pre-fill the reps counter.
  function latest(log) {
    const s = series(log, 1);
    return Object.fromEntries(Object.entries(s).map(([ex, l]) => [ex, l[l.length - 1]]));
  }
  globalThis.Progress = { series, advice, latest };
})();
