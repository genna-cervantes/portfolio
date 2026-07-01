# Genna Cervantes — Portfolio

A single-page personal portfolio built with **Next.js (App Router) + React + TypeScript**.
All styling is inline React style objects driven by a single `theme` object — no CSS
framework, no design-token file.

## Features

- Five stacked sections (About, Work, Articles, Schedule, Contact).
- Sticky, resizable sidebar (180–340px, persisted) with scroll-spy navigation.
- A working booking widget: month calendar (weekends + past dates disabled relative to
  a "today" of July 1, 2026), time slots, and a confirmation card.
- **✦ Pazzazz** — an AI restyle feature that regenerates the entire visual theme from a
  text prompt via a server-side Anthropic route. History of past restyles is stored in
  `localStorage` and re-applyable.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

The Pazzazz feature calls Claude (`claude-opus-4-8`) through `app/api/restyle/route.ts`,
which reads `ANTHROPIC_API_KEY` server-side. Without a key the page still works fully —
only the restyle button returns a friendly error. History re-apply and the three built-in
presets (`Editorial`, `Technical`, `Bold`) work with no key.

## Structure

- `app/page.tsx` — the whole interactive page (client component) plus content arrays,
  the `theme` type, the three presets, the `styles(t)` factory, the Pazzazz panel, and
  the scheduler.
- `app/api/restyle/route.ts` — the LLM route handler.
- `app/globals.css` — the only global CSS (box-sizing, margin reset, theme-swap
  transition, thin scrollbars, focus-outline removal).
