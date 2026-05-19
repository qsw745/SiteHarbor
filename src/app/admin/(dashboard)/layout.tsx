import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/session";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <main className="admin-shell min-h-screen">
      <aside className="admin-sidebar">
        <div className="grid gap-7">
          <Link className="flex items-center gap-2.5" href="/admin/sites">
            <span
              className="grid h-9 w-9 place-items-center rounded-lg text-white"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              }}
            >
              <span className="text-sm font-semibold">SH</span>
            </span>
            <div>
              <span className="block text-base font-semibold tracking-tight">
                SiteHarbor
              </span>
              <span className="block text-xs text-[var(--muted)]">控制台</span>
            </div>
          </Link>

          <AdminNav />
        </div>

        <form action={logoutAction}>
          <button className="btn-ghost w-full justify-start" type="submit">
            <LogOut size={16} aria-hidden />
            退出登录
          </button>
        </form>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">控制台</p>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight">网站管理</h1>
          </div>
          <Link className="btn-secondary" href="/" target="_blank">
            <ExternalLink size={15} aria-hidden />
            查看首页
          </Link>
        </header>

        <div className="px-6 py-7 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
