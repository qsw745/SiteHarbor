import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getActiveDictionary } from "@/lib/locale";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authed = await getAdminSession();
  if (authed) {
    redirect("/admin/sites");
  }

  const { dict, locale } = await getActiveDictionary();

  return (
    <main className="login-surface grid min-h-screen place-items-center px-4 py-10">
      <section className="login-card w-full max-w-md p-8">
        <div className="flex items-center justify-between">
          <BrandMark size="md" />
          <LanguageSwitcher current={locale} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{dict.login.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{dict.login.subtitle}</p>
        <LoginForm
          labels={{
            passwordLabel: dict.login.passwordLabel,
            passwordPlaceholder: dict.login.passwordPlaceholder,
            submit: dict.login.submit,
            submitting: dict.login.submitting,
          }}
          messages={dict.messages}
        />
      </section>
    </main>
  );
}
