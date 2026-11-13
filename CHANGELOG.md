# Changelog

All notable changes to Gym Coach. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

## [0.12.1] — 2026-11-13
### Changed
- **Core in R1 (R5): 2 rounds instead of 3.** R1 now takes 66.5 min, shown as 67 (it was 69). Guille accepts R1 above 60 min; nothing else is cut.

## [0.12.0] — 2026-11-13
### Added
- **An intro when the app opens:** El Titán drops into the ring and the title slams in. A tap skips it; it plays once per app open, on the hub only.
- **A livelier hub:** a sunburst behind El Titán, who breathes, blinks and strikes a pose when tapped; striped routine cards; buttons react to a press.
- **In the player:** each new step animates in, and the end screen has confetti and a new pose with the belt held overhead.
### Changed
- The animations live in a new `fx.js`, decoration only: it never touches timers, speech or data, and nothing runs with reduced motion. The service worker cache is bumped to v6.

## [0.11.0] — 2026-11-13
### Added
- **Pick up an interrupted workout.** The player saves where you are on every step. If the app closes, the page reloads or you leave by accident, the hub shows **⏸ Entreno a medias** with Continuar and Descartar, and the routine's start screen offers **Continuar** (the set or rest you were on starts again) or Empezar de cero. It keeps finished sets, the weight, ratings and results for 6 hours; after that it goes to the history as partial.
- **Results per set.** A strict pull-up has **✔ Hecho** and **✗ No salió**. Every other reps set has a **Hechas − N +** counter, pre-filled with your last number.
- **📈 Progreso on the hub:** per exercise, the last session ("2 de 3", or "58 reps (20 · 20 · 18)") and a small trend line. Two rules flag the next step: every single came out twice in a row → try doubles; the top of the range in every set twice in a row → make it harder.
- **Tests:** `node scripts/test.mjs` checks the player's timeline (order, rests, durations, set-up and put-away, the weight question) on a made-up routine and on every real routine, plus the progress rules.
### Changed
- The progress rules live in a new `progress.js`. The service worker cache is bumped to v5.

## [0.10.1] — 2026-11-12
From a full run of R1 (64 min, every set, with pause, ⓘ, ⏮ and the screen off).
### Fixed
- **Rests no longer pile up lines.** On entering a rest, El Titán queued four or five lines at once (rest, put away, set up, next up, a tip). The last ones started up to 12 s late and ran into the next set, where they were cut off or talked over the reps target. Now they're said one at a time, and a line that no longer fits before the 3-2-1 countdown is skipped (it's on screen anyway).
- A "Recoge …" line at the start of a timed set is no longer cut off by the set's first cue.

## [0.10.0] — 2026-11-12
### Added
- **El Titán gives posture tips during reps sets** ("Codo pegado y hombro lejos de la oreja", "Abdomen firme…"). They come from each exercise's own tip list, one every 12 s or so while he's quiet, and stop at the target time. Long timed sets (the rower) get tips in their quiet stretches too. More time, more tips; each set goes through the list once.
### Changed
- **Short steps say only what fits.** The 5 to 6 s negatives (E5 in R6 and R7) had five or six cues that cut each other off. Now each has two: one as you start lowering, one to land. `validate.mjs` checks that every timed cue can be said before the next one starts.
- **Tips read numbers and symbols in words** ("tres segundos", not "3 s"; no ° or %), so the voice says them right. E10, E11, E12, E13, E14, E16 and E23.
- **More shoulder and core reminders** in the tips of E11, E25, E26 and E28.

## [0.9.1] — 2026-11-10
### Changed
- **R6 rests match R1:** 60 s between strict pull-ups (it was 90) and 45 s after the scapular pull-ups (it was 60). R6 now takes 18 min (it was 20).

## [0.9.0] — 2026-11-10
From Guille's feedback after a full R1.
### Added
- **📝 Notes mid-workout.** A 📝 button on every set and rest. On a rest: Corto / Largo; on a set: Fácil / Duro; plus an optional text. It pauses while you write. Everything is listed in the hub under **📝 Notas**, with **Copiar todo** to paste it to Claude, and **Borrar**.
- **A time on every reps set.** Its estimate counts down beside "¡A tope!" and then shows overtime. Hecho still moves on, so the whole routine has a timeline.
- **Set up and put away.** El Titán says and shows "Prepara el remo / la torre / las mancuernas / la rueda" before the first use, and "Recoge …" after the last.
### Changed
- **One weight for the dumbbells.** It's asked once, when the dumbbells come out, and kept for the whole workout. The rep-range hint now says to lower in 3 seconds instead of going up in weight.
- **R4 ranges retuned for one weight:** goblet squat 20–25, one-arm row 12–15, Romanian deadlift 15–20; shoulder press, triceps and reverse fly 8–12.
- **Shorter tower rests in R1 (R7):** 60 s between strict pull-ups (it was 90) and 45 s after the scapular pull-ups (it was 60). R1 stays at 69 min, because the new R4 ranges take longer.
### Fixed
- **The phone's back button** no longer ends the workout. It closes the explanation or note first, then asks before leaving.

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
