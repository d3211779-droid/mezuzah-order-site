/**
 * Site settings: the few texts and numbers the shop owner can change from the admin panel
 * (table `site_settings`, one row). Everything here is plain TypeScript so both the customer
 * page and the admin panel can share it.
 */
export type SiteSettings = {
  /** Max characters of the customer's personal text. */
  personalTextMax: number;
  /** Helper line under the personal-text field (print area). */
  personalTextSizeNote: string;
  /** Message on the order-confirmation screen. */
  confirmationMessage: string;
  /** Title of the "closed back" note. Empty = the whole note is hidden. */
  closedBackTitle: string;
  /** Second line of the "closed back" note. Empty = only the title is shown. */
  closedBackText: string;
  /** Body of the "good to know" card. Empty = the card is hidden. */
  usageNote: string;
};

export type SettingKey = keyof SiteSettings;

/**
 * The values the site shipped with. Used whenever the table, the row or a single field is
 * unavailable, so the customer page always works - exactly as before settings existed.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  personalTextMax: 8,
  personalTextSizeNote: "הכיתוב מותאם לשטח הדפסה ברוחב כ־2.5 ס״מ",
  confirmationMessage: "ניצור איתך קשר בטלפון לסגירת התשלום והאספקה.",
  closedBackTitle: "המזוזה סגורה מאחור",
  closedBackText: "למראה נקי ולשמירה על הקלף",
  usageNote:
    "המזוזות מיועדות בעיקר להתקנה בתוך הבית או בכניסה מקורה ומוגנת. בכניסה חיצונית החשופה ישירות לשמש ולגשם מומלץ להתייעץ איתנו לפני ההזמנה.",
};

export type SettingGroupId = "personalText" | "confirmation" | "productInfo" | "goodToKnow";

export type SettingField = {
  key: SettingKey;
  /** Column name in `site_settings`. */
  column: string;
  group: SettingGroupId;
  label: string;
  help: string;
  kind: "number" | "text" | "textarea";
  /** Number fields: allowed range. Text fields: max length. */
  min?: number;
  max: number;
  /** false = may be left empty, which hides that part of the site. */
  required: boolean;
  /** Shown under an optional field while it is empty. */
  emptyNote?: string;
};

/** The database hard limit for the personal text (create_order and the table both stop at 30). */
export const PERSONAL_TEXT_HARD_MAX = 30;

export const SETTING_GROUPS: { id: SettingGroupId; title: string; description: string }[] = [
  { id: "personalText", title: "טקסט אישי", description: "הכיתוב שהלקוח יכול להוסיף על המזוזה." },
  { id: "confirmation", title: "מסך אישור הזמנה", description: "מה הלקוח רואה מיד אחרי שליחת ההזמנה." },
  { id: "productInfo", title: "מידע על המזוזה", description: "הערה על מבנה המזוזה שמופיעה בסיכום ההזמנה." },
  { id: "goodToKnow", title: "כדאי לדעת", description: "הכרטיס עם ההמלצה בתחתית טופס ההזמנה." },
];

export const SETTING_FIELDS: SettingField[] = [
  {
    key: "personalTextMax",
    column: "personal_text_max",
    group: "personalText",
    label: "מגבלת תווים לטקסט האישי",
    help: `מספר שלם בין 1 ל-${PERSONAL_TEXT_HARD_MAX}. המגבלה נאכפת בטופס ההזמנה.`,
    kind: "number",
    min: 1,
    max: PERSONAL_TEXT_HARD_MAX,
    required: true,
  },
  {
    key: "personalTextSizeNote",
    column: "personal_text_size_note",
    group: "personalText",
    label: "הסבר על שטח ההדפסה",
    help: "מופיע מתחת לשדה הטקסט האישי.",
    kind: "text",
    max: 200,
    required: true,
  },
  {
    key: "confirmationMessage",
    column: "confirmation_message",
    group: "confirmation",
    label: "הודעה במסך אישור הזמנה",
    help: "מופיעה מתחת למספר ההזמנה.",
    kind: "textarea",
    max: 400,
    required: true,
  },
  {
    key: "closedBackTitle",
    column: "closed_back_title",
    group: "productInfo",
    label: "כותרת הערת מבנה המזוזה",
    help: "לדוגמה: המזוזה סגורה מאחור.",
    kind: "text",
    max: 80,
    required: false,
    emptyNote: "השדה ריק: כל אזור ההערה לא יוצג באתר.",
  },
  {
    key: "closedBackText",
    column: "closed_back_text",
    group: "productInfo",
    label: "טקסט משנה להערת המבנה",
    help: "שורה קטנה מתחת לכותרת. מוצגת רק אם יש כותרת.",
    kind: "text",
    max: 200,
    required: false,
    emptyNote: "השדה ריק: תוצג הכותרת בלבד.",
  },
  {
    key: "usageNote",
    column: "usage_note",
    group: "goodToKnow",
    label: "טקסט הכרטיס",
    help: "ההסבר על שימוש בתוך הבית או במקום מקורה.",
    kind: "textarea",
    max: 500,
    required: false,
    emptyNote: "השדה ריק: כרטיס ״כדאי לדעת״ לא יוצג באתר.",
  },
];

export const SETTING_COLUMNS = SETTING_FIELDS.map((f) => f.column).join(", ");

export type FieldCheck = { ok: true; value: string | number } | { ok: false; error: string };

/** One validator for everything: used by the admin form, the server action and the reader. */
export function checkSetting(field: SettingField, raw: unknown): FieldCheck {
  if (field.kind === "number") {
    const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
    if (!Number.isInteger(n) || n < (field.min ?? 0) || n > field.max) {
      return { ok: false, error: `יש להזין מספר שלם בין ${field.min} ל-${field.max}.` };
    }
    return { ok: true, value: n };
  }
  if (typeof raw !== "string") return { ok: false, error: "הערך אינו תקין." };
  const value = raw.trim();
  if (field.required && value === "") return { ok: false, error: "שדה חובה. אפשר לשחזר ברירת מחדל." };
  if (value.length > field.max) return { ok: false, error: `עד ${field.max} תווים.` };
  return { ok: true, value };
}

/**
 * Builds the settings from a database row. Every field is checked on its own: a missing or
 * invalid field falls back to its default and never affects the others. Empty text is kept
 * as empty ONLY for optional fields (that is how a section is hidden).
 */
export function parseSettings(row: unknown): SiteSettings {
  const source = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const result: Record<string, string | number> = { ...DEFAULT_SETTINGS };
  for (const field of SETTING_FIELDS) {
    const raw = source[field.column];
    if (raw === undefined || raw === null) continue;
    const checked = checkSetting(field, raw);
    if (checked.ok) result[field.key] = checked.value;
  }
  return result as SiteSettings;
}
