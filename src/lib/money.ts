/**
 * Money is always a whole number of AGOROT (4990 = 49.90 shekels). Integers keep every sum and
 * product exact; shekels with decimals only exist when formatting for display or reading input.
 */
export const MAX_PRICE_AGOROT = 1_000_000; // 10,000 shekels - the same limit as the database

const whole = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const withAgorot = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 4900 -> "49 ₪", 4990 -> "49.90 ₪". */
export function formatPrice(agorot: number): string {
  return agorot % 100 === 0 ? whole.format(agorot / 100) : withAgorot.format(agorot / 100);
}

/** A price as the database returns it: a positive whole number of agorot, otherwise "no price". */
export function asPriceAgorot(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_PRICE_AGOROT ? value : null;
}

export type ParsedPrice = { ok: true; agorot: number | null } | { ok: false; error: string };

/**
 * Reads what the admin typed, in shekels ("49", "49.9", "49,90"). Empty means "no price".
 * Works on the digits, never on floating point.
 */
export function parseShekels(input: string): ParsedPrice {
  const text = input.trim().replace(/^₪\s*/, "").replace(/\s*₪$/, "");
  if (text === "") return { ok: true, agorot: null };
  const match = text.match(/^(\d{1,5})(?:[.,](\d{1,2}))?$/);
  if (!match) return { ok: false, error: "יש להזין מחיר בשקלים, לדוגמה 49 או 49.90." };
  const agorot = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  if (agorot < 1 || agorot > MAX_PRICE_AGOROT) return { ok: false, error: "המחיר חייב להיות בין 0.01 ל-10,000 ₪." };
  return { ok: true, agorot };
}

/** 4900 -> "49", 4990 -> "49.90" - the value shown inside the admin price input. */
export function agorotToInput(agorot: number | null): string {
  if (agorot === null) return "";
  return agorot % 100 === 0 ? String(agorot / 100) : (agorot / 100).toFixed(2);
}
