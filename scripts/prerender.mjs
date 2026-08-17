// Post-build prerender pass: serves the just-built dist/ locally, visits
// each indexable route in a headless browser, and saves the fully-rendered
// DOM as static HTML. This is what makes per-route <title>/meta/hreflang
// (set client-side by useDocumentMeta) and JSON-LD actually show up in the
// HTML a crawler or link-preview bot fetches, instead of only appearing
// after JS runs. Also generates sitemap.xml.
//
// /pairing is deliberately not prerendered here — it's unique per person,
// has nothing worth indexing, and is already excluded via robots.txt.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

// Matches vite.config.ts's `base` — hardcoded there too, not read from an
// env var, so kept consistent here rather than depending on the (currently
// unused) VITE_BASE_URL passed into the build step.
const BASE_PATH = "/tukar-kado";
// Keep in sync with src/config/site.ts's SITE_URL — this is a plain Node
// script (not compiled), so it can't import that TS module directly.
const SITE_URL = "https://bukanpawkemon.github.io/tukar-kado";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

function serveDist(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  // dist/ has no /tukar-kado subdirectory — Vite's `base` only affects the
  // URLs *referenced inside* the built HTML/JS, not dist/'s own layout —
  // so the base prefix has to come off before resolving against distDir.
  if (urlPath.startsWith(BASE_PATH)) {
    urlPath = urlPath.slice(BASE_PATH.length) || "/";
  }
  let filePath = path.join(distDir, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    // SPA fallback — mirrors the dist/index.html -> 404.html trick GitHub
    // Pages uses in production for any route this script hasn't rendered
    // a real file for yet (which, mid-prerender, is every target route).
    filePath = path.join(distDir, "index.html");
  }

  const ext = path.extname(filePath);
  res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

const ROUTES = [
  { canonicalPath: "/id/", outFile: "id/index.html" },
  { canonicalPath: "/en/", outFile: "en/index.html" },
  { canonicalPath: "/id/panduan/", outFile: "id/panduan/index.html" },
  { canonicalPath: "/en/guide/", outFile: "en/guide/index.html" },
];

async function main() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist/ not found at ${distDir} — run the build before prerendering.`);
  }

  const server = http.createServer(serveDist);
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  const origin = `http://localhost:${port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    for (const route of ROUTES) {
      const url = `${origin}${BASE_PATH}${route.canonicalPath}`;
      console.log(`Prerendering ${route.canonicalPath}`);

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForSelector("h1", { timeout: 10_000 });
      // Give useDocumentMeta's effect a tick to run after the h1 paints.
      await page.waitForTimeout(150);

      const html = await page.content();
      const outPath = path.join(distDir, route.outFile);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
    }
  } finally {
    await browser.close();
    server.close();
  }

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ROUTES.map(r => [
      "  <url>",
      `    <loc>${SITE_URL}${r.canonicalPath}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);

  console.log(`Prerendered ${ROUTES.length} routes and wrote sitemap.xml`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
