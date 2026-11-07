# Gym Coach: project rules

Phone-first hub of workout routines, played as a timed script by El Titán (a cartoon luchador in a yellow mask, voice and on-screen cues). Plain HTML/CSS/JS, no build step, GitHub Pages under `/gym-coach/` (relative paths only). The plan, decisions and data schemas are in `SPEC.md`. Structure borrowed from `grojasv/menu-mellis`.

## Files
- `index.html`, `style.css`: the shell and the Lucha Libre poster look (tokens on `:root`, light and dark).
- `app.js`: the hub (routines, exercise library, history), languages, install button, footer. **`VERSION` here must match `CHANGELOG.md`.**
- `player.js`: builds the timeline from a routine and plays it (timestamps, cues, beeps, speech, wake lock).
- `detail.js`: the exercise explanation (`Detail.html`) and equipment names, shared by the hub's exercise page and the player's info overlay.
- `mascot.js`: El Titán as SVG (`Titan.svg(pose)`, `Titan.head()`), UMD so `scripts/make-icons.mjs` can reuse it.
- `data/exercises.json`, `data/routines.json`, `data/lines.json`: all the content. Schemas are in `SPEC.md`.
- `raw/`: Guille's private source material (a Gemini chat and his old Código Titán pages). **Gitignored. Never commit or publish it.** `raw/NOTES.md` summarises it.

## Content rules
- **ES is the source language.** CA (natural Catalan) and EN are translations. Every user-facing string has all 3.
- Cues and lines are spoken by text-to-speech, so keep each one short (under about 12 words), with no emoji and no symbols.
- Posture first: cues are written and reviewed by hand, never generated at run time. No medical claims.
- Routine durations are **computed from the steps**. Never type a total.
- `node scripts/validate.mjs` must pass before every commit that touches `data/`.
- A timed step's cue `at` values stay below `seconds - 3`, because the last 3 s are the beep countdown.

## Player rules (see SPEC § Player)
- Everything that needs a user gesture (speech, AudioContext, wake lock) happens inside the Start tap.
- Countdowns come from `endAt` timestamps. On `visibilitychange`, catch up with the clock and ask for the wake lock again.
- Mute silences speech only. Beeps keep playing.

## Shell
- PWA: `manifest.webmanifest` + `sw.js` (network-first). **Bump `CACHE` in `sw.js` when `SHELL` changes.**
- Icons: `node scripts/make-icons.mjs` (needs uv).
- Check 320×568 and 390×844, light and dark, after any UI change. Run with `python3 -m http.server 8766`.
- `CHANGELOG.md` (Keep a Changelog + SemVer) is updated in the same commit.
- Commits use the GitHub noreply email (repo-local git config), never a work address.
