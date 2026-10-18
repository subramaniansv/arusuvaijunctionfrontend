# Postcard greeting font — "Amsterdam Four"

The `.pc__greeting` ("Happy Diwali") text on the festival postcard uses the
**Amsterdam Four** font, declared via `@font-face` in `src/pages/Festival.css`.

Amsterdam Four is a custom/commercial font, so the file is **not** committed to
the repo. To enable it, drop the font file(s) into this folder with these exact
names (woff2 preferred, others optional):

```
public/fonts/AmsterdamFour.woff2   ← preferred
public/fonts/AmsterdamFour.woff    ← optional fallback
public/fonts/AmsterdamFour.ttf     ← optional fallback
```

Because the files live under `public/`, they are served from the site root, so
the CSS references them as `/fonts/AmsterdamFour.woff2` (no import needed).

Until a file is added, the greeting gracefully falls back to a script/cursive
system face (`'Brush Script MT', 'Segoe Script', cursive`).

### Converting a .ttf/.otf to .woff2 (best web performance)
```bash
# one-time: pip install fonttools brotli
fonttools ttLib.woff2 compress -o AmsterdamFour.woff2 AmsterdamFour.ttf
```
