export default function Swatch({ hex, className = "h-4 w-4" }: { hex: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-black/20 ${className}`}
      style={{ backgroundColor: hex }}
    />
  );
}
