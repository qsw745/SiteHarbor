import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/session";
import { FolderKanban, Home, LogOut, Tags } from "lucide-react";

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
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[#fbfaf6]/90 backdrop-blur">
        <div className="shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <a className="text-xl font-black" href="/admin/sites">
              SiteHarbor Admin
            </a>
            <p className="mt-1 text-sm text-[var(--muted)]">维护公开入口和跳转规则</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a className="btn-secondary" href={item.href} key={item.href}>
                  <Icon size={17} aria-hidden />
                  {item.label}
                </a>
              );
            })}
            <form action={logoutAction}>
              <button className="btn-danger" type="submit">
                <LogOut size={17} aria-hidden />
                退出
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="shell py-8">{children}</div>
    </main>
  );
}
