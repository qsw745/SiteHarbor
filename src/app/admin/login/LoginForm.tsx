"use client";

import type { Dictionary } from "@/lib/i18n";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {
  error: "",
};

type Labels = {
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  submitting: string;
};

export function LoginForm({
  labels,
  messages,
}: {
  labels: Labels;
  messages: Dictionary["messages"];
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const errorText = state.error ? (messages[state.error]?.() ?? state.error) : "";

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="admin-label">
        {labels.passwordLabel}
        <input
          autoComplete="current-password"
          className="admin-field"
          name="password"
          placeholder={labels.passwordPlaceholder}
          type="password"
        />
      </label>

      {errorText ? <div className="message-error">{errorText}</div> : null}

      <button className="btn-primary" disabled={pending} type="submit">
        <LogIn size={15} aria-hidden />
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
