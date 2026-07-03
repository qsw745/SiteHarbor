import { ResetPasswordForm } from "./ResetPasswordForm";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getActiveDictionary } from "@/lib/locale";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const authed = await getAdminSession();
  if (authed) {
    redirect("/admin/sites");
  }

  const params = await searchParams;
  const tokenParam = params?.token;
  const initialToken = Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "";
  const { dict, locale } = await getActiveDictionary();

  return (
    <main className="login-surface grid min-h-screen place-items-center px-4 py-10">
      <section className="login-card w-full max-w-md p-8">
        <div className="flex items-center justify-between">
          <BrandMark size="md" />
          <LanguageSwitcher current={locale} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {dict.resetPassword.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {dict.resetPassword.subtitle}
        </p>
        <ResetPasswordForm
          initialToken={initialToken}
          labels={dict.resetPassword}
          messages={dict.messages}
        />
      </section>
    </main>
  );
}
