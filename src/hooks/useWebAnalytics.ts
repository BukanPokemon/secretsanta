import { useEffect } from "react";
import { CLOUDFLARE_ANALYTICS_TOKEN } from "../config/site";

const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

/**
 * Loads the Cloudflare Web Analytics beacon — a cookieless pageview counter
 * with no personal data processed, so it needs no consent banner.
 *
 * Only call this from pages whose URL never carries sensitive data.
 * Deliberately NOT called from Pairing.tsx: that page's URL fragment can
 * carry an encrypted gift-assignment payload (see links.ts), and nothing
 * about that page should ever risk reaching a third party, regardless of
 * what Cloudflare's beacon does or doesn't inspect.
 */
export function useWebAnalytics() {
  useEffect(() => {
    if (!CLOUDFLARE_ANALYTICS_TOKEN) return;
    if (document.querySelector(`script[src="${BEACON_SRC}"]`)) return;

    const script = document.createElement("script");
    script.defer = true;
    script.src = BEACON_SRC;
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN }));
    document.head.appendChild(script);
  }, []);
}
