"use client";

import { DirectorySort } from "@/components/DirectorySort";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteAvatar } from "@/components/SiteAvatar";
import { format, type Dictionary, type Locale } from "@/lib/i18n";
import Link from "next/link";
import {
  Activity,
  Anchor,
  ArrowUpRight,
  Compass,
  Search,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

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

export function SiteDirectory({
  categories,
  sites,
  dict,
  locale,
}: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const copy = getDirectoryCopy(locale);
  const searchRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState("default");
  const isFiltering =
    Boolean(query.trim()) || category !== "all" || sort !== "default";

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites
      .filter((site) => {
        const matchesCategory =
          category === "all" ||
          site.categorySlug === category ||
          (!site.categorySlug && category === "uncategorized");
        const searchable = [
          site.name,
          site.description,
          site.url,
          site.categoryName,
          site.slug === "birthday" ? "生日提醒 岁时" : "",
          ["online-exam", "exam", "wenheng"].includes(site.slug)
            ? "在线考试系统 问衡"
            : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          matchesCategory &&
          (!normalizedQuery || searchable.includes(normalizedQuery))
        );
      })
      .sort((left, right) => {
        if (sort === "popular") return right.clickCount - left.clickCount;
        if (sort === "name")
          return left.name.localeCompare(
            right.name,
            locale === "zh" ? "zh-CN" : "en",
          );
        return 0;
      });
  }, [category, query, sites, sort, locale]);

  const hasUncategorized = sites.some((site) => !site.categorySlug);
  const totalVisits = sites.reduce((sum, site) => sum + site.clickCount, 0);
  const usedCategoryCount =
    categories.filter((item) =>
      sites.some((site) => site.categorySlug === item.slug),
    ).length + (hasUncategorized ? 1 : 0);

  const featuredSite = useMemo(() => {
    if (isFiltering || !sites.length) return null;
    return sites.reduce((best, site) =>
      site.clickCount > best.clickCount ? site : best,
    );
  }, [sites, isFiltering]);

  const selectCategory = (nextCategory: string) => setCategory(nextCategory);
  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("default");
    searchRef.current?.focus();
  };

  return (
    <main className="harbor-shell flex min-h-screen flex-col">
      <div className="harbor-paper" aria-hidden />

      <header className="harbor-topbar">
        <div className="shell flex items-center justify-between gap-4">
          <Link href="/" className="focus-ring" aria-label={copy.homeLabel}>
            <BrandMark size="md" showSubtitle subtitle={copy.brandTag} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="harbor-status-pill hidden sm:inline-flex">
              <span className="harbor-status-dot" />
              {copy.directoryLabel}
            </span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </header>

      <section
        className={`harbor-hero shell ${!featuredSite ? "harbor-hero-compact" : ""}`}
        aria-label={copy.introLabel}
      >
        <div className="harbor-hero-copy">
          <p className="harbor-kicker">
            <Anchor size={13} aria-hidden />
            {copy.kicker}
          </p>
          <h1>
            {copy.titleBefore}
            <em>{copy.titleHighlight}</em>
          </h1>
          <p className="harbor-subtitle">{copy.subtitle}</p>

          <dl className="harbor-ledger" aria-label={copy.statsLabel}>
            <LedgerRow label={copy.sitesLabel} value={sites.length} />
            <LedgerRow
              label={dict.home.statCategories}
              value={usedCategoryCount}
            />
            <LedgerRow label={dict.home.statVisits} value={totalVisits} />
          </dl>
        </div>
        {featuredSite ? (
          <FeaturedCard site={featuredSite} dict={dict} locale={locale} />
        ) : null}
      </section>

      <section className="harbor-controls shell">
        <div className="harbor-rule">
          <h2>{isFiltering ? copy.resultsLabel : copy.manifestLabel}</h2>
          <span role="status" aria-live="polite">
            {format(dict.home.showing, {
              shown: filteredSites.length,
              total: sites.length,
            })}
          </span>
        </div>
        <div className="harbor-controls-row">
          <div className="harbor-search">
            <Search aria-hidden size={16} />
            <label className="sr-only" htmlFor="directory-search">
              {dict.home.searchPlaceholder}
            </label>
            <input
              id="directory-search"
              ref={searchRef}
              type="search"
              autoComplete="off"
              className="focus-ring"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("");
                }
              }}
            />
            {query ? (
              <button
                className="harbor-search-clear focus-ring"
                type="button"
                aria-label={copy.clearSearch}
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={15} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="harbor-category-strip">
            <CategoryChip
              active={category === "all"}
              onClick={() => selectCategory("all")}
            >
              {dict.home.all}
              <Counter>{sites.length}</Counter>
            </CategoryChip>
            {categories.map((item) => {
              const count = sites.filter(
                (site) => site.categorySlug === item.slug,
              ).length;
              if (!count) return null;
              return (
                <CategoryChip
                  key={item.id}
                  active={category === item.slug}
                  onClick={() => selectCategory(item.slug)}
                >
                  {item.name}
                  <Counter>{count}</Counter>
                </CategoryChip>
              );
            })}
            {hasUncategorized ? (
              <CategoryChip
                active={category === "uncategorized"}
                onClick={() => selectCategory("uncategorized")}
              >
                {dict.home.uncategorized}
              </CategoryChip>
            ) : null}
          </div>
          <DirectorySort
            label={copy.sortLabel}
            value={sort}
            onChange={setSort}
            options={[
              { value: "default", label: copy.sortDefault },
              { value: "popular", label: copy.sortPopular },
              { value: "name", label: copy.sortName },
            ]}
          />
        </div>
      </section>

      {filteredSites.length ? (
        <section className="harbor-grid shell" aria-label={copy.manifestLabel}>
          {filteredSites
            .filter((site) => !featuredSite || site.id !== featuredSite.id)
            .map((site) => (
              <SiteCard key={site.id} site={site} dict={dict} locale={locale} />
            ))}
        </section>
      ) : (
        <section className="shell">
          <div className="harbor-empty">
            <Compass size={28} aria-hidden />
            <h2>{dict.home.emptyTitle}</h2>
            <p>
              {isFiltering
                ? dict.home.emptyDescSearch
                : dict.home.emptyDescNone}
            </p>
            {isFiltering ? (
              <button
                type="button"
                className="btn-secondary mt-3 focus-ring"
                onClick={resetFilters}
              >
                {copy.resetFilters}
              </button>
            ) : null}
          </div>
        </section>
      )}

      <footer className="harbor-footer shell">
        <span>
          {format(dict.home.footer.copyright, {
            year: new Date().getFullYear(),
          })}
        </span>
        <span>{copy.footerNote}</span>
      </footer>
    </main>
  );
}

