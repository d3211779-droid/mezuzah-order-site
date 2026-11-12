export type MezuzahModel = {
  id: string;
  name: string;
  image: string;
};

export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  available: boolean;
};

export const models: MezuzahModel[] = [
  {
    id: "flame",
    name: "להבה",
    image: "/images/mezuzahs/flame.jpg",
  },
  {
    id: "israel",
    name: "מפת ישראל",
    image: "/images/mezuzahs/israel.jpg",
  },
  {
    id: "shin",
    name: "ש׳ מודרנית",
    image: "/images/mezuzahs/shin.jpg",
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
