import Link from "next/link";
import CartIcon from "./CartIcon";

/** Slim bar at the top of every customer page: the site name and the cart (always in reach on a phone). */
export default function SiteBar() {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
        <Link href="/" className="inline-flex min-h-11 items-center font-bold text-brown">
          מזוזה בעיצוב אישי
        </Link>
        <CartIcon />
      </div>
    </div>
  );
}
