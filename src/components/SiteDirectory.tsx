"use client";

import { ExternalLink, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

export type DirectoryCategory = {
  id: string;
  name: string;
  slug: string;
};

export type DirectorySite = {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  clickCount: number;
  categoryName: string | null;
  categorySlug: string | null;
};

type SiteDirectoryProps = {
  categories: DirectoryCategory[];
  sites: DirectorySite[];
};

export function SiteDirectory({ categories, sites }: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites.filter((site) => {
      const matchesCategory =
        category === "all" || site.categorySlug === category || (!site.categorySlug && category === "uncategorized");
      const searchable = [site.name, site.description, site.url, site.categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query, sites]);

  return (
    <main className="min-h-screen pb-16">
      <section className="border-b border-[var(--line)] bg-[#fbfaf6]/80 backdrop-blur">
        <div className="shell py-8 md:py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-sm font-semibold text-[var(--muted)]">
                <ShieldCheck size={16} aria-hidden />
                SiteHarbor
              </div>
              <h1 className="text-4xl font-black tracking-normal text-balance md:text-6xl">
                统一管理你的服务器网站入口
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] md:text-lg">
                访问者在这里选择目标站点，后台集中维护链接、分类、排序和启停状态。
              </p>
            </div>

            <a className="btn-secondary w-fit" href="/admin/sites">
              管理后台
            </a>
          </div>
        </div>
      </section>

      <section className="shell py-7">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-md">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
            />
            <span className="sr-only">搜索站点</span>
            <input
              className="focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm shadow-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索名称、描述、URL"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <CategoryButton active={category === "all"} onClick={() => setCategory("all")}>
              全部
            </CategoryButton>
            {categories.map((item) => (
              <CategoryButton
                key={item.id}
                active={category === item.slug}
                onClick={() => setCategory(item.slug)}
              >
                {item.name}
              </CategoryButton>
            ))}
            {sites.some((site) => !site.categorySlug) ? (
              <CategoryButton
                active={category === "uncategorized"}
                onClick={() => setCategory("uncategorized")}
              >
                未分类
              </CategoryButton>
            ) : null}
          </div>
        </div>

        {filteredSites.length ? (
          <div className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => (
              <a
                key={site.id}
                className="group rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]"
                href={`/go/${site.slug}`}
                rel="noreferrer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <SiteIcon iconUrl={site.iconUrl} name={site.name} />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black">{site.name}</h2>
                      <p className="truncate text-sm text-[var(--muted)]">{site.url}</p>
                    </div>
                  </div>
                  <ExternalLink
                    aria-hidden
                    className="mt-1 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent)]"
                    size={18}
                  />
                </div>

                <p className="mt-4 min-h-11 text-sm leading-6 text-[var(--muted)]">
                  {site.description || "暂无描述"}
                </p>

                <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-normal text-[var(--muted)]">
                  <span>{site.categoryName || "未分类"}</span>
                  <span>{site.clickCount} 次访问</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="my-10 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center">
            <h2 className="text-2xl font-black">暂无可访问站点</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
              登录后台添加站点后，启用状态的网站会显示在这里。
            </p>
            <a className="btn-primary mt-6" href="/admin/sites">
              添加站点
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

function CategoryButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`focus-ring whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-bold transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SiteIcon({ iconUrl, name }: { iconUrl: string | null; name: string }) {
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
    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--surface-strong)] text-base font-black text-[var(--accent-strong)]">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
