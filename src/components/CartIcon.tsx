"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/context";

/** Cart button for the top bar: the icon with a badge showing how many units are in the cart. */
export default function CartIcon() {
  const { ready, count } = useCart();
  const shown = ready ? count : 0;

  return (
    <Link
      href="/cart"
      aria-label={shown > 0 ? `סל הקניות, ${shown} פריטים` : "סל הקניות, ריק"}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-brown transition hover:bg-white"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.4 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </svg>
      {shown > 0 && (
        <span
          data-cart-badge
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold leading-none text-white"
        >
          {shown}
        </span>
      )}
    </Link>
  );
}
