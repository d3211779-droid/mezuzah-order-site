"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/admin/actions";

type NavLink = { href: string; label: string; match: (path: string) => boolean };

const LINKS: NavLink[] = [
  { href: "/admin", label: "ראשי", match: (p) => p === "/admin" },
  { href: "/admin/orders", label: "הזמנות", match: (p) => p.startsWith("/admin/orders") },
  { href: "/admin/models", label: "דגמים", match: (p) => p.startsWith("/admin/models") },
  { href: "/admin/colors", label: "צבעים", match: (p) => p.startsWith("/admin/colors") },
  { href: "/admin/fills", label: "מילויים", match: (p) => p.startsWith("/admin/fills") },
  { href: "/admin/settings", label: "הגדרות", match: (p) => p.startsWith("/admin/settings") },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="ניווט ראשי">
      <ul className="space-y-1">
        {LINKS.map((l) => {
          const active = l.match(pathname);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center rounded-xl border-s-4 px-4 text-base font-semibold transition ${
                  active
                    ? "border-gold bg-white text-brown shadow-sm"
                    : "border-transparent text-brown-soft hover:bg-white/70 hover:text-brown"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li>
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center rounded-xl border-s-4 border-transparent px-4 text-base font-semibold text-brown-soft transition hover:bg-white/70 hover:text-error"
            >
              התנתקות
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Admin navigation. Desktop (lg and up): a sidebar on the right (the page is RTL).
 * Phone / tablet: a compact top bar with a hamburger that opens the same menu.
 */
export default function AdminNav() {
  const pathname = usePathname();
  // Remember WHERE the menu was opened: it closes by itself as soon as the page changes.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-line bg-cream-deep/60 px-3 py-6 lg:flex">
        <Link href="/admin" className="mb-6 px-4 text-xl font-bold">
          לוח ניהול
        </Link>
        <NavList pathname={pathname} />
        <Link href="/" className="mt-auto px-4 py-3 text-sm font-medium text-gold-deep">
          לדף ההזמנה ללקוחות ←
        </Link>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/admin" className="text-lg font-bold">
            לוח ניהול
          </Link>
          <button
            type="button"
            onClick={() => setOpenAt(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-semibold"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2 4.5h14M2 9h14M2 13.5h14" />}
            </svg>
            תפריט
          </button>
        </div>
        {open && (
          <div id="admin-mobile-menu" className="border-t border-line bg-cream px-3 py-3">
            <NavList pathname={pathname} onNavigate={() => setOpenAt(null)} />
          </div>
        )}
      </header>
    </>
  );
}
