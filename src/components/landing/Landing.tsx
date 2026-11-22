import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { loadCatalog } from "@/lib/catalog/load";
import type { Catalog } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/money";
import ModelImage from "../ModelImage";

const ctaClass =
  "inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold px-8 text-lg font-bold text-white shadow-sm transition hover:bg-[#9c7a3e] active:scale-[0.99]";

const sectionClass = "mx-auto max-w-6xl px-4 py-10 md:py-14";

/**
 * The three real photos in the hero. They share one crop (1:2, the mezuzah centred and filling about 80%
 * of the height), so object-cover shows each one whole, never stretched.
 */
const HERO_PHOTOS = [
  { src: "/images/hero/hero-black-gold.jpg", alt: "מזוזה שחורה עם עיטור להבה זהוב" },
  { src: "/images/hero/hero-stone-door.jpg", alt: "מזוזה בגוון אבן מותקנת על משקוף הדלת" },
  { src: "/images/hero/hero-white-gold.jpg", alt: "מזוזה לבנה עם עיטור להבה זהוב" },
];

function SectionTitle({ id, children, sub }: { id: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 text-center md:mb-8">
      <h2 id={id} className="text-2xl font-bold md:text-3xl">
        {children}
      </h2>
      {sub && <p className="mx-auto mt-2 max-w-2xl leading-7 text-brown-soft">{sub}</p>}
    </div>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold-deep"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

/** The cheapest model that can actually be ordered, in agorot (null = nothing is priced yet). */
function lowestPrice(catalog: Catalog): number | null {
  const prices = catalog.models.flatMap((m) => (m.priceAgorot === null ? [] : [m.priceAgorot]));
  return prices.length ? Math.min(...prices) : null;
}

function Faq({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details data-faq className="group rounded-2xl border border-line bg-white px-5 py-1 shadow-sm open:pb-4">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-start font-bold marker:hidden [&::-webkit-details-marker]:hidden">
        <h3 className="text-base font-bold md:text-lg">{question}</h3>
        <span aria-hidden="true" className="shrink-0 text-2xl leading-none text-gold-deep transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="leading-7 text-brown-soft">{children}</p>
    </details>
  );
}

/**
 * The home page. Everything that depends on the shop (the "from" price, the models, whether a
 * parchment is offered, the usage notes) is read from the live catalog, so the page never promises
 * something the order screen cannot do.
 */
export default async function Landing() {
  // Prices and availability change in the admin panel: always render at request time.
  await connection();
  const result = await loadCatalog();
  const catalog = result.ok ? result.catalog : null;

  const from = catalog ? lowestPrice(catalog) : null;
  const hasParchment = !!catalog && catalog.parchments.length > 0;
  const models = catalog?.models ?? [];
  const settings = catalog?.settings;
  const closedBack = settings?.closedBackTitle
    ? `${settings.closedBackTitle}${settings.closedBackText ? `, ${settings.closedBackText}` : ""}.`
    : "";
  const usageNote = settings?.usageNote ?? "";

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pb-4 pt-8 text-center md:pt-14">
        <h1 id="hero-title" className="text-3xl font-bold leading-tight md:text-5xl">
          מזוזות מעוצבות בהתאמה אישית
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-brown-soft">
          מזוזות מודפסות בתלת־ממד, בעיצובים מיוחדים ובמגוון צבעים, עם אפשרות לכיתוב אישי{hasParchment ? " ולהוספת קלף" : ""}.
        </p>
        {from !== null && (
          <p data-from-price className="mt-5 text-xl font-bold text-gold-deep">
            החל מ־{formatPrice(from)}
          </p>
        )}
        <div className="mt-5">
          <Link href="/design" className={ctaClass}>
            לבחירת המזוזה שלי
          </Link>
        </div>

        <ul data-hero-photos className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3 sm:gap-5">
          {HERO_PHOTOS.map((photo, i) => (
            <li key={photo.src} className="rounded-2xl border border-line bg-paper p-1.5 shadow-sm sm:p-2">
              <span className="relative block aspect-[1/2] overflow-hidden rounded-xl bg-white">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  preload={i === 0}
                  sizes="(min-width: 640px) 190px, 30vw"
                  className="object-cover object-center"
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------ why */}
      <section aria-labelledby="fit-title" className={sectionClass}>
        <SectionTitle
          id="fit-title"
          sub={
            <>
              בחרו את הדגם שאתם אוהבים, את צבע המזוזה, את צבע המילוי והוסיפו כיתוב אישי.
              {hasParchment && (
                <>
                  <br />
                  אפשר גם להוסיף קלף ישירות להזמנה ולקבל הכול יחד.
                </>
              )}
            </>
          }
        >
          מזוזה שמתאימה בדיוק לבית שלכם
        </SectionTitle>

        <h3 className="mb-4 text-center text-lg font-bold text-gold-deep">למה לבחור במזוזה שלנו?</h3>
        <ul className={`grid gap-4 ${hasParchment ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <li className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <Icon>
              <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" />
              <path d="M14 7l3 3" />
            </Icon>
            <h4 className="text-lg font-bold">עיצוב אישי</h4>
            <p className="mt-1 leading-7 text-brown-soft">בחרו דגם, צבע וכיתוב והפכו כל מזוזה לאישית ומיוחדת.</p>
          </li>
          <li className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <Icon>
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
              <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />
            </Icon>
            <h4 className="text-lg font-bold">מיוצר במיוחד עבורכם</h4>
            <p className="mt-1 leading-7 text-brown-soft">כל מזוזה מודפסת בתלת־ממד בהתאם לבחירה שלכם.</p>
          </li>
          {hasParchment && (
            <li data-landing-parchment className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <Icon>
                <path d="M7 4h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z" />
                <path d="M9 9h6M9 13h6" />
              </Icon>
              <h4 className="text-lg font-bold">אפשרות להוסיף קלף</h4>
              <p className="mt-1 leading-7 text-brown-soft">אפשר לבחור קלף מתאים כחלק מההזמנה, בלי לחפש בנפרד.</p>
            </li>
          )}
        </ul>
      </section>

      {/* ------------------------------------------------------------ models */}
      <section id="models" aria-labelledby="models-title" className={sectionClass}>
        <SectionTitle id="models-title" sub="מצאו את העיצוב שמתאים לכם והתחילו לעצב.">
          בחרו את המזוזה שלכם
        </SectionTitle>
        {models.length === 0 ? (
          <p role="status" className="rounded-2xl border border-line bg-white p-6 text-center text-brown-soft">
            הקטלוג לא זמין כרגע. אפשר לנסות שוב בעוד רגע, או לעבור{" "}
            <Link href="/design" className="font-semibold text-gold-deep underline underline-offset-4">
              למסך העיצוב
            </Link>
            .
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {models.map((m) => {
              const price = m.priceAgorot;
              return (
                <li key={m.id} data-landing-model className="flex flex-col rounded-2xl border-2 border-line bg-paper p-2 sm:p-3">
                  <ModelImage model={m} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 46vw" />
                  <div className="mt-2 flex-1 px-1">
                    <h3 className="text-sm font-semibold leading-tight sm:text-base">{m.name}</h3>
                    {price !== null ? (
                      <p className="text-sm font-bold text-gold-deep">{formatPrice(price)}</p>
                    ) : (
                      <p className="text-xs text-brown-soft sm:text-sm">המחיר יעודכן בקרוב</p>
                    )}
                  </div>
                  {price !== null && (
                    <Link
                      href={`/design?model=${encodeURIComponent(m.id)}`}
                      className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-gold px-3 text-sm font-bold text-white transition hover:bg-[#9c7a3e] sm:text-base"
                    >
                      לבחירת הדגם
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section aria-labelledby="how-title" className={sectionClass}>
        <SectionTitle id="how-title">איך זה עובד?</SectionTitle>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["בוחרים עיצוב", "בחרו את דגם המזוזה שאתם הכי אוהבים."],
            ["מעצבים", "בחרו צבע, מילוי וכיתוב אישי."],
            [
              "מוסיפים לסל",
              hasParchment
                ? "אפשר להוסיף גם קלף, להמשיך למזוזות נוספות ולשלוח הזמנה אחת מסודרת."
                : "אפשר להמשיך למזוזות נוספות ולשלוח הזמנה אחת מסודרת.",
            ],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-4 rounded-3xl border border-line bg-white p-5 shadow-sm md:block md:text-center">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-lg font-bold text-white md:mx-auto md:mb-3"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold">
                  <span className="sr-only">{i + 1}. </span>
                  {title}
                </h3>
                <p className="mt-1 leading-7 text-brown-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ parchment */}
      {hasParchment && (
        <section aria-labelledby="parchment-title" className={sectionClass}>
          <div className="rounded-3xl border border-gold-soft bg-[#fbf6ed] p-6 text-center md:p-10">
            <h2 id="parchment-title" className="text-2xl font-bold md:text-3xl">
              רוצים להוסיף גם קלף?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-brown-soft">
              במהלך עיצוב המזוזה תוכלו לבחור אם להזמין אותה עם או בלי קלף.
            </p>
            <p className="mx-auto mt-2 max-w-2xl leading-7 text-brown-soft">
              אם בחרתם קלף, המחיר יוצג בנפרד ובצורה ברורה לפני ההוספה לסל.
            </p>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ gift */}
      <section aria-labelledby="gift-title" className={sectionClass}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="gift-title" className="text-2xl font-bold md:text-3xl">
            מזוזה אישית היא גם מתנה מיוחדת
          </h2>
          <p className="mt-3 leading-7 text-brown-soft">
            מתנה לבית חדש, למשפחה, לחברים או פשוט דרך להוסיף טאץ&apos; אישי לכניסה לבית ולחדרים.
          </p>
          <p className="mt-2 leading-7 text-brown-soft">עם שם, מילה קצרה או עיצוב שמתאים לסגנון שלכם.</p>
        </div>
      </section>

      {/* ------------------------------------------------------------ good to know (texts come from the admin settings) */}
      {(usageNote || closedBack) && (
        <section aria-labelledby="know-title" className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-2xl border border-gold-soft bg-[#fbf6ed] p-5 md:p-6">
            <h2 id="know-title" className="text-lg font-bold">
              כדאי לדעת
            </h2>
            {usageNote && <p className="mt-2 whitespace-pre-line leading-7 text-brown-soft">{usageNote}</p>}
            {closedBack && <p className="mt-2 leading-7 text-brown-soft">{closedBack}</p>}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <SectionTitle id="faq-title">שאלות נפוצות</SectionTitle>
        <div className="space-y-3">
          <Faq question="אפשר להוסיף כיתוב אישי?">כן. ניתן להוסיף כיתוב אישי בהתאם למגבלת התווים שמופיעה באתר.</Faq>
          <Faq question="אפשר להזמין כמה מזוזות שונות?">כן. אפשר לעצב כל מזוזה בנפרד ולהוסיף את כולן לאותו סל.</Faq>
          {hasParchment && (
            <Faq question="אפשר להזמין קלף יחד עם המזוזה?">
              כן. במידה שיש קלף זמין, תופיע אפשרות להוסיף אותו במהלך עיצוב המזוזה.
            </Faq>
          )}
          <Faq question="אפשר לבחור צבע שונה לכל מזוזה?">
            כן. כל מזוזה נשמרת בסל עם הדגם, הצבע, המילוי והכיתוב שבחרתם עבורה.
          </Faq>
          {hasParchment && (
            <Faq question="האם המזוזה מגיעה עם קלף?">
              לא כברירת מחדל. אם תרצו קלף, תוכלו לבחור אותו כתוספת במהלך ההזמנה.
            </Faq>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ final call to action */}
      <section aria-labelledby="final-title" className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="rounded-3xl bg-brown p-8 text-center text-white md:p-12">
          <h2 id="final-title" className="text-2xl font-bold md:text-3xl">
            מוכנים לעצב את המזוזה שלכם?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#e7d6b6]">
            בחרו דגם, צבע וכיתוב והכינו מזוזה שמתאימה בדיוק לכם.
          </p>
          {from !== null && <p className="mt-4 text-xl font-bold text-gold-soft">החל מ־{formatPrice(from)}</p>}
          <div className="mt-5">
            <Link href="/design" className={ctaClass}>
              לעיצוב המזוזה שלי
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function LandingLoading() {
  return (
    <p role="status" className="px-4 py-24 text-center text-brown-soft">
      טוען…
    </p>
  );
}
