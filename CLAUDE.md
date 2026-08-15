# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Tukar Kado ("gift exchange" in Indonesian) is a fork of Maël Nison's Secret Santa web app. It's a fully client-side React SPA for organizing a Secret Santa: an organizer enters participants and constraints, generates giver→receiver pairings, then shares a unique per-giver link that reveals only that giver's assigned recipient. There is no backend and no server-side storage — all state lives in the organizer's browser (`localStorage`), and recipient reveal is done by encrypting the recipient's data into the URL itself (see Architecture below).

Default UI language is Indonesian (`id`); English (`en`) is also wired in.

## Commands

Package manager is Yarn Berry (`yarn@4.5.1`, `nodeLinker: node-modules`). Use `yarn`, not `npm`, for installs.

- `yarn` — install dependencies
- `yarn dev` — start the Vite dev server
- `yarn build` — production build (outputs to `dist/`)
- `yarn preview` — preview the production build locally
- `yarn deploy` — build, copy `dist/index.html` to `dist/404.html` (SPA fallback for GitHub Pages), and publish `dist/` via `gh-pages`
- `yarn vitest` — run the test suite (used in CI); `yarn vitest run` (or `yarn test`) for a single non-watch pass
- `yarn vitest run src/utils/generatePairs.test.ts` — run a single test file
- `yarn vitest -t "should handle circular MUST rules"` — run tests matching a name
- `yarn typecheck` — `tsc --noEmit`; also runs as part of `yarn build`, so a type error fails the build
- `yarn lint` — ESLint (flat config in `eslint.config.mjs`); `yarn format` — Prettier

CI (`.github/workflows/`) runs `yarn typecheck` then `yarn vitest` then builds with `VITE_BASE_URL` set to the repo name and deploys `dist/` to GitHub Pages on pushes to `main`.

## Architecture

**No backend, privacy via client-side crypto.** The core design constraint: the organizer's browser must never need to transmit who-got-whom to a server. Each pairing-generation event gets a random 256-bit AES-GCM key (`generateEventKey` in `src/utils/crypto.ts`, stored in `GeneratedPairs.encryptionKey`, persisted via `localStorage` alongside `assignments`). `src/utils/links.ts` compresses (`lz-string`) and encrypts the `{ from, to, info }` payload with that key, then packs `keyBytes + iv + ciphertext` into a base64url string placed in the URL **fragment**: `/pairing#<payload>`. Fragments are never sent to a server, so nothing identifying reaches access logs, `Referer` headers, or link-preview crawlers (WhatsApp/Telegram/Slack fetch shared URLs). The key travels inside the fragment too — it has to, since a recipient's browser never touches the organizer's `localStorage` — so this is still obfuscation against anyone who has the full link, not encryption with a secret only the organizer holds; what it defends against is the payload leaking through channels that never see the fragment. `src/pages/Pairing.tsx` reads `location.hash` and calls `decryptAssignmentFragment` to reveal the recipient.

Pre-Phase-2 links used a hardcoded key (`ENCRYPTION_KEY_BYTES`, still in `crypto.ts` as `encryptText`/`decryptText`) with `from`/`to`/`info` in the **query string** instead. `Pairing.tsx` still detects and decrypts that format for backward compatibility — `loadPairing` tries the fragment first, then falls back to `searchParams`.

**Two routes, defined in `src/index.tsx`:**
- `/` → `Home` (organizer view: manage participants, generate pairings, get links)
- `/pairing` → `Pairing` (recipient view: decrypts and displays one assignment, fragment or legacy query string)
- `/pairing.html` → redirects to `/pairing` preserving query params (legacy URL compat)

Router `basename` comes from `import.meta.env.BASE_URL`, which is set via `vite.config.ts`'s `base` (`/tukar-kado/`) — this matters for the GitHub Pages subpath deployment.

