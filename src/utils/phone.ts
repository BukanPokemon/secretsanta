// Indonesian phone numbers are near-universally entered in local format
// (leading 0, e.g. "0812-3456-7890"), but wa.me links require E.164
// (country code, no leading 0, no punctuation). This is deliberately
// Indonesia-specific rather than a general international phone parser —
// matches the app's primary audience without pulling in a full phone
// number library for a "click to WhatsApp" convenience feature.
const INDONESIA_COUNTRY_CODE = "62";

export function normalizePhoneToE164(rawPhone: string): string | null {
  const trimmed = rawPhone.trim();
  if (!trimmed) return null;

  const digitsWithPlus = trimmed.replace(/[^\d+]/g, "");
  if (!digitsWithPlus) return null;

  let normalized: string;
  if (digitsWithPlus.startsWith("+")) {
    normalized = digitsWithPlus.slice(1);
  } else if (digitsWithPlus.startsWith("0")) {
    normalized = INDONESIA_COUNTRY_CODE + digitsWithPlus.slice(1);
  } else {
    normalized = digitsWithPlus;
  }

  // E.164 numbers are 8-15 digits total, country code included.
  return /^\d{8,15}$/.test(normalized) ? normalized : null;
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return null;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}
