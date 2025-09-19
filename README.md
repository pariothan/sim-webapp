
# Language Evolution Simulator — Web (MVP)

Minimal, runnable web app scaffold (React + Vite + TypeScript) for a language evolution simulator.
It renders a procedurally generated world to a canvas and runs a simple evolution loop in a Web Worker.

## Quick Start
1. Ensure Node 18+ is installed.
2. Unzip this project.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the printed local URL (default http://localhost:5173).

## Notes
- This is a compact MVP. It includes three map modes: LANGUAGE, PHONEME_COUNT, SPEAKER_COUNT.
- The engine is in TypeScript for out-of-the-box use. You can port to Pyodide/WebAssembly later.
- The simulation logic is intentionally simple but structured for extension (language mutation, spread, splits).
- Config changes apply live; use Reset/New World to regenerate map/communities.

## Where to Extend Next
- Add history logging (event log, snapshots, timeline scrubber).
- Add borrowing networks and family trees.
- Implement contiguity enforcement and boundary rendering.
- Flesh out phonology (distinctive features and dispersion-based inventory optimizer).
- Add exporters (JSON/CSV/PNG/GIF timelapse).
