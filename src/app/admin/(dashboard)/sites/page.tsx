import {
  createSiteAction,
  deleteSiteAction,
  syncDiscoveredSitesAction,
  toggleSiteAction,
  updateSiteAction,
} from "./actions";
import { messageFromParams } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Globe2,
  LayoutGrid,
  Link2,
  MousePointerClick,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Server,
  Trash2,
} from "lucide-react";
import Link from "next/link";

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
  const previewSites = activeSites.slice(0, 3);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-[rgba(255,253,248,0.72)] p-5 shadow-[var(--shadow)] md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)]">
                <Server size={17} aria-hidden />
                站点管理
              </div>
              <h2 className="text-3xl font-black">统一维护访问入口</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                管理站点 URL、分类、状态和跳转统计。启用的站点会显示在公开首页。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={syncDiscoveredSitesAction}>
                <button className="btn-secondary" type="submit">
                  <RefreshCcw size={17} aria-hidden />
                  扫描现有站点
                </button>
              </form>
              <Link className="btn-primary w-fit" href="/">
                <ExternalLink size={17} aria-hidden />
                查看首页
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard icon={Globe2} label="站点总数" value={String(sites.length)} />
            <MetricCard icon={CheckCircle2} label="启用" value={String(activeSites.length)} />
            <MetricCard icon={Activity} label="停用" value={String(inactiveSites)} />
            <MetricCard icon={MousePointerClick} label="访问次数" value={String(totalClicks)} />
          </div>
        </div>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--muted)]">Portal Preview</p>
              <h2 className="mt-1 text-lg font-black">首页预览</h2>
            </div>
            <LayoutGrid size={20} className="text-[var(--accent)]" aria-hidden />
          </div>

          <div className="mt-5 grid gap-3">
            {previewSites.length ? (
              previewSites.map((site) => (
                <a
                  className="group rounded-lg border border-[var(--line)] bg-[#fbfaf6] p-3 transition hover:border-[var(--accent)]"
                  href={`/go/${site.slug}`}
                  key={site.id}
                >
                  <div className="flex items-center gap-3">
                    <SiteAvatar iconUrl={site.iconUrl} name={site.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{site.name}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{formatUrl(site.url)}</p>
                    </div>
                    <ExternalLink
                      size={15}
                      aria-hidden
                      className="text-[var(--muted)] group-hover:text-[var(--accent)]"
                    />
                  </div>
                </a>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                启用站点后，这里会显示首页入口预览。
              </p>
            )}
          </div>
        </section>
      </section>

      {error ? <div className="message-error">{error}</div> : null}
      {ok ? <div className="message-ok">{okMessages[ok] ?? ok}</div> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-sm">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <span className="sr-only">搜索站点</span>
              <input
                className="admin-field compact pl-9"
                disabled
                placeholder="搜索在公开首页可用"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto">
              <span className="status-pill active">全部 {sites.length}</span>
              <span className="status-pill active">启用 {activeSites.length}</span>
              <span className="status-pill inactive">停用 {inactiveSites}</span>
              {categories.map((category) => (
                <span className="status-pill inactive" key={category.id}>
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <div className="grid grid-cols-[minmax(220px,1.3fr)_120px_110px_110px] gap-3 border-b border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 text-xs font-black uppercase text-[var(--muted)] max-lg:hidden">
              <span>站点</span>
              <span>分类</span>
              <span>状态</span>
              <span>访问次数</span>
            </div>

            {sites.length ? (
              <div className="divide-y divide-[var(--line)]">
                {sites.map((site) => (
                  <form
                    action={updateSiteAction.bind(null, site.id)}
                    className="grid gap-4 px-4 py-4 transition hover:bg-[#fbfaf6]"
                    key={site.id}
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.3fr)_120px_110px_110px] lg:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <SiteAvatar iconUrl={site.iconUrl} name={site.name} />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black">{site.name}</h3>
                          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-[var(--muted)]">
                            <Link2 size={13} aria-hidden />
                            {site.slug}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-bold text-[var(--muted)]">
                        {site.category?.name ?? "未分类"}
                      </span>
                      <span className={`status-pill ${site.active ? "active" : "inactive"}`}>
                        <CheckCircle2 size={13} aria-hidden />
                        {site.active ? "启用" : "停用"}
                      </span>
                      <span className="text-sm font-black">{site.clickCount}</span>
                    </div>

                    <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[#fbfaf6] p-3 md:grid-cols-2 xl:grid-cols-4">
                      <SiteFields categories={categories} site={site} compact />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn-primary" type="submit">
                        <Save size={17} aria-hidden />
                        保存
                      </button>
                      <button
                        className="btn-secondary"
                        formAction={toggleSiteAction.bind(null, site.id)}
                        formNoValidate
                        type="submit"
                      >
                        {site.active ? "停用" : "启用"}
                      </button>
                      <button
                        className="btn-danger"
                        formAction={deleteSiteAction.bind(null, site.id)}
                        formNoValidate
                        type="submit"
                      >
                        <Trash2 size={17} aria-hidden />
                        删除
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <h2 className="text-xl font-black">还没有站点</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">先从右侧面板添加一个入口。</p>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--muted)]">Editor</p>
              <h2 className="mt-1 text-xl font-black">添加站点</h2>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white">
              <Plus size={20} aria-hidden />
            </span>
          </div>

          <form action={createSiteAction} className="mt-5 grid gap-4">
            <SiteFields categories={categories} />
            <button className="btn-primary" type="submit">
              <Plus size={17} aria-hidden />
              添加站点
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

type MetricIcon = React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: MetricIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="metric-panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
        <Icon size={17} className="text-[var(--accent)]" aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
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
      <label className={`admin-label ${compact ? "xl:col-span-2" : ""}`}>
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
      <label className={`admin-label ${compact ? "xl:col-span-2" : ""}`}>
        描述
        <textarea
          className={`${fieldClass} min-h-20 resize-y`}
          defaultValue={site?.description ?? ""}
          name="description"
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
        <select className={fieldClass} defaultValue={String(site?.active ?? true)} name="active">
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

function SiteAvatar({ iconUrl, name }: { iconUrl: string | null; name: string }) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className="h-11 w-11 rounded-lg border border-[var(--line)] bg-white object-cover"
        src={iconUrl}
      />
    );
  }

  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--surface-muted)] text-base font-black text-[var(--accent-strong)]">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function formatUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return url;
  }
}
