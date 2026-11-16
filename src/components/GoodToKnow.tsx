import { useCatalog } from "@/lib/catalog/context";

export default function GoodToKnow() {
  const { usageNote } = useCatalog().settings;
  // Empty text in the admin settings hides the whole card.
  if (!usageNote) return null;

  return (
    <div role="note" className="flex gap-4 rounded-2xl border border-gold-soft bg-[#fbf6ed] p-4 md:p-5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-0.5 h-7 w-7 shrink-0 text-gold-deep"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9.5h13V10" />
        <path d="M10 19.5v-5h4v5" />
      </svg>
      <div>
        <h2 className="font-bold">כדאי לדעת</h2>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-brown-soft">{usageNote}</p>
      </div>
    </div>
  );
}
