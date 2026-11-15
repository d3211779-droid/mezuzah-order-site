"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "הזמנות", match: (p: string) => p === "/admin" || p.startsWith("/admin/orders") },
  { href: "/admin/catalog", label: "קטלוג", match: (p: string) => p.startsWith("/admin/catalog") },
  { href: "/admin/settings", label: "הגדרות", match: (p: string) => p.startsWith("/admin/settings") },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="ניווט ראשי" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-full px-5 font-semibold transition ${
              active ? "bg-brown text-white" : "bg-white text-brown hover:bg-gold-soft"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
