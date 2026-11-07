# Changelog

All notable changes to Gym Coach. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

## [0.8.0] — 2026-11-07
Applies the goals review agreed on 2026-11-07, most important first.
### Changed
- **Pull-ups: from 1 to 2–3.** The new exercise **E28 Dominada estricta** is done one rep at a time: tap Hecho, then rest 90 s.
  - **R7** (and so R1 on Monday and Friday) now runs scapular pull-ups (E24) → **3 strict singles** → 3 pull-up negatives (it was 5) → dip negatives. It's renamed "Dominadas y negativas".
  - **R6 is your pull-up day:** active hang + scapular pull-ups → **4 strict singles** → 3 negatives → dips and knee raises → stretches. E6 and E8 are gone from it.
- **Grip:** R9 is now the hand grip you do while walking your steps: Monday, Thursday and Friday, never before padel.
- **The hub shows your routines first:** R1, R6, R12 and R9 sit open at the top, and everything else is inside a closed **📦 Más rutinas**.
- **Rep ranges in R4:** for example "15–20 reps" for the goblet squat. The screen reminds you: "¿20 en todas las series? La próxima, sube peso."
### Added
- **R12 Torre suave** (13 min): mobility and stretches with no hanging or gripping, for Wednesday morning before padel or the day before R1.
- El Titán has his own lines for single-rep sets.
### Fixed
- **Short phones:** a player screen with a rep range and weight no longer runs under the controls. Screens scroll, and on short phones the rep screen hides El Titán so Hecho stays in view.

## [0.7.0] — 2026-11-07
### Added
- **Tap an exercise name in the player to see how it's done.** It works on the set, on the rest screen ("Siguiente: …") and in the start list. The timer pauses while the explanation is open; close it and tap ▶ to carry on.
### Changed
- The exercise explanation now lives in `detail.js`, shared by the hub's exercise page and the player, so the two can't drift. The service worker cache is bumped to v4.
### Fixed
- E20 Rotación de muñecas no longer says 30 s per side; R6 does it for 45 s, so it now says "half the time".
- **A paused countdown now shows the time left.** Before, pressing ⏸ redrew the clock and ring at the full step length until you resumed.

## [0.6.1] — 2026-11-07
### Changed
- **More upper-back work in R4 (and so in R1):** the new **E27 Pájaro con mancuernas** (bent-over reverse fly) joins the triceps-and-curl superset, which is now called "Brazos y espalda alta". In hard sets, pushing and pulling are now even. R1 computes to 64 min, R4 to 33 min.

## [0.6.0] — 2026-11-07
### Changed
- **R1 Entreno completo uses all your equipment and lasts about 60 min** (it was 47). Mobility R2 → rowing R3 → **tower R7** (dominada and fondos negatives) → strength R4 → core R5 → **stretches R11**.
- **R4 Fuerza con mancuernas:**
  - Adds back pulling with the new **E25 Remo con mancuerna a una mano**, and a hip hinge with the new **E26 Peso muerto rumano**.
  - Rests between exercises go from 45 s to 30 s.
  - Triceps and curl now form their own **Brazos** block of 2 rounds, as a superset.
- **R3 Remo técnico**: 12 → 10 min, with the cues spread over the new length.
- **R5 Core: rueda y rodillas**: each round adds E9 knee raises after the ab wheel.
### Added
- **R11 Estiramientos finales** (Fase 4): passive hang plus chest and lat stretches.
### Fixed
- The start screen scrolls when a routine has many exercises, instead of cutting off the top and bottom.

## [0.5.0] — 2026-11-06
### Added
- **Level-up marks**, to remember what was too easy:
  - The end screen asks how each exercise felt: 😌 Fácil / 💪 Bien / 🥵 Duro. It's optional, and a second tap clears it.
  - An exercise marked easy **2 times in a row** gets an **⬆ subir** tag in the library and on its page. Routines that use it show **⬆ N**.
  - A **Para subir** list on top of the hub shows each one with "Fácil ×2" and the routines where you rated it. Once it's adjusted, tap **✓ Ajustado**.

## [0.4.1] — 2026-11-06
### Changed
- **R6 Circuito de torre is now 15 min, with more real work at the tower** (it was 12 min, half of it rest):
  - New exercise **E24 Dominada escapular**: 5 counted reps right after the first hang.
  - A 3rd **E5 dominada negativa**.
  - **E7 fondos negativos** (3 counted reps) after the parallel-bar hold.
  - E20 wrist rotations go from 60 s to 45 s.

## [0.4.0] — 2026-11-06
### Added
- **Reference numbers:** every exercise has a stable number E1–E23 and every routine R1–R10, shown as a small tag before the name on the hub, the exercise page and the player. Say "update E7" or "add a round to R4". Numbers are the `n` field in the data, never reused; `validate.mjs` checks they are unique.
- SPEC: the project's two directions, improving the tool and improving the trainings.

## [0.3.0] — 2026-11-04
### Changed
- **Routines now sit in 4 folding groups** (`data/groups.json`), each with an emoji, a colour and the lengths of its routines:
  - 🧩 Código Titán: the full session first, then its 4 phases.
  - 🧗 Torre y dominadas.
  - ⚡ Rápidas.
  - 🌿 Descarga.
- **Plain names that say what each routine is**, for example "Fuerza con mancuernas", with your Titán name underneath ("Fase 2 · Bloque de fuerza"). The player's start screen shows both.
- **Equipment chips** on each routine card (Remo, Mancuernas, Barra…), computed from its exercises. The card's side stripe uses its group colour.
- Groups start closed, and the ones you open (routines and library) stay open, even after you close the app.

### Removed
- The 0.1.0 demo routine "Mini: cuelgue activo". Micro-dosis covers hangs.

## [0.2.2] — 2026-11-04
### Fixed
- Coming back to the hub from an exercise or a routine keeps your scroll position and the library sections you had open, instead of jumping to the top.

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