**Pairing generation (`src/utils/generatePairs.ts`).** Participants can have at most one `must` rule (forces a specific receiver) and any number of `mustNot` rules (excludes candidates); a self-targeting `must` rule is the one case where self-pairing is allowed. Assigning everyone is a bipartite perfect-matching problem (each participant is both a giver and a receiver), solved exactly via `findPerfectMatching` — DFS augmenting paths (Kuhn's algorithm) over `buildCandidateReceivers`'s candidate sets, with candidate and processing order shuffled so which valid matching gets picked varies between calls. Being exact (not greedy-with-restarts), it never spuriously fails on a satisfiable-but-tight rule set. `generatePairs` still just returns `GeneratedPairs | null`; when it returns `null`, call `diagnoseInfeasibility` separately to get a specific reason (`InfeasibilityReason`, an i18n key + params) — it re-derives candidate sets to check the common explainable conflicts (self-conflicting rules, two givers `must`-targeting the same receiver, a giver with no candidates, a participant nobody can give to) before falling back to a generic `errors.invalidPairs`. `Home.tsx` calls it only on the failure path. `generateGenerationHash` fingerprints the current participants' rules/hints/`groupId` so the UI (`SecretSantaLinks`) can detect when participants changed since pairings were generated and prompt a regeneration.

**Groups.** A participant can carry a free-text `groupId` (e.g. "Smith Family" — any string; equal values mean the same group, there's no separate group entity). `buildCandidateReceivers` excludes a giver's own group-mates from their candidate set, the same way `mustNot` does — and like `mustNot`, an explicit `must` rule overrides it. Edited via the group field in `RulesModal` (with a `<datalist>` suggesting group names already in use elsewhere).

**Participant text format (`src/utils/parseParticipants.ts`).** The text-view editor (toggle in `Home`) uses a compact per-line syntax: `Name (hint) =mustTarget !mustNotTarget #groupId`. `parseParticipantsText`/`formatParticipantText` round-trip between this text and the `Record<string, Participant>` map that's otherwise edited via the form UI (`ParticipantsList`/`ParticipantRow`). `wishlistUrl` deliberately isn't representable here — URLs routinely contain `=`/`!`, which this format's parser (`EXTRAS_START`) treats as rule delimiters — it stays form/CSV-only. `ParticipantsList`'s CSV importer (via PapaParse) expects `Name`/`Address`/`Phone`/`Gift Hint`/`Notes`/`Group`/`Wishlist URL` columns (English headers only for now — no bilingual/fuzzy header matching yet). Both the text format and the CSV importer are alternate ways of producing the same `Participants` map — keep them in sync if the `Participant` shape changes. `src/utils/exampleParticipants.ts` builds a fixed 6-person example set (via this same text parser) for the "Try an Example" empty-state button in `ParticipantsList`.

**State shape.** `Participants = Record<string, Participant>` keyed by a `crypto.randomUUID()` id (not name), so renaming a participant doesn't break rules that reference their id. `Home` persists `participants`, `assignments` (`GeneratedPairs`), `instructions`, and `eventMetadata` (`EventMetadata` — event name/date, exchange deadline, budget min/max) via `useLocalStorage` (`src/hooks/useLocalStorage.ts`), a plain `useState` + `useEffect`-writes-to-`localStorage` hook with an optional `migrate` function for reshaping previously-stored data. `src/utils/eventBackup.ts` exports/imports all four as one JSON file (`Settings`'s "Export/Import Event" buttons) — the only way to recover an event after `localStorage` is cleared, since nothing lives server-side.

**Component conventions:**
- Immutable updates to the participants map go through `immer`'s `produce` (see `ParticipantsList.tsx`, `RulesModal.tsx`) rather than manual spreading.
- Styling is Tailwind utility classes inline; no CSS modules or styled-components. Icons from `@phosphor-icons/react`.
- Translation strings go through `react-i18next`'s `useTranslation`/`Trans`; add new keys to both `src/i18n/en.ts` and `src/i18n/id.ts` (`id` is the fallback/default language, not `en`).
- `Accordion`/`AccordionContainer` implement the collapsible sections on the Home page; `Home` tracks which single section is open via `openSection` state.

## Tests

Tests live alongside the code they cover (`*.test.ts`) and run under Vitest. `generatePairs.test.ts` uses `fast-check` for property-based testing of the pairing algorithm (invariants: everyone gives/receives exactly once, `must`/`mustNot` rules are respected, impossible configurations return `null`) — when touching `generatePairs.ts`, prefer extending these property tests over only adding example-based cases. It also brute-forces every permutation for small participant counts as an independent feasibility oracle (`generatePairs` must return non-`null` iff a valid assignment actually exists — this is what catches spurious failures on tight-but-satisfiable rules), checks `diagnoseInfeasibility` against hand-built conflict scenarios, and has a `describe('groups', ...)` block covering group exclusion / `must` overriding it / the generation hash changing with `groupId`. `crypto.test.ts` and `links.test.ts` similarly use `fast-check` to round-trip encrypt/decrypt and the assignment-fragment format (including Unicode/emoji payloads) and to lock in legacy-link decryption. `eventBackup.test.ts` round-trips `parseEventBackup`. `exampleParticipants.test.ts` locks in that the fixed example dataset actually generates valid pairings (regenerated repeatedly, since the matcher shuffles) and respects the rules/group it showcases. `crypto.ts`/`base64url.ts` use the global `crypto`/`btoa`/`atob` (not `window.crypto`) specifically so they work under Vitest's default `node` environment without needing jsdom.
