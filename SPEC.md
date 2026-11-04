# Gym Coach: spec (v1)

A phone-first hub of workout routines. El Titán, a cartoon Mexican luchador in a yellow mask, plays each routine as a timed
script: get ready → work → rest → next exercise. He shows each cue on screen and speaks it aloud, always encouraging and
always putting correct posture first.

Refined with Guille on 2026-11-04. Source material lives in `raw/`, which is private and gitignored. `raw/NOTES.md` holds
the extracted plan.

## Goal
- Strength training with **correct posture first**: open chest, shoulders back, steady progress on the basics.
- **Rule of the house:** "Técnica de cirujano sobre el ego": if the posture breaks down, stop the set.
- Not medical advice. The cues are written and reviewed by hand, never generated at run time.

## Decisions

| Topic | Decision |
|---|---|
| Audience | Guille only. Public GitHub Pages site, tuned for him, with no accounts. |
| Repo | `grojasv/gym-coach` → `https://grojasv.github.io/gym-coach/`. Public, with Pages. `raw/` stays out of git. |
| Phone | Android (Chrome, installed PWA). |
| Equipment | WaterRower rowing machine, DOMYOS power tower ("silla romana": pull-up bar, dip bars, knee-raise pads), adjustable dumbbells, hand grip, ab wheel. |
| Languages | CA / ES / EN, with flag buttons and the choice remembered. **ES is the source language** (the plan is in Spanish); CA and EN are translations. |
| Mascot | **El Titán**: a cartoon luchador in a yellow mask, drawn as SVG with poses (idle, work, rest, cheer). |
| Voice tone | A gym bro from Spain with a luchador flavour: "¡Qué pasa, fiera!", "¡Al ring!". The motto is "¡La constancia en los básicos construye titanes!" |
| Voice | On by default, with a mute button in the player. Beeps still play when muted. Web Speech API (no key, offline). If there is no Catalan voice, it falls back to Spanish. |
| Hub | Routines (with the duration computed from their steps) plus an exercise library (how to do it, posture cues, common mistakes) and a recent-history list. |
| Sets | **Hybrid.** `time` steps count down. `reps` steps wait for a **Done** tap. Rests are always timed and start on their own. |
| Durations | Configurable per routine. The total is **computed from the steps, never typed in**. Target lengths later: 15 / 30 / 60 min. |
| History | Basic log on the phone (`localStorage`): date, routine, done or partial, and the dumbbell weight per exercise, which is suggested next time. |
| Style | One Lucha Libre look: wrestling-poster type, yellow mask gold, deep navy and hot red, with light and dark modes. |
| v1 content | **One example exercise** (`cuelgue-activo`) in a mini routine. More content comes later. |
| Later | Gamification (boss HP bars, XP, FINAL BOSS round), the weekly calendar with a "today" card, progressions or levels, porting "Despegue Titán" (15 min). |

## Data

### `data/exercises.json`: an object keyed by exercise id
```jsonc
{
  "cuelgue-activo": {
    "name":     { "es": "Cuelgue activo", "ca": "Penjada activa", "en": "Active hang" },
    "equipment": ["pullup-bar"],          // pullup-bar | dip-bars | knee-raise | rower | dumbbells | handgrip | ab-wheel | floor
    "targets":  { "es": ["dorsales", "agarre"], "ca": [...], "en": [...] },
    "how":      { "es": "One or two sentences on how to do it.", "ca": "…", "en": "…" },
    "cues":     { "es": ["Posture cue 1", "…"], "ca": [...], "en": [...] },      // 3–5 short cues; also spoken as a tip during the rest before it
    "mistakes": { "es": ["Common mistake 1", "…"], "ca": [...], "en": [...] },
    "safety":   { "es": "Optional warning", "ca": "…", "en": "…" }               // optional
  }
}
```

