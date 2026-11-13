/** Which drawing the live preview uses for a model. */
export type GlyphId = "flame" | "shin";

export type MezuzahModel = {
  id: string;
  name: string;
  glyph: GlyphId;
  /** Path inside /public, always starting with /images/mezuzahs/ (lowercase - case-sensitive on Vercel). */
  image: string;
  imageAlt: string;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  available: boolean;
};

export type FillId = "none" | "single";

export type FillOption = {
  id: FillId;
  name: string;
  description: string;
};

export const models: MezuzahModel[] = [
  {
    id: "flame-large",
    name: "אש גדול",
    glyph: "flame",
    image: "/images/mezuzahs/flame-large.jpg",
    imageAlt: "מזוזה בדגם אש גדול",
  },
  {
    id: "flame-small",
    name: "אש קטן",
    glyph: "flame",
    image: "/images/mezuzahs/flame-small.jpg",
    imageAlt: "מזוזה בדגם אש קטן",
  },
  {
    id: "flame-side-large",
    name: "אש שלי על הצד גדול",
    glyph: "flame",
    image: "/images/mezuzahs/flame-side-large.jpg",
    imageAlt: "מזוזה בדגם אש שלי על הצד גדול",
  },
  {
    id: "flame-side-small",
    name: "אש שלי על הצד קטן",
    glyph: "flame",
    image: "/images/mezuzahs/flame-side-small.jpg",
    imageAlt: "מזוזה בדגם אש שלי על הצד קטן",
  },
  {
    id: "shin-large",
    name: "ש גדול",
    glyph: "shin",
    image: "/images/mezuzahs/shin-large.jpg",
    imageAlt: "מזוזה בדגם ש גדול",
  },
  {
    id: "shin-small",
    name: "ש קטן",
    glyph: "shin",
    image: "/images/mezuzahs/shin-small.jpg",
    imageAlt: "מזוזה בדגם ש קטן",
  },
  {
    id: "shin-smallest",
    name: "ש הכי קטן",
    glyph: "shin",
    image: "/images/mezuzahs/shin-smallest.jpg",
    imageAlt: "מזוזה בדגם ש הכי קטן",
  },
  {
    id: "shin-regular-large",
    name: "ש רגילה גדול",
    glyph: "shin",
    image: "/images/mezuzahs/shin-regular-large.jpg",
    imageAlt: "מזוזה בדגם ש רגילה גדול",
  },
  {
    id: "shin-regular-small",
    name: "ש רגילה קטן",
    glyph: "shin",
    image: "/images/mezuzahs/shin-regular-small.jpg",
    imageAlt: "מזוזה בדגם ש רגילה קטן",
  },
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
];

export function getModel(id: string | null) {
  return models.find((m) => m.id === id) ?? null;
}

export function getColor(id: string | null) {
  return colors.find((c) => c.id === id) ?? null;
}

export function getFill(id: string) {
  return fills.find((f) => f.id === id) ?? fills[0];
}
