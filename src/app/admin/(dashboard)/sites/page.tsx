import {
  createSiteAction,
  deleteSiteAction,
  syncDiscoveredSitesAction,
  toggleSiteAction,
  updateSiteAction,
} from "./actions";
import { SiteAvatar } from "@/components/SiteAvatar";
import { messageFromParams } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  CheckCircle2,
  Globe2,
  MousePointerClick,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const okMessages: Record<string, string> = {
  "site-created": "站点已添加。",
  "site-updated": "站点已保存。",
  "site-enabled": "站点已启用。",
  "site-disabled": "站点已停用。",
  "site-deleted": "站点已删除。",
};

type SitesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SitesPage({ searchParams }: SitesPageProps) {
  const params = await searchParams;
  const { error, ok } = messageFromParams(params);
  const [categories, sites] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.site.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const activeSites = sites.filter((site) => site.active);
  const inactiveSites = sites.length - activeSites.length;
  const totalClicks = sites.reduce((sum, site) => sum + site.clickCount, 0);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">站点列表</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            维护链接、分类与显示状态，启用的站点会出现在公开首页。
          </p>
        </div>
        <form action={syncDiscoveredSitesAction}>
          <button className="btn-secondary" type="submit">
            <RefreshCcw size={15} aria-hidden />
            扫描 Nginx 配置
          </button>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Globe2} label="站点总数" value={sites.length} />
        <MetricCard icon={CheckCircle2} label="启用" value={activeSites.length} tone="success" />
        <MetricCard icon={Activity} label="停用" value={inactiveSites} tone="muted" />
        <MetricCard icon={MousePointerClick} label="累计访问" value={totalClicks} />
      </section>

      {error ? <div className="message-error">{error}</div> : null}
      {ok ? <div className="message-ok">{okMessages[ok] ?? ok}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          {sites.length ? (
            sites.map((site) => (
              <SiteRow
                key={site.id}
                categories={categories}
                site={site}
              />
            ))
          ) : (
            <div className="card px-8 py-16 text-center">
              <h3 className="text-lg font-semibold">还没有站点</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                在右侧添加一个入口，或扫描 Nginx 配置批量导入。
              </p>
            </div>
          )}
        </div>

        <aside className="card h-fit p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Editor
              </p>
              <h2 className="mt-1 text-base font-semibold">添加站点</h2>
            </div>
            <span
              className="grid h-9 w-9 place-items-center rounded-lg text-white"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              }}
            >
              <Plus size={17} aria-hidden />
            </span>
          </div>

          <form action={createSiteAction} className="mt-5 grid gap-3">
            <SiteFields categories={categories} compact />
            <button className="btn-primary mt-2" type="submit">
              <Plus size={15} aria-hidden />
              添加站点
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

type SiteRowSite = {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  active: boolean;
  sortOrder: number;
  categoryId: string | null;
  clickCount: number;
  category: { name: string } | null;
};

function SiteRow({
  categories,
  site,
}: {
  categories: { id: string; name: string }[];
  site: SiteRowSite;
}) {
  return (
    <form
      action={updateSiteAction.bind(null, site.id)}
      className="card p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <SiteAvatar iconUrl={site.iconUrl} name={site.name} slug={site.slug} />
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {site.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">/{site.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className={`status-pill ${site.active ? "active" : "inactive"}`}>
            {site.active ? "启用" : "停用"}
          </span>
          <span className="status-pill neutral">{site.category?.name ?? "未分类"}</span>
          <span className="hidden sm:inline">{site.clickCount} 次访问</span>
        </div>
      </header>

      <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
        <SiteFields categories={categories} site={site} compact />
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
        <button
          className="btn-danger"
          formAction={deleteSiteAction.bind(null, site.id)}
          formNoValidate
          type="submit"
        >
          <Trash2 size={15} aria-hidden />
          删除
        </button>
        <button
          className="btn-secondary"
          formAction={toggleSiteAction.bind(null, site.id)}
          formNoValidate
          type="submit"
        >
          {site.active ? "停用" : "启用"}
        </button>
        <button className="btn-primary" type="submit">
          <Save size={15} aria-hidden />
          保存
        </button>
      </div>
    </form>
  );
}

type MetricIcon = React.ComponentType<{
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}>;

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: MetricIcon;
  label: string;
  value: number;
  tone?: "success" | "muted";
}) {
  const accent =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "muted"
        ? "text-[var(--muted)]"
        : "text-[var(--accent)]";

  return (
    <div className="metric-panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <Icon size={15} className={accent} aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

type SiteFieldCategory = {
  id: string;
  name: string;
};

type SiteFieldSite = {
  name: string;
  slug: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  active: boolean;
  sortOrder: number;
  categoryId: string | null;
};

function SiteFields({
  categories,
  compact = false,
  site,
}: {
  categories: SiteFieldCategory[];
  compact?: boolean;
  site?: SiteFieldSite;
}) {
  const fieldClass = compact ? "admin-field compact" : "admin-field";

  return (
    <>
      <label className="admin-label">
        名称
        <input className={fieldClass} defaultValue={site?.name} name="name" required />
      </label>
      <label className="admin-label">
        Slug
        <input
          className={fieldClass}
          defaultValue={site?.slug}
          name="slug"
          placeholder="自动生成"
        />
      </label>
      <label className={`admin-label ${compact ? "md:col-span-2" : ""}`}>
        目标 URL
        <input
          className={fieldClass}
          defaultValue={site?.url}
          name="url"
          placeholder="https://example.com"
          required
          type="url"
        />
      </label>
      <label className={`admin-label ${compact ? "md:col-span-2 xl:col-span-2" : ""}`}>
        描述
        <textarea
          className={`${fieldClass} min-h-[68px] resize-y`}
          defaultValue={site?.description ?? ""}
          name="description"
          placeholder="简短描述此站点"
        />
      </label>
      <label className="admin-label">
        图标 URL
        <input
          className={fieldClass}
          defaultValue={site?.iconUrl ?? ""}
          name="iconUrl"
          placeholder="https://example.com/favicon.ico"
          type="url"
        />
      </label>
      <label className="admin-label">
        分类
        <select className={fieldClass} defaultValue={site?.categoryId ?? ""} name="categoryId">
          <option value="">未分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-label">
        状态
        <select
          className={fieldClass}
          defaultValue={String(site?.active ?? true)}
          name="active"
        >
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
      </label>
      <label className="admin-label">
        排序
        <input
          className={fieldClass}
          defaultValue={site?.sortOrder ?? 0}
          min={0}
          name="sortOrder"
          type="number"
        />
      </label>
    </>
  );
}
