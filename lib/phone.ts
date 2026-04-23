/** Normalize Ukrainian phone to +380XXXXXXXXX */
export function normalizeUaPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) {
    return `+${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+38${digits}`;
  }
  if (digits.length === 9) {
    return `+380${digits}`;
  }
  if (input.startsWith("+380") && digits.length === 12) {
    return `+${digits}`;
  }
  return input.trim();
}

/**
 * `tel:` URI for GSM voice dialer (national 0XXXXXXXXX). Avoids some devices
 * preferring WhatsApp for `tel:+380…` links.
 */
export function voiceDialHref(input: string): string {
  const e164 = normalizeUaPhone(input);
  const m = e164.match(/^\+380(\d{9})$/);
  if (m) return `tel:0${m[1]}`;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `tel:${digits}`;
  return `tel:${e164.replace(/\s/g, "")}`;
}
