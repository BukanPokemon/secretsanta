// Single source for site-wide, non-secret configuration — the goal is that
// changing a domain, a social link, or a budget preset means editing this
// file, not hunting through components. See CLAUDE.md's "Content
// management" section for what still lives elsewhere and why (guide/FAQ
// copy is markdown under src/content/, not here).
//
// scripts/prerender.mjs (a plain Node script, not compiled) can't import
// this file directly, so SITE_URL is duplicated there and in
// public/robots.txt — keep those in sync if this changes.

export const SITE_URL = "https://bukanpawkemon.github.io/tukar-kado";

export const REPO_URL = "https://github.com/BukanPawkemon/tukar-kado";
export const ISSUES_URL = `${REPO_URL}/issues`;
export const UPSTREAM_REPO_URL = "https://github.com/arcanis/secretsanta";
export const SUPPORT_URL = "https://trakteer.id/BukanPawkemon";

export interface BudgetPreset {
  min: number;
  max: number;
}

// Quick-select budget ranges offered in Settings alongside the free-entry
// min/max fields. Currency-specific (not just re-formatted from one list)
// since a number that reads as a sensible gift budget in Rupiah doesn't in
// Dollars, and Settings already switches currency by locale (formatBudget).
export const BUDGET_PRESETS: Record<"IDR" | "USD", BudgetPreset[]> = {
  IDR: [
    { min: 25_000, max: 50_000 },
    { min: 50_000, max: 100_000 },
    { min: 100_000, max: 200_000 },
    { min: 200_000, max: 500_000 },
  ],
  USD: [
    { min: 5, max: 10 },
    { min: 10, max: 20 },
    { min: 20, max: 50 },
    { min: 50, max: 100 },
  ],
};

// Cloudflare Web Analytics site token (Phase 11) — cookieless, no personal
// data processed, so no consent banner is needed for it. Not a secret (like
// a GA Measurement ID, it's meant to sit in public client-side HTML) — see
// useWebAnalytics.ts for where/why it's actually loaded.
export const CLOUDFLARE_ANALYTICS_TOKEN: string | undefined = "7f906d11457141949ae7de982c95f78a";

// No flags in use yet — this exists so a future one has a single place to
// go, rather than an ad-hoc env var or prop threaded through by hand.
export const FEATURE_FLAGS = {} satisfies Record<string, boolean>;
