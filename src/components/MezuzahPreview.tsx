import type { FillId, ModelId, PatternId } from "@/data/catalog";

const FLAME_PATH =
  "M0 -24 C9 -12 15 -5 15 6 A15 15 0 0 1 -15 6 C-15 0 -11 -5 -6 -9 C-6 -3 -2 0 0 -4 C2 -13 -2 -17 0 -24 Z";
const ISRAEL_PATH =
  "M-5 -26 L4 -23 L6 -15 L3 -8 L8 1 L4 9 L1 27 L-4 19 L-2 9 L-8 -2 L-5 -11 Z";

/** Perceived brightness 0-255, used to choose readable ink on any case colour. */
function brightness(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

type GlyphProps = {
  model: ModelId;
  fill: string;
  stroke?: string;
  accent?: string;
  pattern?: string;
};

function Glyph({ model, fill, stroke, accent, pattern }: GlyphProps) {
  const paint = pattern ?? fill;
  const common = { fill: paint, stroke, strokeWidth: stroke ? 1.2 : 0 };

  if (model === "flame") {
    return (
      <g>
        <path d={FLAME_PATH} {...common} />
        {accent && <path d={FLAME_PATH} fill={accent} transform="scale(.45) translate(0 26)" />}
      </g>
    );
  }
  if (model === "israel") {
    return (
      <g>
        <path d={ISRAEL_PATH} {...common} strokeLinejoin="round" />
        {accent && <circle cx="0" cy="-2" r="4" fill={accent} />}
      </g>
    );
  }
  return (
    <g>
      <text
        x="0"
        y="14"
        textAnchor="middle"
        fontSize="44"
        fontWeight="800"
        fill={paint}
        stroke={stroke}
        strokeWidth={stroke ? 1 : 0}
      >
        ש
      </text>
      {accent && <circle cx="0" cy="-20" r="3.5" fill={accent} />}
    </g>
  );
}

/** Small neutral model icon used on the model cards. */
export function ModelIcon({ model, className }: { model: ModelId; className?: string }) {
  return (
    <svg viewBox="-30 -34 60 68" className={className} aria-hidden="true">
      <Glyph model={model} fill="#B28B49" />
    </svg>
  );
}

type PreviewProps = {
  model: ModelId | null;
  colorHex: string | null;
  fill: FillId;
  fillHex: string | null;
  fillHex2: string | null;
  patternId: PatternId | null;
  text: string;
};

/** Illustrative mezuzah case that reacts to the current selections. */
export default function MezuzahPreview({
  model,
  colorHex,
  fill,
  fillHex,
  fillHex2,
  patternId,
  text,
}: PreviewProps) {
  const body = colorHex ?? "#E4DAC6";
  const dark = brightness(body) < 140;
  const ink = dark ? "#F7F2E8" : "#3C3028";
  const gold = "#C7A24A";

  let glyphFill = ink;
  let accent: string | undefined;
  let pattern: string | undefined;
  if (fill === "single") glyphFill = fillHex ?? gold;
  if (fill === "double") {
    glyphFill = fillHex ?? gold;
    accent = fillHex2 ?? ink;
  }
  if (fill === "pattern" && patternId) pattern = `url(#pat-${patternId})`;

  return (
    <svg
      viewBox="0 0 120 200"
      role="img"
      aria-label="תצוגה מקדימה להמחשה בלבד"
      className="mx-auto h-56 w-auto drop-shadow-md lg:h-44"
    >
      <defs>
        <pattern id="pat-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={gold} />
          <rect width="3" height="6" fill={ink} />
        </pattern>
        <pattern id="pat-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill={ink} />
          <circle cx="2.5" cy="2.5" r="1.4" fill={gold} />
        </pattern>
        <pattern id="pat-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill={ink} />
          <path d="M0 0H5M0 0V5" stroke={gold} strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="22" y="6" width="76" height="188" rx="14" fill={body} stroke="#00000022" />
      <rect x="30" y="14" width="60" height="172" rx="9" fill="none" stroke={ink} strokeOpacity=".25" />
      <circle cx="60" cy="24" r="3.2" fill={ink} fillOpacity=".35" />
      <circle cx="60" cy="176" r="3.2" fill={ink} fillOpacity=".35" />
      {model ? (
        <g transform="translate(60 82)">
          <Glyph model={model} fill={glyphFill} accent={accent} pattern={pattern} />
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
          fontSize={text.length > 11 ? 10 : 12}
          fontWeight="600"
          fill={ink}
        >
          {text.trim()}
        </text>
      )}
    </svg>
  );
}
