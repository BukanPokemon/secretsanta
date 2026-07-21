# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Tukar Kado ("gift exchange" in Indonesian) is a fork of Maël Nison's Secret Santa web app. It's a fully client-side React SPA for organizing a Secret Santa: an organizer enters participants and constraints, generates giver→receiver pairings, then shares a unique per-giver link that reveals only that giver's assigned recipient. There is no backend and no server-side storage — all state lives in the organizer's browser (`localStorage`), and recipient reveal is done by encrypting the recipient's data into the URL itself (see Architecture below).

Default UI language is Indonesian (`id`); English (`en`) is also wired in. `src/i18n/fr.ts` exists but is **not** registered in `src/i18n/config.ts`'s `resources` map — treat it as stale/unfinished rather than a working locale.

## Commands

Package manager is Yarn Berry (`yarn@4.5.1`, `nodeLinker: node-modules`). Use `yarn`, not `npm`, for installs.

- `yarn` — install dependencies
- `yarn dev` — start the Vite dev server
- `yarn build` — production build (outputs to `dist/`)
- `yarn preview` — preview the production build locally
- `yarn deploy` — build, copy `dist/index.html` to `dist/404.html` (SPA fallback for GitHub Pages), and publish `dist/` via `gh-pages`
- `yarn vitest` — run the test suite (used in CI); `yarn vitest run` for a single non-watch pass
- `yarn vitest run src/utils/generatePairs.test.ts` — run a single test file
- `yarn vitest -t "should handle circular MUST rules"` — run tests matching a name

There is no lint/typecheck script and no ESLint/Prettier config in the repo — `tsc` is only invoked implicitly through Vite's build; there's no standalone `yarn typecheck` command to reach for.

CI (`.github/workflows/`) runs `yarn vitest` then builds with `VITE_BASE_URL` set to the repo name and deploys `dist/` to GitHub Pages on pushes to `main`.

## Architecture

**No backend, privacy via client-side crypto.** The core design constraint: the organizer's browser must never need to transmit who-got-whom to a server. `src/utils/crypto.ts` encrypts each recipient's data (name/hint/address/phone/notes) with AES-GCM using a hardcoded key (`ENCRYPTION_KEY_BYTES` — explicitly obfuscation, not real security) and embeds the ciphertext in the URL query string. `src/utils/links.ts` builds these per-giver links (`/pairing?from=<giver>&to=<encrypted>&info=<instructions>`). The `Pairing` page (`src/pages/Pairing.tsx`) decrypts `to` client-side to reveal the recipient. Anyone with a specific giver's link can see only that giver's assignment.

**Two routes, defined in `src/index.tsx`:**
- `/` → `Home` (organizer view: manage participants, generate pairings, get links)
- `/pairing` → `Pairing` (recipient view: decrypts and displays one assignment)
- `/pairing.html` → redirects to `/pairing` preserving query params (legacy URL compat)

Router `basename` comes from `import.meta.env.BASE_URL`, which is set via `vite.config.ts`'s `base` (`/tukar-kado/`) — this matters for the GitHub Pages subpath deployment.

**Pairing generation (`src/utils/generatePairs.ts`).** Participants can have at most one `must` rule (forces a specific receiver) and any number of `mustNot` rules (excludes candidates). `generatePairs` runs a greedy constraint-satisfaction algorithm: at each step it picks the giver with the fewest remaining candidate receivers (most-constrained-first), assigns randomly among candidates, and removes that receiver from every other giver's candidate set. If a giver runs out of candidates mid-attempt, the whole attempt restarts; it retries up to 10 times before giving up and returning `null`. `generateGenerationHash` fingerprints the current participants' rules/hints so the UI (`SecretSantaLinks`) can detect when participants changed since pairings were generated and prompt a regeneration.

**Participant text format (`src/utils/parseParticipants.ts`).** The text-view editor (toggle in `Home`) uses a compact per-line syntax: `Name (hint) =mustTarget !mustNotTarget !mustNotTarget2`. `parseParticipantsText`/`formatParticipantText` round-trip between this text and the `Record<string, Participant>` map that's otherwise edited via the form UI (`ParticipantsList`/`ParticipantRow`). Both this parser and `ParticipantsList`'s CSV importer (via PapaParse, expecting `Name`/`Address`/`Phone`/`Gift Hint`/`Notes` columns) are alternate ways of producing the same `Participants` map — keep them in sync if the `Participant` shape changes.

**State shape.** `Participants = Record<string, Participant>` keyed by a `crypto.randomUUID()` id (not name), so renaming a participant doesn't break rules that reference their id. `Home` persists `participants`, `assignments` (`GeneratedPairs`), and `instructions` via `useLocalStorage` (`src/hooks/useLocalStorage.ts`), a plain `useState` + `useEffect`-writes-to-`localStorage` hook with an optional `migrate` function for reshaping previously-stored data.

**Component conventions:**
- Immutable updates to the participants map go through `immer`'s `produce` (see `ParticipantsList.tsx`, `RulesModal.tsx`) rather than manual spreading.
- Styling is Tailwind utility classes inline; no CSS modules or styled-components. Icons from `@phosphor-icons/react`.
- Translation strings go through `react-i18next`'s `useTranslation`/`Trans`; add new keys to both `src/i18n/en.ts` and `src/i18n/id.ts` (`id` is the fallback/default language, not `en`).
- `Accordion`/`AccordionContainer` implement the collapsible sections on the Home page; `Home` tracks which single section is open via `openSection` state.

## Tests

Tests live alongside the code they cover (`*.test.ts`) and run under Vitest. `generatePairs.test.ts` uses `fast-check` for property-based testing of the pairing algorithm (invariants: everyone gives/receives exactly once, `must`/`mustNot` rules are respected, impossible configurations return `null`) — when touching `generatePairs.ts`, prefer extending these property tests over only adding example-based cases.
