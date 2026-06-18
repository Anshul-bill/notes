# Design — "Honey"

## Theme

Pure-neutral surfaces (true white in light, true near-black in dark, chroma 0) with a single honey-amber accent that carries all warmth and identity. Calm, product-grade, familiar — the opposite of the warm-paper "Inkwell" pass and of generic SaaS blue. **Dark is the default** (`ThemeProvider defaultTheme="dark"`, `enableSystem={false}`); the toggle persists each user's choice. Dark is a true neutral, not slate.

## Color (OKLCH)

| Role | Light | Dark | Use |
|------|-------|------|-----|
| `--bg` | `oklch(1 0 0)` | `oklch(0.16 0 0)` | page surface (pure) |
| `--surface` (`--sidebar`) | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | sidebar, panels, second neutral layer |
| `--foreground` | `oklch(0.22 0 0)` | `oklch(0.95 0 0)` | text/ink |
| `--border` | `oklch(0.915 0 0)` | `oklch(0.30 0 0)` | hairlines |
| `--muted` | `oklch(0.55 0 0)` | `oklch(0.68 0 0)` | secondary text (AA) |
| `--accent` | `oklch(0.80 0.15 75)` | `oklch(0.82 0.15 78)` | **fill** — buttons, selection, active tint, dots |
| `--accent-ink` | `oklch(0.24 0.03 75)` | `oklch(0.20 0.03 75)` | text/icon placed **on** an accent fill |
| `--accent-strong` | `oklch(0.52 0.13 60)` | `oklch(0.82 0.15 78)` | amber **text/icon** on a neutral surface (AA both modes) |
| `--accent-hover` | `oklch(0.74 0.15 72)` | `oklch(0.88 0.14 80)` | button hover |

Strategy: **Restrained.** Accent ≤10% of surface; neutrals carry the rest. Warmth is the amber, never the bg.

## Typography

One family does UI + prose; mono only for data.

- **Sans — Hanken Grotesk** (400/500/600/700/800): everything — headings, buttons, labels, body, the editor writing surface. Humanist warmth that pairs with amber; distinct from the Inter default. Display uses **800** for committed weight contrast against 400 body; home hero `clamp` to `text-8xl` (≤6rem), tracking `-0.03em`, leading 0.95.
- **Mono — JetBrains Mono** (400/500): status, word/char count, dates, tags, the `#` chips. Tabular figures, no layout shift.
- Fixed rem scale (product), ratio ~1.2: 12 / 14 / 16 / 20 / 24 / 32. Home hero is the one fluid exception, `clamp()` max ≤ 5rem.

## Components

- **Buttons.** Primary = `--accent` fill + `--accent-ink` text, `rounded-md`. Secondary = hairline border, ink text, amber border+text on hover. Consistent shape everywhere.
- **Active/selected** (sidebar row, toolbar button) = `--accent`/12 tint fill + ink text + amber indicator. **No side-stripe borders.**
- **Inputs** = `--bg` fill, `--border`, amber focus ring (`--accent`). Visible focus on all interactives.
- **AI panel** = uniform: small amber icon chip, mono uppercase title, ghost button to run, fill button to apply.
- Icons: Lucide, consistent stroke. No emoji.

## Layout

App shell: fixed `--surface` sidebar (256px) + scrolling `--bg` main. Structural responsive (sidebar collapses; not fluid type). Container max-width on prose (~65–75ch).

## Motion

150–250ms, ease-out (cubic-bezier .22,1,.36,1), conveys state only. Micro-interactions: hover, `active:scale-[0.97]` press on primary buttons, save-pulse dot, panel slide, selection. **One hero moment** on home: the highlighter stroke draws across the word once on load (`marker-draw`, `clip-path` reveal, `motion-safe` only). No per-section scroll choreography. `prefers-reduced-motion` → everything instant/static.

## Logo

`components/Logo.tsx` — a note sheet (currentColor stroke, theme-adaptive) whose top line is an amber highlighter swipe. The mark = the brand gesture. Replaces the old cube. Used in the sidebar wordmark.

## Cursor (home only)

`components/CursorFX.tsx` (framer-motion): amber dot + lagging spring ring (ring grows over interactive targets) + a short amber particle trail. The default cursor is hidden via `.cursor-none`. **Home/landing only** — the editor keeps its text cursor so writing is unaffected. Disabled on touch (`pointer: coarse`) and under `prefers-reduced-motion`.

## Signature

A **highlighter-marker swipe**: on the home headline one word sits on a hand-skewed amber stroke that draws in on load — the gesture of highlighting a note. Echoed three ways: the amber text-selection highlight app-wide, the logo's swipe, and the amber cursor trail on the landing. One warm gesture on pure-neutral surfaces is the identity; everything else stays quiet.