### `data/routines.json`: an array
```jsonc
[{
  "id": "mini-cuelgue",
  "name":    { "es": "…", "ca": "…", "en": "…" },
  "summary": { "es": "…", "ca": "…", "en": "…" },
  "prepare": 10,                        // seconds of get-ready countdown before the first step
  "blocks": [{
    "name": { "es": "…", "ca": "…", "en": "…" },
    "rounds": 3,                        // the block's steps repeat this many times
    "restBetweenRounds": 60,            // replaces the last step's restAfter between rounds
    "steps": [{
      "exercise": "cuelgue-activo",     // id in exercises.json
      "mode": "time",                   // time: countdown | reps: wait for Done
      "seconds": 15,                    // mode time
      "reps": 10,                       // mode reps (shown as the target)
      "estSeconds": 40,                 // mode reps: estimate for the computed duration (default reps × 4)
      "weight": false,                  // true: ask for and log the dumbbell weight
      "toFailure": false,               // mode reps: no number, "to technical failure" (estimate 45 s)
      "beeps": true,                    // mode time: false drops the 3-2-1 beeps (short counted steps, e.g. a 5 s negative)
      "restAfter": 45,                  // seconds; always timed
      "cues": [                         // spoken and shown at that second since the step started
        { "at": 0, "text": { "es": "…", "ca": "…", "en": "…" } }
      ]
    }]
  }]
}]
```
**Includes:** a block can be `{ "routine": "<id>" }` instead. It is replaced by that routine's blocks, so a full
session is built from its phases (`codigo-titan` = its 4 phase routines). The `prepare` used is the outer routine's.
Between included routines, the last step's `restAfter` is the transition rest.

**Cue rules** (checked by `node scripts/validate.mjs`): `at` values increase and stay below `seconds - 3`, or below
`seconds` when `beeps` is false. Each cue is at most 12 words; leave about 1 s of gap per 3 words before the next cue.
Steps with cues get no generic `go`/`halfway`/`last3` lines. Reps steps have no timed cues.

**How the player builds the timeline:** first `prepare`, then for each block, round and step, the **work** step followed
by its **rest**. The rest is `restAfter`, except after a round's last step, where it is `restBetweenRounds`. The very
last rest of the routine is dropped, and the timeline ends with **done**. The duration is the sum of all of it.

### `data/lines.json`: the mascot's line pools, keyed by moment
Each key holds `{ "es": [...], "ca": [...], "en": [...] }`. A line is picked at random and is not repeated twice in a
row. Placeholders: `{name}` is the exercise name, `{n}` is a number, and `{reps}` is the reps.
Keys: `hello` (on the hub), `start`, `prep` (get ready), `go`, `halfway`, `last3`, `repsGo`, `repsDone`, `rest`, `nextUp`,
`roundDone`, `finish`, `motto`, `paused`. Each spoken line takes under 5 s to say.

### History: `localStorage` `gym-coach.log`
An array of `{ at, routine, done, steps, total, weights: { exerciseId: kg } }`, with the newest entry first and at most 200.

## Player and phone behaviour (from research on 2026-11-04)
- **Start is a tap**, and it unlocks everything. Inside that tap handler the player primes `speechSynthesis`, resumes the
  `AudioContext` and asks for the screen Wake Lock.
- **Countdowns come from timestamps** (`endAt`), never from counting ticks. On `visibilitychange` the player catches up
  with the clock and asks for the wake lock again, because the phone releases it when the page is hidden.
- **Cues run on the timeline**, not on the speech `onend` event, which is unreliable.
- **Beeps:** at 3-2-1, then a long one at go and at the end of each step. The beep is Web Audio, so it plays when the
  voice is muted.
- **Still to test on the Android phone:** speech in the installed app, and whether speech pauses or ducks Spotify. No
  web API controls audio focus on Android.

## Shell (shared with menu-mellis)
The app is plain HTML/CSS/JS with no build step. It uses relative paths only, since it is served under `/gym-coach/`.
- **Install:** PWA (`manifest.webmanifest` and a network-first `sw.js`).
- **Version:** one `VERSION` constant in `app.js`, shown in the footer, matching `CHANGELOG.md` (Keep a Changelog, SemVer).
- **Small phones:** check 320×568 and 390×844, in light and dark mode.
