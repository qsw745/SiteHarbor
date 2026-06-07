import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/AdminNav";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getActiveDictionary } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  const { dict, locale } = await getActiveDictionary();

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="grid gap-7">
          <Link className="rounded-[var(--radius-sm)]" href="/admin/sites">
            <BrandMark size="md" showSubtitle subtitle={dict.console} />
          </Link>

          <AdminNav labels={{ sites: dict.nav.sites, categories: dict.nav.categories }} />
        </div>

        <div className="grid gap-4">
          <div className="admin-status-panel">
            <p className="text-xs font-medium text-[var(--muted)]">{dict.systemStatus}</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              {dict.running}
            </div>
            <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
              <span>{dict.databaseStatus}</span>
              <span>{dict.brand} v1.0.0</span>
            </div>
          </div>

          <form action={logoutAction}>
            <button className="btn-ghost w-full justify-start" type="submit">
              <LogOut size={16} aria-hidden />
              {dict.signOut}
            </button>
          </form>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">{dict.console}</p>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight">
              {dict.siteManagement}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={locale} />
            <Link className="btn-secondary" href="/" target="_blank">
              <ExternalLink size={15} aria-hidden />
              {dict.viewHomepage}
            </Link>
          </div>
        </header>

        <div className="px-6 py-7 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
