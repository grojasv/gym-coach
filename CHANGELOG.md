# Changelog

All notable changes to Gym Coach. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

## [0.1.0] — 2026-11-04
### Added
- Skeleton, built on menu-mellis: plain HTML/CSS/JS with no build step, GitHub Pages, installable PWA (network-first service worker), CA / ES / EN with the choice remembered, and the version in the footer.
- **El Titán**, a cartoon luchador in a yellow mask, drawn as SVG in 4 poses (idle, work, rest, cheer). He moves his mouth while he talks. The app icons are generated from the same drawing.
- **Hub:** routines with a duration computed from their steps, an exercise library (how to do it, posture cues, common mistakes, safety), and the last 5 workouts.
- **Player:** runs a routine as a timeline (get ready, work, rest, … victory). It has a countdown ring, beeps at 3-2-1, timed cues, Done for reps sets, a dumbbell weight field, pause, skip, previous, and voice on or off. The screen stays on (Wake Lock). The clock follows timestamps, so it catches up after the screen locks.
- **Voice:** Web Speech API, with a Spain gym-bro tone and a luchador flavour (`data/lines.json`, 14 moments × 3 languages). It falls back to a Spanish voice when the phone has no Catalan one.
- **History:** a basic log on the phone (date, routine, done or partial, weights).
- Example content: one exercise (`cuelgue-activo`) and one mini routine (3 × 15 s hangs).
