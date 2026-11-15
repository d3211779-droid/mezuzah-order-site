"use client";

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gold px-8 font-bold text-white transition hover:bg-[#9c7a3e]"
    >
      נסו שוב
    </button>
  );
}
