"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/admin/login/actions";

const initial: LoginState = { error: null };

const field =
  "w-full min-h-12 rounded-xl border border-[#dccfbd] bg-paper px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold-soft";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block font-medium">
          אימייל
        </label>
        <input id="email" name="email" type="email" dir="ltr" autoComplete="username" required className={`${field} text-right`} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block font-medium">
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className={`${field} text-right`}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fbeceb] p-3 text-sm font-medium text-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-14 w-full rounded-2xl bg-gold px-6 text-lg font-bold text-white transition hover:bg-[#9c7a3e] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}
