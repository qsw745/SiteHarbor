import { LoginForm } from "./LoginForm";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authed = await getAdminSession();
  if (authed) {
    redirect("/admin/sites");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <Link className="text-sm font-bold text-[var(--accent-strong)]" href="/">
          SiteHarbor
        </Link>
        <h1 className="mt-5 text-3xl font-black">管理员登录</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          登录后可维护站点入口、分类、排序和显示状态。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
