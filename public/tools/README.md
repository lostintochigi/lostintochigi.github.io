# Self-hosted utilities

Each folder here is served as-is at `https://www.animeshharsh.com/tools/<folder>/`.

To add a vibe-coded tool:

1. Create `public/tools/<slug>/index.html` (single-file HTML/CSS/JS works best;
   extra files in the same folder are fine too — use relative paths).
2. Add an entry to `src/data/utilities.js` with `url: '/tools/<slug>/'`.
3. `npm run deploy`.
