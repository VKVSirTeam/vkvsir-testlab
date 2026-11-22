# vkvsir-testlab
VKV Sir Test Lab - test.vkvsir.com (GitHub Pages)

## Publishing a change
1. Edit `app.js` / `app.css`; bump `?v=` for the changed file in `index.html`.
2. `cp index.html 404.html` (404.html serves every unknown path).
3. `node scripts/build-pages.mjs` — rebuilds one real page per exam (`e/`), public test (`t/`) and subject (`p/`),
   plus `exams.html`, `career.html` … with their own titles and descriptions, `sitemap.xml` and `robots.txt`.
   Run it after every `index.html` change and when exams, tests or subjects are added.
4. Commit and push.

## Design system
Tokens live at the end of `app.css` ("Design system v1"): type scale 12/14/16/18/22/28/36/44/56,
radii 8/12/16/24/pill, two shadows, section colours (practice, test, exams, career).
`scripts/snap-tokens.py` snaps stray font sizes and radii back to the scale.
Icons: `icon(name)` in `app.js` (Lucide line icons). Theme: Light / Dark / System via `data-theme` on `<html>`.
