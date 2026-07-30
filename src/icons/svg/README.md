# Icon drop-zone

Put prepared SVGs here, **named by role**, then run:

```
npm run icons
```

That regenerates `../paths.generated.ts` and the role switches from its Material
fallback to your art automatically. No call site changes.

Role names are listed in `../index.tsx`, each with a suggested
[game-icons.net](https://game-icons.net/) slug. Name the file after the **role**
(`learn.svg`), never the picture (`graduate-cap.svg`) — that way swapping the art
later doesn't touch any code.

## Preparing a game-icons download

Their default export needs four edits. The build script fails loudly on each of
these rather than letting a broken icon reach the app:

1. **Delete the background rect.** The first `<path d="M0 0h512v512H0z" fill="#000">`
   is a full-bleed black square. It will render as a black tile behind the glyph.
2. **`fill="#fff"` → `fill="currentColor"`.** Baked color means the icon ignores
   `color`, so it loses category tinting, hover and disabled states — and the
   gradient, which is built from `currentColor`.
3. **Remove `style="height:24px;width:24px"`** from the `<svg>`. Inline size beats
   CSS, so the icon won't scale with `fontSize`.
4. **Drop the empty `<g class="" transform="translate(0,0)" style="">` wrapper.**
   `class` attributes collide when the same icon inlines repeatedly.

Keep the `viewBox`. It does **not** need to match Material's `0 0 24 24` — it only
needs to exist, since the browser scales to the CSS box either way.

## What to check after adding one

Optical weight, not pixel size. game-icons glyphs are drawn nearly edge-to-edge
while Material leaves internal padding, so a game-icons glyph can read heavier
than a Material one beside it at the same `fontSize`. Compare against a
neighbouring icon that's still on the fallback.

Attribution: game-icons.net art is CC BY 3.0 — credit Lorc and Delapouite.
