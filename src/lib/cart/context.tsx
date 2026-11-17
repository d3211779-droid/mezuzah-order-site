"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  addLine,
  clearCart,
  getServerSnapshot,
  getSnapshot,
  removeLine,
  setQuantity,
  subscribe,
  type AddResult,
  type CartLine,
  type NewCartLine,
} from "./store";

type CartApi = {
  /** false until the browser has read the saved cart (so pages do not flash "empty cart"). */
  ready: boolean;
  lines: CartLine[];
  /** Total number of units - what the badge shows. */
  count: number;
  add: (line: NewCartLine) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

/** Cart state for the whole customer site: React Context on top of the localStorage store. */
export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo<CartApi>(
    () => ({
      ready: snapshot.ready,
      lines: snapshot.lines,
      count: snapshot.lines.reduce((sum, l) => sum + l.quantity, 0),
      add: addLine,
      setQuantity,
      remove: removeLine,
      clear: clearCart,
    }),
    [snapshot],
  );
  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
