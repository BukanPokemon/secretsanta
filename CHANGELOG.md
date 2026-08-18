# Changelog

All notable changes to Tukar Kado are documented here. Dates are when a
change shipped to the live site.

## 1.0.0 (2026-08-17)

First public launch of Tukar Kado, a from-scratch rebuild of
[arcanis/secretsanta](https://github.com/arcanis/secretsanta) focused on
Indonesian organizers and on making the "nothing is collected about you"
claim actually true, not just stated.

### Privacy & security
- Recipient data is no longer encrypted with a key hardcoded in the public
  repo. Each pairing round now gets its own random 256-bit key, and the
  whole payload (who's assigned to whom, hints, address, event info) moves
  from the URL query string into the fragment (the part after `#`), which
  browsers never send to a server. That's what keeps a shared link out of
  hosting logs, `Referer` headers, and the requests link-preview bots make
  when WhatsApp or Telegram unfurl a shared URL.
- Old-style links from before this change still work; no assignments break
  because of the rebuild.

### Matching
- Replaced the old greedy pairing algorithm (which could spuriously fail on
  a valid-but-tight set of rules) with an exact matching algorithm. If a
  valid set of pairings exists, it's found.
- When pairing genuinely isn't possible, you now get a specific reason
  ("Budi and Ani both must give to Citra") instead of a generic error.
- Added groups: tag participants (e.g. a couple, a family) so they never
  draw each other, without hand-adding exclusion rules for every pair.

### Input & import
- Added a "Try an Example" button: see a real set of pairings generated
  within seconds, no data entry required.
- Spreadsheet import now supports `.xlsx` directly (not just CSV), matches
  Indonesian *or* English column headers automatically, and always shows a
  preview with per-row errors before anything is imported; nothing happens
  silently.
- Event details (name, date, budget) and a per-participant wishlist link.

### Distribution
- Send each participant's link over WhatsApp with one tap (phone numbers
  normalized from local `08xx` format automatically).
- QR codes and printable slips for in-person exchanges.
- A warning against opening your own link, and tracking for who's already
  been sent theirs.

### Reveal page
- Redesigned so the recipient's name never sits in the page until the giver
  deliberately taps to reveal it: not hidden by CSS, genuinely absent from
  the page until then.
- Shows the event's budget, date, and a wishlist link when the organizer
  provided them.

### Findability
- Indonesian and English now live at distinct, indexable URLs (`/id/`,
  `/en/`) instead of one URL with a language switch, with a proper tutorial
  page in each language.
- Pages are prerendered to static HTML at build time, so search engines and
  link-preview bots see real content immediately.

### Also
- Cookieless visit counting (Cloudflare Web Analytics): no cookies, no
  consent banner, and never loaded on the reveal page.
