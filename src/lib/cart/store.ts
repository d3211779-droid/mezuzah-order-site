"use client";

/**
 * The shopping cart lives in the browser (localStorage) so it survives a refresh.
 *
 * What is stored: ids, personal text and quantity only - NEVER a price and NEVER customer
 * details. Prices are always re-read from the catalog for display and re-computed by the
 * database when the order is placed, so nothing in here can change what a customer pays.
 */

export const MAX_QUANTITY = 20;
export const MAX_LINES = 20;
const STORAGE_KEY = "mezuzah-cart-v1";

export type CartLine = {
  /** Same configuration = same key, so adding it again raises the quantity. */
  key: string;
  modelId: string;
  /** Name at the time it was added - only shown if the model disappears from the catalog. */
  modelName: string;
  bodyColorId: string;
  fillType: "none" | "single";
  fillColorId: string | null;
  personalText: string;
  /** null = no parchment. Only the id is stored; name and price always come from the catalog. */
  parchmentId: string | null;
  quantity: number;
};

export type NewCartLine = Omit<CartLine, "key" | "quantity">;

export const lineKey = (
  l: Pick<CartLine, "modelId" | "bodyColorId" | "fillType" | "fillColorId" | "personalText" | "parchmentId">,
) => [l.modelId, l.bodyColorId, l.fillType, l.fillColorId ?? "", l.personalText.trim(), l.parchmentId ?? ""].join("|");

const clampQuantity = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(n)));

/** Reads whatever is in storage defensively: anything odd is dropped, never trusted. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    const list = data && typeof data === "object" ? (data as { lines?: unknown }).lines : null;
    if (!Array.isArray(list)) return [];
    const merged = new Map<string, CartLine>();
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const l = item as Record<string, unknown>;
      if (
        typeof l.modelId !== "string" ||
        typeof l.bodyColorId !== "string" ||
        (l.fillType !== "none" && l.fillType !== "single") ||
        (l.fillColorId !== null && typeof l.fillColorId !== "string") ||
        typeof l.personalText !== "string" ||
        typeof l.quantity !== "number" ||
        !Number.isFinite(l.quantity)
      ) {
        continue;
      }
      const line: CartLine = {
        key: "",
        modelId: l.modelId,
        modelName: typeof l.modelName === "string" ? l.modelName.slice(0, 80) : "",
        bodyColorId: l.bodyColorId,
        fillType: l.fillType,
        fillColorId: l.fillType === "single" ? (l.fillColorId as string | null) : null,
        personalText: l.personalText.slice(0, 30),
        // carts saved before parchments existed have no such field = no parchment
        parchmentId: typeof l.parchmentId === "string" && l.parchmentId ? l.parchmentId : null,
        quantity: clampQuantity(l.quantity),
      };
      line.key = lineKey(line);
      const existing = merged.get(line.key);
      if (existing) existing.quantity = clampQuantity(existing.quantity + line.quantity);
      else if (merged.size < MAX_LINES) merged.set(line.key, line);
    }
    return [...merged.values()];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------- store

export type CartSnapshot = { ready: boolean; lines: CartLine[] };

/** What the server (and the first client render) sees: an empty cart that is not "ready" yet. */
const SERVER_SNAPSHOT: CartSnapshot = { ready: false, lines: [] };
export const getServerSnapshot = (): CartSnapshot => SERVER_SNAPSHOT;

let cache: CartSnapshot | null = null;
let cachedRaw: string | null | undefined;
/** Used only when localStorage is blocked (private mode): the cart then lives for this visit. */
let memoryLines: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getSnapshot(): CartSnapshot {
  if (memoryLines) {
    if (!cache || cache.lines !== memoryLines) cache = { ready: true, lines: memoryLines };
    return cache;
  }
  const raw = readRaw();
  if (cache && raw === cachedRaw) return cache;
  cachedRaw = raw;
  cache = { ready: true, lines: parseCart(raw) };
  return cache;
}

function emit() {
  cache = null;
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lines }));
    memoryLines = null;
  } catch {
    memoryLines = lines;
  }
  emit();
}

const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY || e.key === null) emit();
};

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// ---------------------------------------------------------------- actions

export type AddResult = { ok: true } | { ok: false; reason: "max-lines" | "max-quantity" };

export function addLine(input: NewCartLine): AddResult {
  const lines = getSnapshot().lines;
  const line: CartLine = { ...input, personalText: input.personalText.trim(), key: "", quantity: 1 };
  line.key = lineKey(line);

  const existing = lines.find((l) => l.key === line.key);
  if (existing) {
    if (existing.quantity >= MAX_QUANTITY) return { ok: false, reason: "max-quantity" };
    write(lines.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + 1 } : l)));
    return { ok: true };
  }
  if (lines.length >= MAX_LINES) return { ok: false, reason: "max-lines" };
  write([...lines, line]);
  return { ok: true };
}

export function setQuantity(key: string, quantity: number) {
  write(getSnapshot().lines.map((l) => (l.key === key ? { ...l, quantity: clampQuantity(quantity) } : l)));
}

export function removeLine(key: string) {
  write(getSnapshot().lines.filter((l) => l.key !== key));
}

export function clearCart() {
  write([]);
}
