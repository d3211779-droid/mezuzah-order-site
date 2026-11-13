import type { FillId, GlyphId } from "@/data/catalog";

const FLAME_PATH =
  "M0 -24 C9 -12 15 -5 15 6 A15 15 0 0 1 -15 6 C-15 0 -11 -5 -6 -9 C-6 -3 -2 0 0 -4 C2 -13 -2 -17 0 -24 Z";
/** Perceived brightness 0-255, used to choose readable ink on any case colour. */
function brightness(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function Glyph({ model, fill }: { model: GlyphId; fill: string }) {
  if (model === "flame") return <path d={FLAME_PATH} fill={fill} />;
  return (
    <text x="0" y="14" textAnchor="middle" fontSize="44" fontWeight="800" fill={fill}>
      ש
    </text>
  );
}

/** Small neutral model icon used on the model cards. */
export function ModelIcon({ model, className }: { model: GlyphId; className?: string }) {
  return (
    <svg viewBox="-30 -34 60 68" className={className} aria-hidden="true">
      <Glyph model={model} fill="#B28B49" />
    </svg>
  );
}

type PreviewProps = {
  model: GlyphId | null;
  colorHex: string | null;
  fill: FillId;
  fillHex: string | null;
  text: string;
};

/** Illustrative mezuzah case that reacts to the current selections. */
export default function MezuzahPreview({ model, colorHex, fill, fillHex, text }: PreviewProps) {
  const body = colorHex ?? "#E4DAC6";
  const ink = brightness(body) < 140 ? "#F7F2E8" : "#3C3028";
  const glyphFill = fill === "single" ? (fillHex ?? "#C7A24A") : ink;

  return (
    <svg
      viewBox="0 0 120 200"
      role="img"
      aria-label="תצוגה מקדימה להמחשה בלבד"
      className="mx-auto h-56 w-auto drop-shadow-md lg:h-44"
    >
      <rect x="22" y="6" width="76" height="188" rx="14" fill={body} stroke="#00000022" />
      <rect x="30" y="14" width="60" height="172" rx="9" fill="none" stroke={ink} strokeOpacity=".25" />
      <circle cx="60" cy="24" r="3.2" fill={ink} fillOpacity=".35" />
      <circle cx="60" cy="176" r="3.2" fill={ink} fillOpacity=".35" />
      {model ? (
        <g transform="translate(60 82)">
          <Glyph model={model} fill={glyphFill} />
        </g>
      ) : (
        <text x="60" y="88" textAnchor="middle" fontSize="11" fill={ink} fillOpacity=".5">
          בחרו דגם
        </text>
      )}
      {text.trim() && (
        <text
          x="60"
          y="146"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill={ink}
        >
          {text.trim()}
        </text>
      )}
    </svg>
  );
}
