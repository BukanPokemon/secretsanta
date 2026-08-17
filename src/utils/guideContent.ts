// Loads the guide/FAQ markdown under src/content/{lang}/ — the whole point
// of moving this content out of src/i18n/*.ts is that editing the tutorial
// becomes editing a .md file (on github.com if need be), not touching a
// TypeScript object literal. `eager: true` bundles all of it at build
// time (it's small, static, and known content, not something to
// code-split); `query: '?raw'` gets the file as a plain string.
import { marked } from "marked";

const guideFiles = import.meta.glob("../content/*/guide.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const faqFiles = import.meta.glob("../content/*/faq.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface GuideSection {
  title: string;
  bodyText: string;
  bodyHtml: string;
}

export interface ParsedGuide {
  title: string;
  introText: string;
  introHtml: string;
  sections: GuideSection[];
}

export interface FaqItem {
  question: string;
  answerText: string;
  answerHtml: string;
}

function localeFromPath(path: string): string {
  return path.match(/\/content\/([a-z]{2})\//)?.[1] ?? "id";
}

function findByLocale(files: Record<string, string>, lang: string): string {
  const entry = Object.entries(files).find(([path]) => localeFromPath(path) === lang);
  if (!entry) {
    throw new Error(`No content found for locale "${lang}"`);
  }
  return entry[1];
}

// Splits markdown on '## ' headings into (text before the first heading,
// [{ title, body }, ...]) — the one structural convention this content is
// expected to follow, whether it's a numbered tutorial step or an FAQ
// question.
function splitOnH2(raw: string): { before: string; sections: { title: string; body: string }[] } {
  const sections: { title: string; body: string }[] = [];
  const beforeLines: string[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;

  for (const line of raw.trim().split("\n")) {
    if (line.startsWith("## ")) {
      if (current) sections.push({ title: current.title, body: current.bodyLines.join("\n").trim() });
      current = { title: line.slice(3).trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      beforeLines.push(line);
    }
  }
  if (current) sections.push({ title: current.title, body: current.bodyLines.join("\n").trim() });

  return { before: beforeLines.join("\n").trim(), sections };
}

function stripH1(text: string): { title: string; rest: string } {
  const lines = text.split("\n");
  if (lines[0]?.startsWith("# ")) {
    return { title: lines[0].slice(2).trim(), rest: lines.slice(1).join("\n").trim() };
  }
  return { title: "", rest: text };
}

function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}

export function loadGuide(lang: string): ParsedGuide {
  const { title, rest } = stripH1(findByLocale(guideFiles, lang));
  const { before: introText, sections } = splitOnH2(rest);

  return {
    title,
    introText,
    introHtml: renderMarkdown(introText),
    sections: sections.map(s => ({
      title: s.title,
      bodyText: s.body,
      bodyHtml: renderMarkdown(s.body),
    })),
  };
}

export function loadFaq(lang: string): FaqItem[] {
  const { sections } = splitOnH2(findByLocale(faqFiles, lang));
  return sections.map(s => ({
    question: s.title,
    answerText: s.body,
    answerHtml: renderMarkdown(s.body),
  }));
}
