"use client";

import type { Dictionary } from "@/lib/i18n";
import { KeyRound, LogIn, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {
  error: "",
};

type Labels = {
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
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

  const errorText = state.error ? (messages[state.error] ?? state.error) : "";

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="admin-label">
        {labels.usernameLabel}
        <span className="relative mt-2 block">
          <UserRound
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            autoComplete="username"
            className="admin-field input-with-icon"
            name="username"
            placeholder={labels.usernamePlaceholder}
            type="text"
          />
        </span>
      </label>

      <label className="admin-label">
        {labels.passwordLabel}
        <span className="relative mt-2 block">
          <KeyRound
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            autoComplete="current-password"
            className="admin-field input-with-icon"
            name="password"
            placeholder={labels.passwordPlaceholder}
            type="password"
          />
        </span>
      </label>

      {errorText ? <div className="message-error">{errorText}</div> : null}

      <Link className="text-sm font-medium text-[var(--accent-strong)]" href="/admin/reset-password">
        {labels.forgotPassword}
      </Link>

      <button className="btn-primary" disabled={pending} type="submit">
        <LogIn size={15} aria-hidden />
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
