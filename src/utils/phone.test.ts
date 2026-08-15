import { describe, it, expect } from 'vitest';
import { normalizePhoneToE164, buildWhatsAppLink } from './phone';

describe('normalizePhoneToE164', () => {
  it('converts a local Indonesian number (leading 0) to E.164', () => {
    expect(normalizePhoneToE164('081234567890')).toBe('6281234567890');
  });

  it('strips punctuation and whitespace before normalizing', () => {
    expect(normalizePhoneToE164('0812-3456-7890')).toBe('6281234567890');
    expect(normalizePhoneToE164('0812 3456 7890')).toBe('6281234567890');
    expect(normalizePhoneToE164('(0812) 3456-7890')).toBe('6281234567890');
  });

  it('accepts a number already in E.164 form', () => {
    expect(normalizePhoneToE164('6281234567890')).toBe('6281234567890');
  });

  it('strips a leading + and keeps the rest', () => {
    expect(normalizePhoneToE164('+6281234567890')).toBe('6281234567890');
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(normalizePhoneToE164('')).toBeNull();
    expect(normalizePhoneToE164('   ')).toBeNull();
  });

  it('returns null for input with no digits', () => {
    expect(normalizePhoneToE164('n/a')).toBeNull();
  });

  it('returns null for a number that is too short or too long to be real', () => {
    expect(normalizePhoneToE164('012')).toBeNull();
    expect(normalizePhoneToE164('0' + '1'.repeat(20))).toBeNull();
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with the normalized number and encoded message', () => {
    const link = buildWhatsAppLink('081234567890', 'Hello there!');
    expect(link).toBe('https://wa.me/6281234567890?text=Hello%20there!');
  });

  it('returns null when the phone number cannot be normalized', () => {
    expect(buildWhatsAppLink('', 'Hello')).toBeNull();
  });

  it('percent-encodes special characters and newlines in the message', () => {
    const link = buildWhatsAppLink('081234567890', 'Line 1\nLine 2 & more');
    expect(link).toContain('Line%201%0ALine%202');
  });
});
