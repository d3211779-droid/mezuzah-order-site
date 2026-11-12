import type { ReactNode } from "react";

type Props = {
  id?: string;
  step: number;
  title: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export default function SectionCard({ id, step, title, hint, error, children }: Props) {
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`scroll-mt-4 rounded-3xl border bg-white p-5 shadow-sm outline-none md:p-7 ${
        error ? "border-error" : "border-line"
      }`}
    >
      <div className="mb-5">
        <span className="text-sm font-medium text-gold-deep">שלב {step}</span>
        <h2 id={id ? `${id}-title` : undefined} className="mt-1 text-2xl font-bold">
          {title}
        </h2>
        {hint && <p className="mt-2 text-sm text-brown-soft">{hint}</p>}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </section>
  );
}
