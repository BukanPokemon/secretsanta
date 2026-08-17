import { describe, it, expect } from 'vitest';
import { loadGuide, loadFaq } from './guideContent';

describe('loadGuide', () => {
  it('parses the H1 title, intro, and H2 sections for each locale', () => {
    for (const lang of ['id', 'en']) {
      const guide = loadGuide(lang);
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.introText.length).toBeGreaterThan(0);
      expect(guide.introHtml).toContain('<p>');
      expect(guide.sections.length).toBeGreaterThanOrEqual(5);
      for (const section of guide.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.bodyText.length).toBeGreaterThan(0);
        expect(section.bodyHtml).toContain('<p>');
      }
    }
  });

  it('throws for an unknown locale rather than silently returning empty content', () => {
    expect(() => loadGuide('fr')).toThrow();
  });
});

describe('loadFaq', () => {
  it('parses each question/answer pair for each locale', () => {
    for (const lang of ['id', 'en']) {
      const faq = loadFaq(lang);
      expect(faq.length).toBeGreaterThanOrEqual(5);
      for (const item of faq) {
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answerText.length).toBeGreaterThan(0);
        expect(item.answerHtml).toContain('<p>');
      }
    }
  });
});
