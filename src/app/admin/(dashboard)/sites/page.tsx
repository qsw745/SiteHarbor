import {
  createSiteAction,
  deleteSiteAction,
  toggleSiteAction,
  updateSiteAction,
} from "./actions";
import { messageFromParams } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
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

  return (
    <div className="grid gap-7">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black">站点管理</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            维护公开首页展示的网站入口，停用后不会在首页显示。
          </p>
        </div>
        <Link className="btn-secondary w-fit" href="/">
          <ExternalLink size={17} aria-hidden />
          查看首页
        </Link>
      </section>

      {error ? <div className="message-error">{error}</div> : null}
      {ok ? <div className="message-ok">{okMessages[ok] ?? "操作已完成。"}</div> : null}

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black">添加站点</h2>
        <form action={createSiteAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <SiteFields categories={categories} />
          <div className="md:col-span-2">
            <button className="btn-primary" type="submit">
              <Plus size={17} aria-hidden />
              添加站点
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-lg font-black">现有站点</h2>
          <span className="text-sm font-bold text-[var(--muted)]">{sites.length} 个站点</span>
        </div>

        {sites.length ? (
          sites.map((site) => (
            <form
              action={updateSiteAction.bind(null, site.id)}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
              key={site.id}
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{site.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                        site.active
                          ? "bg-[rgba(15,118,110,0.1)] text-[var(--accent-strong)]"
                          : "bg-[rgba(105,113,109,0.14)] text-[var(--muted)]"
                      }`}
                    >
                      <CheckCircle2 size={13} aria-hidden />
                      {site.active ? "启用" : "停用"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {site.category?.name ?? "未分类"} · {site.clickCount} 次访问
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
              </div>
              <SiteFields categories={categories} site={site} />
            </form>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            还没有站点。先添加一个入口。
          </div>
        )}
      </section>
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
  site,
}: {
  categories: SiteFieldCategory[];
  site?: SiteFieldSite;
}) {
  return (
    <>
      <label className="admin-label">
        名称
        <input className="admin-field" defaultValue={site?.name} name="name" required />
      </label>
      <label className="admin-label">
        Slug
        <input
          className="admin-field"
          defaultValue={site?.slug}
          name="slug"
          placeholder="留空时按名称自动生成"
        />
      </label>
      <label className="admin-label md:col-span-2">
        目标 URL
        <input
          className="admin-field"
          defaultValue={site?.url}
          name="url"
          placeholder="https://example.com"
          required
          type="url"
        />
      </label>
      <label className="admin-label md:col-span-2">
        描述
        <textarea
          className="admin-field min-h-20 resize-y"
          defaultValue={site?.description ?? ""}
          name="description"
        />
      </label>
      <label className="admin-label">
        图标 URL
        <input
          className="admin-field"
          defaultValue={site?.iconUrl ?? ""}
          name="iconUrl"
          placeholder="https://example.com/favicon.ico"
          type="url"
        />
      </label>
      <label className="admin-label">
        分类
        <select className="admin-field" defaultValue={site?.categoryId ?? ""} name="categoryId">
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
        <select className="admin-field" defaultValue={String(site?.active ?? true)} name="active">
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
      </label>
      <label className="admin-label">
        排序
        <input
          className="admin-field"
          defaultValue={site?.sortOrder ?? 0}
          min={0}
          name="sortOrder"
          type="number"
        />
      </label>
    </>
  );
}
