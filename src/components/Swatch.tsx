import { swatchStyle, type SwatchSize } from "@/lib/colors/swatch";

/** The one place a colour circle is drawn (customer site and admin). Textured colours get their pattern here. */
export default function Swatch({
  hex,
  name,
  size = "sm",
  className = "h-4 w-4",
}: {
  hex: string;
  name?: string | null;
  size?: SwatchSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-black/20 ${className}`}
      style={swatchStyle(hex, name, size)}
    />
  );
}
