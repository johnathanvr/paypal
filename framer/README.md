# ThemePrompt — first-visit Light/Dark chooser for Framer

A Framer **code component** that asks each new visitor whether they want a Light
or Dark experience, applies it by flipping Framer's native theme, and remembers
the choice so the prompt only ever shows once per visitor.

## How it works

- Reads/writes a `localStorage` key (default `site-theme-choice`).
- First visit → shows the prompt. The visitor's pick is saved and applied.
- Later visits → no prompt; the saved choice is re-applied on every page load.
- Applying a theme = setting `data-framer-theme="light|dark"` on `<body>`, which
  your existing **light/dark Color Styles** already react to. (No extra wiring —
  Framer swaps the colors for you.)

## Install

1. In Framer, open **Assets → Code → New Code File**.
2. Name it `ThemePrompt` and paste in the contents of [`ThemePrompt.tsx`](./ThemePrompt.tsx).
3. Drag the **ThemePrompt** component onto your page (put it on your top-level /
   home page so it appears on first arrival). Position doesn't matter on the live
   site — it renders as a full-screen overlay there; in the editor it renders
   in-frame so you can style it.

## Styling (all in the properties panel)

Select the component and use the right-hand panel:

- **Card BG** — the card's fill. Use a **semi-transparent** color (e.g. white at
  ~55% opacity) so the frosted-glass blur of the page behind it shows through.
- **Card Blur** — how strongly the homepage behind the card is blurred (px).
- **Heading Text** / **Body Text** — the text colors you asked to control.
- **Light/Dark Btn Text** — per-button label colors.
- Backdrop, Card BG, Card Border, Radius, and per-button BG/Border for full
  brand matching.
- **Heading / Description / Light Label / Dark Label** — the copy.
- **Default** — which option is highlighted as the suggested choice.
- **Storage Key** — change this if you ever want every visitor to be re-asked
  (a new key = a fresh "first visit" for everyone).

## Persistent toggle (let visitors change their mind)

[`ThemeToggle.tsx`](./ThemeToggle.tsx) is a small Light/Dark switch you can drop
anywhere (header, footer, a settings menu). Install it the same way (New Code
File → paste). It shares the **same Storage Key** and theme attribute as the
prompt, so changing it updates the page immediately and is remembered on future
visits. Keep its Storage Key identical to the prompt's (`site-theme-choice` by
default) so the two stay in sync.

## Testing

In **Preview** (or on the published site), open dev tools and run
`localStorage.clear()`, then reload — the prompt should appear. Choose a theme,
confirm the colors swap, reload, and confirm it does **not** ask again.

## Known caveat — brief flash

Code components run after the page hydrates, so on a *returning* visit there can
be a brief flash of the page's default theme before the saved choice is applied.
If that bothers you, add a tiny inline script to your site's custom `<head>`
code (**Site Settings → General → Custom Code**) that sets the attribute before
paint:

```html
<script>
  try {
    var t = localStorage.getItem("site-theme-choice");
    if (t === "light" || t === "dark")
      document.body.setAttribute("data-framer-theme", t);
  } catch (e) {}
</script>
```