function FeaturedCard({
  site,
  dict,
  locale,
}: {
  site: DirectorySite;
  dict: Dictionary;
  locale: Locale;
}) {
  const copy = getDirectoryCopy(locale);
  return (
    <a
      className="harbor-featured focus-ring"
      href={`/go/${site.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${copy.openSite}: ${site.name}`}
    >
      <div className="harbor-featured-heading">
        <span className="harbor-featured-flag">
          <Activity size={13} aria-hidden />
          {copy.featuredLabel}
        </span>
        <span className="harbor-featured-count">
          {format(dict.home.visits, { count: site.clickCount })}
        </span>
      </div>
      <div className="harbor-featured-identity">
        <SiteAvatar
          iconUrl={site.iconUrl}
          name={site.name}
          slug={site.slug}
          size="lg"
        />
        <div>
          <h2>{site.name}</h2>
          <span className="harbor-featured-host">{formatUrl(site.url)}</span>
        </div>
      </div>
      <p className="harbor-featured-lead">
        {site.description || dict.home.noDescription}
      </p>
      <div className="harbor-featured-bottom">
        <span>{copy.exploreSite}</span>
        <span className="harbor-featured-arrow">
          <ArrowUpRight size={21} aria-hidden />
        </span>
      </div>
    </a>
  );
}

