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
