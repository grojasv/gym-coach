# Changelog

All notable changes to Gym Coach. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

## [0.2.1] — 2026-11-04
### Fixed
- A new release now shows the next time you open the app. Before, the browser could keep old files for up to 10 minutes, because GitHub Pages caches for 10 min and the service worker fetched through that cache. It now checks with the server on every request (`cache: 'no-cache'`), and `CACHE` is v2.

## [0.2.0] — 2026-11-04
### Added
- **Your Código Titán content:** 22 new exercises (23 in total), each with how-to, posture cues, common mistakes and safety notes, in ES / CA / EN. They come from your V3.7 page and your chat.
- **10 new routines.** The 4 phases of Código Titán V3.7, each as its own routine: Despertar el chasis, Motor WaterRower, Bloque de fuerza, Sello de hierro. Plus "Código Titán completo", built from those 4, and:
  - Despegue Titán, your script with its per-second cues (really about 12 min)
  - Torre: negativas (Mon/Fri)
  - Comodín de descarga
  - Micro-dosis entre tareas
  - El Apretón de Titán
- **Routines can include other routines** (`{ "routine": "<id>" }`). The full routine card lists its phases.
- **"To technical failure" sets:** no number, just stop when your form breaks and tap Done.
- **Short counted steps** (such as a 5 s negative) can turn off the 3-2-1 beeps.
- `scripts/validate.mjs` checks all the data: 3 languages everywhere, exercise ids, cue timing, cue length and include cycles.
- The exercise library is grouped by equipment into folding sections.

### Fixed
- A timed cue now interrupts any speech still running, so the voice stays on the clock.
- Opening another routine, or an exercise page, while the player is open no longer jumps back to the hub.
- "1 set" instead of "1 sets".

## [0.1.0] — 2026-11-04
### Added
- Skeleton, built on menu-mellis: plain HTML/CSS/JS with no build step, GitHub Pages, installable PWA (network-first service worker), CA / ES / EN with the choice remembered, and the version in the footer.
- **El Titán**, a cartoon luchador in a yellow mask, drawn as SVG in 4 poses (idle, work, rest, cheer). He moves his mouth while he talks. The app icons are generated from the same drawing.
- **Hub:** routines with a duration computed from their steps, an exercise library (how to do it, posture cues, common mistakes, safety), and the last 5 workouts.
- **Player:** runs a routine as a timeline (get ready, work, rest, … victory). It has a countdown ring, beeps at 3-2-1, timed cues, Done for reps sets, a dumbbell weight field, pause, skip, previous, and voice on or off. The screen stays on (Wake Lock). The clock follows timestamps, so it catches up after the screen locks.
- **Voice:** Web Speech API, with a Spain gym-bro tone and a luchador flavour (`data/lines.json`, 14 moments × 3 languages). It falls back to a Spanish voice when the phone has no Catalan one.
- **History:** a basic log on the phone (date, routine, done or partial, weights).
- Example content: one exercise (`cuelgue-activo`) and one mini routine (3 × 15 s hangs).
