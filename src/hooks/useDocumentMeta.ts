import { useEffect } from "react";
import { SITE_URL } from "../config/site";

export interface DocumentMetaOptions {
  title: string;
  description: string;
  /** Path relative to SITE_URL, e.g. "/id/" or "/en/guide/". */
  path: string;
  lang: "id" | "en";
  /** Other locales this same page exists in, for hreflang alternates. */
  alternates?: { lang: string; path: string }[];
  /** Path relative to SITE_URL for the Open Graph/Twitter image. */
  ogImagePath?: string;
  noindex?: boolean;
}

const MANAGED_ATTR = "data-managed-meta";

function upsertHeadTag(tag: "meta" | "link", matchAttrs: Record<string, string>, valueAttr: string, value: string) {
  const selector = Object.entries(matchAttrs).map(([k, v]) => `[${k}="${v}"]`).join("");
  let el = document.head.querySelector(`${tag}${selector}`);
  if (!el) {
    el = document.createElement(tag);
    Object.entries(matchAttrs).forEach(([k, v]) => el!.setAttribute(k, v));
    el.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(el);
  }
  el.setAttribute(valueAttr, value);
}

/**
 * Sets document.title and the head tags search engines/social crawlers read
 * (description, canonical, hreflang alternates, OG/Twitter) directly on the
 * DOM. This is deliberately imperative rather than a `<head>`-managing
 * library: the prerender script captures the live DOM *after* this effect
 * runs, so whatever's here at that point is what ships as static HTML —
 * no separate "inject metadata into the prerendered file" step needed.
 */
export function useDocumentMeta(opts: DocumentMetaOptions) {
  useEffect(() => {
    document.documentElement.lang = opts.lang;
    document.title = opts.title;

    upsertHeadTag("meta", { name: "description" }, "content", opts.description);
    upsertHeadTag("meta", { property: "og:title" }, "content", opts.title);
    upsertHeadTag("meta", { property: "og:description" }, "content", opts.description);
    upsertHeadTag("meta", { property: "og:url" }, "content", `${SITE_URL}${opts.path}`);
    upsertHeadTag("meta", { property: "og:locale" }, "content", opts.lang === "id" ? "id_ID" : "en_US");
    upsertHeadTag("meta", { name: "twitter:title" }, "content", opts.title);
    upsertHeadTag("meta", { name: "twitter:description" }, "content", opts.description);

    if (opts.ogImagePath) {
      const imageUrl = `${SITE_URL}${opts.ogImagePath}`;
      upsertHeadTag("meta", { property: "og:image" }, "content", imageUrl);
      upsertHeadTag("meta", { name: "twitter:image" }, "content", imageUrl);
      upsertHeadTag("meta", { name: "twitter:card" }, "content", "summary_large_image");
    }

    upsertHeadTag("link", { rel: "canonical" }, "href", `${SITE_URL}${opts.path}`);

    for (const alt of opts.alternates ?? []) {
      upsertHeadTag("link", { rel: "alternate", hreflang: alt.lang }, "href", `${SITE_URL}${alt.path}`);
    }
    if (opts.alternates?.length) {
      const defaultPath = opts.alternates.find(a => a.lang === "id")?.path ?? opts.path;
      upsertHeadTag("link", { rel: "alternate", hreflang: "x-default" }, "href", `${SITE_URL}${defaultPath}`);
    }

    upsertHeadTag("meta", { name: "robots" }, "content", opts.noindex ? "noindex, nofollow" : "index, follow");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.title, opts.description, opts.path, opts.lang, opts.ogImagePath, opts.noindex, JSON.stringify(opts.alternates)]);
}
