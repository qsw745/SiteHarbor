"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {
  error: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="admin-label">
        管理员密码
        <input
          autoComplete="current-password"
          className="admin-field"
          name="password"
          placeholder="输入管理员密码"
          type="password"
        />
      </label>

      {state.error ? <div className="message-error">{state.error}</div> : null}

      <button className="btn-primary" disabled={pending} type="submit">
        <LogIn size={18} aria-hidden />
        {pending ? "登录中" : "登录后台"}
      </button>
    </form>
  );
}
