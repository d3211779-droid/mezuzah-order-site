import type { Catalog, Color, Fill, Model, Parchment } from "@/lib/catalog/types";
import type { CartLine } from "./store";

export type LineProblem = "model" | "price" | "color" | "fill" | "fill-color" | "parchment";

export type ResolvedLine = {
  line: CartLine;
  model: Model | null;
  bodyColor: Color | null;
  fill: Fill | null;
  fillColor: Color | null;
  parchment: Parchment | null;
  /** Current catalog prices in agorot - for DISPLAY only. The database prices the real order. */
  modelPriceAgorot: number | null;
  /** Surcharge of the chosen parchment (null = no parchment). Already included in unitPriceAgorot. */
  parchmentPriceAgorot: number | null;
  /** Mezuzah + parchment, per unit. */
  unitPriceAgorot: number | null;
  lineTotalAgorot: number | null;
  /** Set when the line cannot be ordered any more (it must be removed first). */
  problem: LineProblem | null;
};

export const PROBLEM_TEXT: Record<LineProblem, string> = {
  model: "הדגם הזה כבר לא זמין.",
  price: "המחיר של הדגם הזה אינו זמין כרגע.",
  color: "צבע הגוף שנבחר כבר לא זמין.",
  fill: "סוג המילוי שנבחר כבר לא זמין.",
  "fill-color": "צבע המילוי שנבחר כבר לא זמין.",
  parchment: "הקלף שנבחר כבר לא זמין.",
};

/** Matches the saved cart against the live catalog (what is still orderable, at what price). */
export function resolveCart(lines: CartLine[], catalog: Catalog): { items: ResolvedLine[]; totalAgorot: number; hasProblems: boolean } {
  const items = lines.map((line): ResolvedLine => {
    const model = catalog.models.find((m) => m.id === line.modelId) ?? null;
    const bodyColor = catalog.colors.find((c) => c.id === line.bodyColorId) ?? null;
    const fill = catalog.fills.find((f) => f.id === line.fillType) ?? null;
    const fillColor = line.fillType === "single" ? (catalog.colors.find((c) => c.id === line.fillColorId) ?? null) : null;

    const parchment = line.parchmentId ? (catalog.parchments.find((p) => p.id === line.parchmentId) ?? null) : null;

    let problem: LineProblem | null = null;
    if (!model) problem = "model";
    else if (model.priceAgorot === null) problem = "price";
    else if (!bodyColor) problem = "color";
    else if (!fill) problem = "fill";
    else if (line.fillType === "single" && !fillColor) problem = "fill-color";
    else if (line.parchmentId && !parchment) problem = "parchment";

    const modelPriceAgorot = problem === null && model ? model.priceAgorot : null;
    const parchmentPriceAgorot = modelPriceAgorot !== null && parchment ? parchment.priceAgorot : null;
    const unitPriceAgorot = modelPriceAgorot === null ? null : modelPriceAgorot + (parchmentPriceAgorot ?? 0);
    return {
      line,
      model,
      bodyColor,
      fill,
      fillColor,
      parchment,
      modelPriceAgorot,
      parchmentPriceAgorot,
      unitPriceAgorot,
      lineTotalAgorot: unitPriceAgorot === null ? null : unitPriceAgorot * line.quantity,
      problem,
    };
  });
  const totalAgorot = items.reduce((sum, i) => sum + (i.lineTotalAgorot ?? 0), 0);
  return { items, totalAgorot, hasProblems: items.some((i) => i.problem !== null) };
}
