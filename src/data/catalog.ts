export type ModelId = "flame" | "israel" | "shin";

export type MezuzahModel = {
  id: ModelId;
  name: string;
  description: string;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  available: boolean;
};

export type FillId = "none" | "single" | "double" | "pattern";

export type FillOption = {
  id: FillId;
  name: string;
  description: string;
};

export const models: MezuzahModel[] = [
  { id: "flame", name: "להבה", description: "קווים חמים ונקיים" },
  { id: "israel", name: "מפת ישראל", description: "סמל אהוב ומוכר" },
  { id: "shin", name: "ש׳ מודרנית", description: "האות ש׳ בעיצוב עכשווי" },
];

export const colors: ProductColor[] = [
  { id: "black", name: "שחור", hex: "#222222", available: true },
  { id: "white", name: "לבן", hex: "#F8F6F0", available: true },
  { id: "beige", name: "בז׳", hex: "#D8C7A6", available: true },
  { id: "stone", name: "אבן מנוקד", hex: "#B7A98D", available: true },
  { id: "burgundy", name: "בורדו", hex: "#7B2634", available: true },
  { id: "blue", name: "כחול", hex: "#315A7D", available: true },
  { id: "gold", name: "זהב", hex: "#C7A24A", available: false },
];

export const fills: FillOption[] = [
  { id: "none", name: "ללא מילוי", description: "גוף אחיד וחלק" },
  { id: "single", name: "צבע אחד", description: "מילוי בצבע לבחירתכם" },
  { id: "double", name: "שני צבעים", description: "מילוי דו־גווני" },
  { id: "pattern", name: "דוגמה", description: "דוגמה מהרשימה" },
];

export type PatternId = "stripes" | "dots" | "grid";

export type PatternOption = { id: PatternId; name: string };

// Temporary examples - the real list will be managed from the admin panel later.
export const patterns: PatternOption[] = [
  { id: "stripes", name: "פסים" },
  { id: "dots", name: "נקודות" },
  { id: "grid", name: "משבצות" },
];

export function getPattern(id: string | null) {
  return patterns.find((p) => p.id === id) ?? null;
}

export function getModel(id: string | null) {
  return models.find((m) => m.id === id) ?? null;
}

export function getColor(id: string | null) {
  return colors.find((c) => c.id === id) ?? null;
}

export function getFill(id: string) {
  return fills.find((f) => f.id === id) ?? fills[0];
}
