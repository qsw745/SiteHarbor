import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/session";
import { FolderKanban, Home, LogOut, RadioTower, Tags } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/admin/sites", label: "站点", icon: FolderKanban },
  { href: "/admin/categories", label: "分类", icon: Tags },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <main className="admin-shell min-h-screen">
      <aside className="admin-sidebar">
        <div className="grid gap-8">
          <div>
            <Link className="flex items-center gap-3" href="/admin/sites">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white">
                <RadioTower size={20} aria-hidden />
              </span>
              <span>
                <span className="block text-xl font-black">SiteHarbor</span>
                <span className="block text-xs font-bold uppercase text-[var(--muted)]">
                  Control Deck
                </span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              管理服务器上的站点入口、分类和跳转状态。
            </p>
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="admin-nav-item" href={item.href} key={item.href}>
                  <Icon size={17} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Production</p>
            <p className="mt-2 text-sm font-bold">127.0.0.1:3000</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              生产环境通过 Docker Compose 持久化 SQLite 数据。
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button className="btn-danger w-full" type="submit">
            <LogOut size={17} aria-hidden />
            退出
          </button>
        </form>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Website Operations</p>
            <h1 className="mt-1 text-2xl font-black">网站管理</h1>
          </div>
          <Link className="btn-secondary" href="/">
            <Home size={17} aria-hidden />
            查看首页
          </Link>
        </header>

        <div className="px-5 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
