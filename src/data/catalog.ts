/**
 * Where the mezuzah sits inside its 1024x1024 source photo, measured once per image.
 * The gallery uses it to give every model the same size, centre and (when needed) a
 * small straightening rotation, with CSS only - the image files are never edited.
 */
export type ModelFit = {
  /** Centre of the mezuzah, in source pixels. */
  cx: number;
  cy: number;
  /** Visible height of the mezuzah, in source pixels. */
  h: number;
  /** Straightening rotation in degrees (negative = counter-clockwise). */
  tilt?: number;
};

export type MezuzahModel = {
  id: string;
  name: string;
  /** Path inside /public, always starting with /images/mezuzahs/ (lowercase - case-sensitive on Vercel). */
  image: string;
  imageAlt: string;
  fit: ModelFit;
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
    image: "/images/mezuzahs/flame-large.jpg",
    imageAlt: "מזוזה בדגם אש גדול",
    fit: { cx: 497, cy: 529, h: 833 },
  },
  {
    id: "flame-small",
    name: "אש קטן",
    image: "/images/mezuzahs/flame-small.jpg",
    imageAlt: "מזוזה בדגם אש קטן",
    fit: { cx: 497, cy: 517, h: 870, tilt: -5.4 },
  },
  {
    id: "flame-side-large",
    name: "אש שלי על הצד גדול",
    image: "/images/mezuzahs/flame-side-large.jpg",
    imageAlt: "מזוזה בדגם אש שלי על הצד גדול",
    fit: { cx: 492, cy: 524, h: 931 },
  },
  {
    id: "flame-side-small",
    name: "אש שלי על הצד קטן",
    image: "/images/mezuzahs/flame-side-small.jpg",
    imageAlt: "מזוזה בדגם אש שלי על הצד קטן",
    fit: { cx: 503, cy: 520, h: 915, tilt: -1.8 },
  },
  {
    id: "shin-large",
    name: "ש גדול",
    image: "/images/mezuzahs/shin-large.jpg",
    imageAlt: "מזוזה בדגם ש גדול",
    fit: { cx: 498, cy: 526, h: 898 },
  },
  {
    id: "shin-small",
    name: "ש קטן",
    image: "/images/mezuzahs/shin-small.jpg",
    imageAlt: "מזוזה בדגם ש קטן",
    fit: { cx: 482, cy: 524, h: 902 },
  },
  {
    id: "shin-smallest",
    name: "ש הכי קטן",
    image: "/images/mezuzahs/shin-smallest.jpg",
    imageAlt: "מזוזה בדגם ש הכי קטן",
    fit: { cx: 497, cy: 525, h: 851 },
  },
  {
    id: "shin-regular-large",
    name: "ש רגילה גדול",
    image: "/images/mezuzahs/shin-regular-large.jpg",
    imageAlt: "מזוזה בדגם ש רגילה גדול",
    fit: { cx: 492, cy: 527, h: 909 },
  },
  {
    id: "shin-regular-small",
    name: "ש רגילה קטן",
    image: "/images/mezuzahs/shin-regular-small.jpg",
    imageAlt: "מזוזה בדגם ש רגילה קטן",
    fit: { cx: 503, cy: 523, h: 892 },
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
