# Habibi

**Own a piece of the UAE.** — the public landing page for Habibi, a real-world-asset
platform for fractional access to curated UAE real estate, built for Robinhood Chain.

This repository contains the **pre-launch marketing site only**. There are no smart
contracts, token issuance, wallet transaction logic, property settlement, or a live
marketplace — the interface architecture is designed so those capabilities can be
integrated later.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/app/globals.css` via `@theme`)
- **Framer Motion** for restrained, reduced-motion-aware animation
- **Lucide** icons

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Project structure

```
src/
  app/
    page.tsx                 # landing page (composes all sections)
    layout.tsx               # fonts (Instrument Serif + Manrope) + metadata
    globals.css              # design tokens, base styles, utilities
    {properties,how-it-works,about,learn,portfolio,
     marketplace,terms,privacy,risk}/page.tsx   # placeholder routes
  components/
    sections/                # one file per landing-page section (in narrative order)
    site/                    # header, mobile menu, modal/toast provider, forms, cards
    ui/                      # Container, Reveal, SectionHeading, Photo, Parallax
    brand/                   # Logo + icon
  lib/
    media.ts                 # central image library (src / alt / tone)
    properties.ts            # property preview data + filter helpers
    content.ts               # nav, comparison, verification, ownership, chain, footer copy
    cn.ts                    # classnames helper
```

## Design system

Tokens live in `src/app/globals.css` under `@theme`, exposed as Tailwind utilities:

- Surfaces `bg-bg` `bg-surface`, ink `text-ink` `text-charcoal` `text-muted`
- Accents `bg-lime` `bg-lime-soft`, naturals `bg-sand` `bg-stone`
- `rounded-{sm,md,lg,xl,2xl}`, `shadow-{card,float,panel}`
- Fonts: `font-serif` (Instrument Serif, editorial headlines) / `font-sans` (Manrope)

## Imagery

All photography is centralised in `src/lib/media.ts` — each entry has a `src`, `alt`,
and a `tone` (placeholder colour that prevents layout shift / flashes). Images render
through `src/components/ui/Photo.tsx` (a `next/image` wrapper with `fill`, `sizes`, and
an optional slow hover zoom). Property and destination records reference a media key.

During this preview the images are Unsplash CDN photographs (permanent, verified IDs,
curated to avoid clichés). `images.unsplash.com` is allowlisted in `next.config.ts`.

To swap in local approved assets: replace the `src` values in `media.ts` with local
paths (e.g. `/images/marina.jpg`) and remove the Unsplash host from `next.config.ts`.
No component changes are required.

## Waitlist

`components/site/WaitlistForm.tsx` validates the email client-side and persists to
`localStorage` (`habibi.waitlist`) for this preview. The `persist()` function is the
single integration point — replace its body with a Supabase insert to go live.

## Notes on content

All property figures, portfolio values, and documents are **illustrative preview
content** and are labelled as such throughout. The site makes no guaranteed-return,
regulatory-approval, partnership, or endorsement claims.
