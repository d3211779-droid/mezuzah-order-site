import { getColor, getModel, getPattern } from "@/data/catalog";

export const MAX_PERSONAL_TEXT = 15;
export const MAX_NOTE = 300;

export type OrderValues = {
  modelId: string | null;
  colorId: string | null;
  fillId: string;
  fillColorId: string | null;
  fillColor2Id: string | null;
  patternId: string | null;
  personalText: string;
  fullName: string;
  phone: string;
  note: string;
};

export type FieldKey =
  | "model"
  | "color"
  | "fill"
  | "personalText"
  | "fullName"
  | "phone";
export type OrderErrors = Partial<Record<FieldKey, string>>;

// Hebrew letters, niqqud, spaces, geresh/gershayim and a hyphen - nothing else.
const HEBREW_ONLY = /^[א-תְ-ׇ\s׳״'"\-]+$/;

// Israeli mobile (05X), landline (02/03/04/08/09) and VoIP (07X) numbers.
const ISRAELI_PHONE = /^(05\d{8}|0[23489]\d{7}|07\d{8})$/;

/** Strips separators and converts +972 / 972 prefixes to a leading 0. */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  const intl = cleaned.match(/^(?:\+|00)?972(0?)(\d+)$/);
  return intl ? `0${intl[2]}` : cleaned;
}

export function validateOrder(values: OrderValues): OrderErrors {
  const errors: OrderErrors = {};

  if (!getModel(values.modelId)) errors.model = "יש לבחור דגם";

  const color = getColor(values.colorId);
  if (!color) errors.color = "יש לבחור צבע";
  else if (!color.available) errors.color = "הצבע שנבחר אינו זמין";

  const fillColorOk = (id: string | null) => getColor(id)?.available === true;
  if (values.fillId === "single" && !fillColorOk(values.fillColorId)) {
    errors.fill = "יש לבחור צבע למילוי";
  } else if (values.fillId === "double") {
    if (!fillColorOk(values.fillColorId) || !fillColorOk(values.fillColor2Id)) {
      errors.fill = "יש לבחור שני צבעים למילוי";
    } else if (values.fillColorId === values.fillColor2Id) {
      errors.fill = "יש לבחור שני צבעים שונים";
    }
  } else if (values.fillId === "pattern" && !getPattern(values.patternId)) {
    errors.fill = "יש לבחור דוגמה למילוי";
  }

  const text = values.personalText.trim();
  if (text) {
    if (values.personalText.length > MAX_PERSONAL_TEXT) {
      errors.personalText = `הטקסט ארוך מדי – עד ${MAX_PERSONAL_TEXT} תווים`;
    } else if (!HEBREW_ONLY.test(text)) {
      errors.personalText = "הטקסט האישי יכול להכיל אותיות בעברית בלבד";
    }
  }

  if (values.fullName.trim().length < 2) {
    errors.fullName = "יש להזין שם מלא";
  }

  const phone = values.phone.trim();
  if (!phone) errors.phone = "יש להזין מספר טלפון";
  else if (!ISRAELI_PHONE.test(normalizePhone(phone))) {
    errors.phone = "מספר הטלפון אינו תקין (לדוגמה: 050-1234567)";
  }

  return errors;
}

export const FIELD_ORDER: FieldKey[] = [
  "model",
  "color",
  "fill",
  "personalText",
  "fullName",
  "phone",
];

/** DOM id to focus for the first invalid field. */
export const FIELD_DOM_ID: Record<FieldKey, string> = {
  model: "section-model",
  color: "section-color",
  fill: "section-fill",
  personalText: "personalText",
  fullName: "fullName",
  phone: "phone",
};
