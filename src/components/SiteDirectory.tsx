"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteAvatar } from "@/components/SiteAvatar";
import type { Dictionary, Locale } from "@/lib/i18n";
import { ArrowUpRight, Search } from "lucide-react";
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
  dict: Dictionary;
  locale: Locale;
};

export function SiteDirectory({ categories, sites, dict, locale }: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites.filter((site) => {
      const matchesCategory =
        category === "all" ||
        site.categorySlug === category ||
        (!site.categorySlug && category === "uncategorized");
      const searchable = [site.name, site.description, site.url, site.categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query, sites]);

  const hasUncategorized = sites.some((site) => !site.categorySlug);
  const totalVisits = sites.reduce((sum, site) => sum + site.clickCount, 0);

  return (
    <main className="relative min-h-screen pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        style={{
          background:
            "radial-gradient(80% 50% at 50% 0%, rgba(99, 102, 241, 0.10), transparent 70%)",
        }}
      />

      <div className="shell flex justify-end pt-6">
        <LanguageSwitcher current={locale} />
      </div>

      <section className="pt-6 md:pt-10">
        <div className="shell">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)] shadow-[var(--shadow-sm)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {dict.brandTag}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-[44px] md:leading-[1.1]">
              {dict.home.titleBefore}{" "}
              <span
                style={{
                  backgroundImage: "linear-gradient(90deg, #4f46e5 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {dict.home.titleHighlight}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
              {dict.home.subtitle}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-center">
            <label className="relative block w-full">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <span className="sr-only">{dict.home.searchPlaceholder}</span>
              <input
                className="focus-ring input pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.home.searchPlaceholder}
              />
            </label>

            <div className="flex flex-1 flex-wrap gap-2 md:justify-end">
              <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
                {dict.home.all}
                <Counter>{sites.length}</Counter>
              </CategoryChip>
              {categories.map((item) => {
                const count = sites.filter((site) => site.categorySlug === item.slug).length;
                if (!count) return null;
                return (
                  <CategoryChip
                    key={item.id}
                    active={category === item.slug}
                    onClick={() => setCategory(item.slug)}
                  >
                    {item.name}
                    <Counter>{count}</Counter>
                  </CategoryChip>
                );
              })}
              {hasUncategorized ? (
                <CategoryChip
                  active={category === "uncategorized"}
                  onClick={() => setCategory("uncategorized")}
                >
                  {dict.home.uncategorized}
                </CategoryChip>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="shell mt-10">
        {filteredSites.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} dict={dict} />
            ))}
          </div>
        ) : (
          <div className="card mt-6 px-8 py-16 text-center">
            <h2 className="text-xl font-semibold">{dict.home.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              {query ? dict.home.emptyDescSearch : dict.home.emptyDescNone}
            </p>
          </div>
        )}

        {filteredSites.length ? (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>{dict.home.showing(filteredSites.length, sites.length)}</span>
            <span>{dict.home.totalVisits(totalVisits)}</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SiteCard({ site, dict }: { site: DirectorySite; dict: Dictionary }) {
  return (
    <a className="site-card group" href={`/go/${site.slug}`} rel="noreferrer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SiteAvatar iconUrl={site.iconUrl} name={site.name} slug={site.slug} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[var(--foreground)]">
              {site.name}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {formatUrl(site.url)}
            </p>
          </div>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white">
          <ArrowUpRight size={15} aria-hidden />
        </span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-[var(--muted)]">
        {site.description || dict.home.noDescription}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
        <span className="font-medium">{site.categoryName || dict.home.uncategorized}</span>
        <span>{dict.home.visits(site.clickCount)}</span>
      </div>
    </a>
  );
}

function CategoryChip({
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
      className={`focus-ring chip ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-black/10 px-1.5 py-px text-[10.5px] font-medium tabular-nums">
      {children}
    </span>
  );
}

function formatUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return url;
  }
}
