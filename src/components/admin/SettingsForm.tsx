"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/settings-actions";
import {
  DEFAULT_SETTINGS,
  SETTING_FIELDS,
  SETTING_GROUPS,
  checkSetting,
  type SettingField,
  type SiteSettings,
} from "@/lib/settings";
import { inputClass, primaryButton, secondaryButton } from "./catalog-ui";

/** One setting: input + live counter + validation + save + restore-default. */
function SettingRow({ field, initial }: { field: SettingField; initial: string }) {
  const defaultValue = String(DEFAULT_SETTINGS[field.key]);
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const id = `setting-${field.key}`;
  const dirty = value !== saved;
  const check = checkSetting(field, value);
  const error = dirty || message === null ? (check.ok ? null : check.error) : null;
  const isEmpty = value.trim() === "";
  const canRestore = value !== defaultValue;

  function save() {
    if (!check.ok) return;
    setMessage(null);
    start(async () => {
      const result = await saveSettings({ [field.key]: check.value });
      if (result.ok) {
        setSaved(String(check.value));
        setValue(String(check.value));
        setMessage({ ok: true, text: "נשמר" });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  const common = {
    id,
    value,
    disabled: pending,
    "aria-invalid": !!error,
    "aria-describedby": `${id}-help`,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement> & React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setValue(e.target.value);
      setMessage(null);
    },
  };

  return (
    <div data-setting={field.key} className="py-4 first:pt-0 last:pb-0">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <label htmlFor={id} className="font-bold">
          {field.label}
          {!field.required && <span className="ms-2 text-sm font-normal text-brown-soft">(אופציונלי)</span>}
        </label>
        {field.kind !== "number" && (
          <span dir="ltr" data-counter className={`text-sm ${value.length > field.max ? "font-medium text-error" : "text-brown-soft"}`}>
            {value.length}/{field.max}
          </span>
        )}
      </div>
      <p id={`${id}-help`} className="mb-2 text-sm text-brown-soft">
        {field.help}
      </p>

      {field.kind === "number" ? (
        <input
          {...common}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          dir="ltr"
          className={`${inputClass} max-w-32 text-right`}
        />
      ) : field.kind === "textarea" ? (
        <textarea {...common} rows={3} className={`${inputClass} py-3`} />
      ) : (
        <input {...common} type="text" className={inputClass} />
      )}

      {!field.required && isEmpty && field.emptyNote && (
        <p data-empty-note className="mt-2 rounded-lg bg-[#fbf6ed] px-3 py-2 text-sm text-gold-deep">
          {field.emptyNote}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={!dirty || !check.ok || pending} className={`${primaryButton} !min-h-11 !px-5`}>
          {pending ? "שומר…" : "שמירה"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(defaultValue);
            setMessage(null);
          }}
          disabled={!canRestore || pending}
          className={`${secondaryButton} !min-h-11`}
        >
          שחזור ברירת מחדל
        </button>
        {message && (
          <span role="status" className={`text-sm font-medium ${message.ok ? "text-[#2f5f27]" : "text-error"}`}>
            {message.text}
          </span>
        )}
        {!message && dirty && <span className="text-sm text-brown-soft">יש שינויים שלא נשמרו</span>}
      </div>
    </div>
  );
}

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <div className="space-y-6">
      {SETTING_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`} className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 id={`group-${group.id}`} className="text-lg font-bold">
            {group.title}
          </h2>
          <p className="mb-4 text-sm text-brown-soft">{group.description}</p>
          <div className="divide-y divide-line">
            {SETTING_FIELDS.filter((f) => f.group === group.id).map((field) => (
              <SettingRow key={field.key} field={field} initial={String(settings[field.key])} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
