import type { Parchment } from "./types";

/**
 * The sentence shown when a parchment is chosen, built from the admin's data:
 * "קלף בגודל 12 ס״מ, מתאים לבית המזוזה." The name itself is never hard-coded anywhere.
 */
export function parchmentInfo(p: Pick<Parchment, "sizeCm" | "description">): string {
  const description = p.description?.trim().replace(/[.\s]+$/, "");
  return `קלף בגודל ${p.sizeCm} ס״מ${description ? `, ${description}` : ""}.`;
}
