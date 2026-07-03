"use client";

import type { Dictionary } from "@/lib/i18n";
import { KeyRound, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {
  error: "",
};

type Labels = Dictionary["resetPassword"];

export function ResetPasswordForm({
  initialToken,
  labels,
  messages,
}: {
  initialToken: string;
  labels: Labels;
  messages: Dictionary["messages"];
}) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const errorText = state.error ? (messages[state.error] ?? state.error) : "";

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="admin-label">
        {labels.tokenLabel}
        <span className="relative mt-2 block">
          <ShieldCheck
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            autoComplete="one-time-code"
            className="admin-field pl-9"
            defaultValue={initialToken}
            name="token"
            placeholder={labels.tokenPlaceholder}
            type="password"
          />
        </span>
      </label>

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
            className="admin-field pl-9"
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
            autoComplete="new-password"
            className="admin-field pl-9"
            name="password"
            placeholder={labels.passwordPlaceholder}
            type="password"
          />
        </span>
      </label>

      <label className="admin-label">
        {labels.confirmPasswordLabel}
        <input
          autoComplete="new-password"
          className="admin-field mt-2"
          name="confirmPassword"
          placeholder={labels.confirmPasswordPlaceholder}
          type="password"
        />
      </label>

      <p className="rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-3 py-2 text-xs leading-5 text-[var(--accent-strong)]">
        {labels.help}
      </p>

      {errorText ? <div className="message-error">{errorText}</div> : null}

      <button className="btn-primary" disabled={pending} type="submit">
        <RotateCcw size={15} aria-hidden />
        {pending ? labels.submitting : labels.submit}
      </button>

      <Link className="text-center text-sm font-medium text-[var(--muted-strong)]" href="/admin/login">
        {labels.backToLogin}
      </Link>
    </form>
  );
}
