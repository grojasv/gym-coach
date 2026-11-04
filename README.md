# 💪 Gym Coach

El Titán, a cartoon luchador coach, runs your workout on the phone with a timer, voice and posture cues, in ES / CA / EN.

**Live:** https://grojasv.github.io/gym-coach/

The plan and data formats are in [SPEC.md](SPEC.md), and the project rules in [CLAUDE.md](CLAUDE.md).

## Structure
- `index.html`, `style.css`, `app.js`: the hub and the shell. There is no build step.
- `player.js`: the workout player (timeline, countdown, cues, voice).
- `mascot.js`: El Titán (SVG).
- `data/`: exercises, routines and the mascot's lines.
- `scripts/make-icons.mjs`: generates the app icons from the mascot.

## Run locally
```bash
python3 -m http.server 8766
```
Then open http://localhost:8766/.
