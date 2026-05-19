import { LoginForm } from "./LoginForm";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authed = await getAdminSession();
  if (authed) {
    redirect("/admin/sites");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-md p-8 shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            }}
          >
            <span className="text-sm font-semibold">SH</span>
          </span>
          <span className="text-base font-semibold tracking-tight">SiteHarbor</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">管理员登录</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          登录后可维护站点入口、分类、排序与显示状态。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