function SiteCard({
  site,
  dict,
  locale,
}: {
  site: DirectorySite;
  dict: Dictionary;
  locale: Locale;
}) {
  const copy = getDirectoryCopy(locale);
  const categoryLabel = site.categoryName || dict.home.uncategorized;
  return (
    <a
      className="harbor-card focus-ring"
      href={`/go/${site.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${copy.openSite}: ${site.name}`}
    >
      <div className="harbor-card-top">
        <SiteAvatar
          iconUrl={site.iconUrl}
          name={site.name}
          slug={site.slug}
          size="lg"
        />
        <span className="harbor-tag">{categoryLabel}</span>
      </div>
      <h3 className="harbor-card-name">{site.name}</h3>
      <p className="harbor-card-desc">
        {site.description || dict.home.noDescription}
      </p>
      <p className="harbor-card-host">{formatUrl(site.url)}</p>
      <div className="harbor-card-foot">
        <span className="harbor-visits">
          <Activity size={13} aria-hidden />
          {format(dict.home.visits, { count: site.clickCount })}
        </span>
        <span className="harbor-card-action">
          {copy.openSite}
          <ArrowUpRight size={15} aria-hidden />
        </span>
      </div>
    </a>
  );
}

function LedgerRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="harbor-ledger-row">
      <dt>{label}</dt>
      <dd>{value.toLocaleString()}</dd>
    </div>
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
      className={`focus-ring chip harbor-chip ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={active}
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

function getDirectoryCopy(locale: Locale) {
  return locale === "en"
    ? {
        kicker: "A harbor for useful ideas",
        titleBefore: "Good tools.",
        titleHighlight: "One place.",
        subtitle:
          "A collection of things I build and use. Find a tool for your work, your learning, or your everyday life.",
        homeLabel: "SiteHarbor home",
        brandTag: "A personal collection of useful tools",
        directoryLabel: "Product directory",
        introLabel: "Discover the collection",
        sitesLabel: "Products",
        statsLabel: "Directory statistics",
        manifestLabel: "Explore the collection",
        resultsLabel: "Search results",
        featuredLabel: "Most visited",
        openSite: "Open site",
        exploreSite: "Explore this product",
        searchPlaceholder: "Find a product, a feature, or a link…",
        clearSearch: "Clear search",
        sortLabel: "Sort products",
        sortDefault: "Default order",
        sortPopular: "Most visited",
        sortName: "Name A–Z",
        resetFilters: "Show all products",
        footerNote: "Built with care. Collected in one harbor.",
      }
    : {
        kicker: "让好用的工具，在这里靠岸",
        titleBefore: "各有所长，",
        titleHighlight: "尽在一处。",
        subtitle:
          "这里收录了我正在打磨的产品与工具。工作、学习，或是生活里的小事，总有一个入口用得上。",
        homeLabel: "SiteHarbor 首页",
        brandTag: "个人产品与工具集",
        directoryLabel: "产品导航",
        introLabel: "发现产品与工具",
        sitesLabel: "收录产品",
        statsLabel: "站点统计",
        manifestLabel: "发现更多产品",
        resultsLabel: "筛选结果",
        featuredLabel: "最多人访问",
        openSite: "进入网站",
        exploreSite: "探索这个产品",
        searchPlaceholder: "搜索产品、功能或网址…",
        clearSearch: "清空搜索",
        sortLabel: "产品排序",
        sortDefault: "默认排序",
        sortPopular: "访问最多",
        sortName: "名称排序",
        resetFilters: "查看全部产品",
        footerNote: "认真打磨每个产品，也照顾每件小事。",
      };
}

function formatUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return url;
  }
}
