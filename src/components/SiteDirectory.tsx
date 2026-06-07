"use client";

import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteAvatar } from "@/components/SiteAvatar";
import { format, type Dictionary, type Locale } from "@/lib/i18n";
import { ArrowUpRight, Eye, Search } from "lucide-react";
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
  const usedCategoryCount = categories.filter((item) =>
    sites.some((site) => site.categorySlug === item.slug),
  ).length + (hasUncategorized ? 1 : 0);

  return (
    <main className="directory-shell flex min-h-screen flex-col pb-12">
      <header className="directory-topbar">
        <div className="shell flex items-center justify-between gap-4">
          <BrandMark size="lg" showSubtitle subtitle={dict.brandTag} />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              {format(dict.home.showing, {
                shown: sites.length,
                total: sites.length,
              })}
            </span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </header>

      <section className="shell pt-8">
        <div className="directory-command">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase text-[var(--accent-strong)]">
                {dict.brandTag}
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-[40px] md:leading-[1.12]">
                {dict.home.titleBefore} {dict.home.titleHighlight}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
                {dict.home.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatTile label={dict.home.statSites} value={sites.length} />
              <StatTile label={dict.home.statCategories} value={usedCategoryCount} />
              <StatTile label={dict.home.statVisits} value={totalVisits} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,390px)_1fr] md:items-center">
            <label className="relative block w-full">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <span className="sr-only">{dict.home.searchPlaceholder}</span>
              <input
                className="focus-ring input input-with-icon"
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

      <section className="shell mt-6 flex-1">
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
            <span>
              {format(dict.home.showing, {
                shown: filteredSites.length,
                total: sites.length,
              })}
            </span>
            <span>{format(dict.home.totalVisits, { count: totalVisits })}</span>
          </div>
        ) : null}
      </section>

      <footer className="shell mt-16 flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center">
        <span>{format(dict.home.footer.copyright, { year: new Date().getFullYear() })}</span>
        <span>{dict.home.footer.tagline}</span>
      </footer>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <div className="text-[11px] font-medium uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-[var(--foreground)]">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function SiteCard({ site, dict }: { site: DirectorySite; dict: Dictionary }) {
  const categoryLabel = site.categoryName || dict.home.uncategorized;
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
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)] transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white">
          <ArrowUpRight size={15} aria-hidden />
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.25rem] text-sm leading-6 text-[var(--muted)]">
        {site.description || dict.home.noDescription}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs">
        <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-strong)]">
          {categoryLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium tabular-nums text-[var(--muted-strong)]">
          <Eye size={13} aria-hidden />
          {site.clickCount.toLocaleString()}
          <span className="sr-only">{dict.home.visitCardLabel}</span>
        </span>
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
