import type { Catalog } from "@/lib/catalog/types";

// The personal-text limit and its helper text come from the admin settings (catalog.settings).
export const MAX_NOTE = 300;

/** One mezuzah as the customer configures it (the cart holds many of these). */
export type ItemValues = {
  modelId: string | null;
  colorId: string | null;
  fillId: string;
  fillColorId: string | null;
  personalText: string;
};

/** The contact details, entered once at checkout (never stored in the browser). */
export type CustomerValues = {
  fullName: string;
  phone: string;
  note: string;
};

export type ItemFieldKey = "model" | "color" | "fill" | "personalText";
export type CustomerFieldKey = "fullName" | "phone";
export type FieldKey = ItemFieldKey | CustomerFieldKey;
export type ItemErrors = Partial<Record<ItemFieldKey, string>>;
export type CustomerErrors = Partial<Record<CustomerFieldKey, string>>;

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

/** Validates against the live catalog: it only holds active models and available colours / fills. */
export function validateItem(values: ItemValues, catalog: Catalog): ItemErrors {
  const errors: ItemErrors = {};
  const hasColor = (id: string | null) => catalog.colors.some((c) => c.id === id);

  const model = catalog.models.find((m) => m.id === values.modelId);
  if (!model) errors.model = "יש לבחור דגם";
  else if (model.priceAgorot === null) errors.model = "הדגם הזה אינו זמין להזמנה כרגע – המחיר יעודכן בקרוב";

  if (!values.colorId) errors.color = "יש לבחור צבע";
  else if (!hasColor(values.colorId)) errors.color = "הצבע שנבחר אינו זמין";

  if (!catalog.fills.some((f) => f.id === values.fillId)) {
    errors.fill = "יש לבחור סוג מילוי";
  } else if (values.fillId === "single" && !hasColor(values.fillColorId)) {
    errors.fill = "יש לבחור צבע למילוי";
  }

  const text = values.personalText.trim();
  if (text) {
    const max = catalog.settings.personalTextMax;
    if (values.personalText.length > max) {
      errors.personalText = `הטקסט ארוך מדי – עד ${max} תווים`;
    } else if (!HEBREW_ONLY.test(text)) {
      errors.personalText = "הטקסט האישי יכול להכיל אותיות בעברית בלבד";
    }
  }

  return errors;
}

/** Name and phone for the checkout form. */
export function validateCustomer(values: Pick<CustomerValues, "fullName" | "phone">): CustomerErrors {
  const errors: CustomerErrors = {};

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

export const ITEM_FIELD_ORDER: ItemFieldKey[] = ["model", "color", "fill", "personalText"];
export const CUSTOMER_FIELD_ORDER: CustomerFieldKey[] = ["fullName", "phone"];

/** DOM id to focus for the first invalid field. */
export const FIELD_DOM_ID: Record<FieldKey, string> = {
  model: "section-model",
  color: "section-color",
  fill: "section-fill",
  personalText: "personalText",
  fullName: "fullName",
  phone: "phone",
};
