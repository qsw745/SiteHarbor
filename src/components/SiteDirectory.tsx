"use client";

import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteAvatar } from "@/components/SiteAvatar";
import { format, type Dictionary, type Locale } from "@/lib/i18n";
import {
  Activity,
  Anchor,
  ArrowUpRight,
  Compass,
  Search,
  Tag,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

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

type SiteNarrative = {
  longDescription: string;
  role: string;
  highlights: string[];
};

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #0b4f6c 0%, #0f8f86 52%, #f4c95d 130%)",
  "linear-gradient(135deg, #10202c 0%, #2563eb 58%, #77d4cf 128%)",
  "linear-gradient(135deg, #0b4f6c 0%, #77d4cf 60%, #f4c95d 132%)",
  "linear-gradient(135deg, #10202c 0%, #0f8f86 54%, #fb7185 138%)",
  "linear-gradient(135deg, #0b4f6c 0%, #2563eb 58%, #f4c95d 134%)",
  "linear-gradient(135deg, #10202c 0%, #0f8f86 56%, #77d4cf 126%)",
];

export function SiteDirectory({ categories, sites, dict, locale }: SiteDirectoryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const copy = getDirectoryCopy(locale);

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
  const usedCategoryCount =
    categories.filter((item) => sites.some((site) => site.categorySlug === item.slug)).length +
    (hasUncategorized ? 1 : 0);

  const featuredSite = useMemo(() => {
    if (!filteredSites.length) return null;
    return filteredSites.reduce((best, site) =>
      site.clickCount > best.clickCount ? site : best,
    );
  }, [filteredSites]);

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
  };

  return (
    <main className="harbor-shell flex min-h-screen flex-col">
      <div className="harbor-paper" aria-hidden />

      <header className="harbor-topbar">
        <div className="shell flex items-center justify-between gap-4">
          <BrandMark size="lg" showSubtitle subtitle={dict.brandTag} />
          <div className="flex items-center gap-2">
            <span className="harbor-status-pill hidden sm:inline-flex">
              <span className="harbor-status-dot" />
              {format(dict.home.showing, { shown: sites.length, total: sites.length })}
            </span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </header>

      <section className="harbor-hero shell">
        <div className="harbor-hero-copy">
          <p className="harbor-kicker">
            <Anchor size={13} aria-hidden />
            {copy.kicker}
          </p>
          <h1>
            {dict.home.titleBefore}
            <em>{dict.home.titleHighlight}</em>
          </h1>
          <p className="harbor-subtitle">{copy.subtitle}</p>
        </div>

        <dl className="harbor-ledger" aria-label={copy.statsLabel}>
          <LedgerRow label={dict.home.statSites} value={sites.length} />
          <LedgerRow label={dict.home.statCategories} value={usedCategoryCount} />
          <LedgerRow label={dict.home.statVisits} value={totalVisits} />
        </dl>
      </section>

      <section className="harbor-controls shell">
        <div className="harbor-rule" aria-hidden>
          <span>{copy.manifestLabel}</span>
        </div>
        <div className="harbor-controls-row">
          <label className="harbor-search">
            <Search aria-hidden size={16} />
            <span className="sr-only">{dict.home.searchPlaceholder}</span>
            <input
              className="focus-ring"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={dict.home.searchPlaceholder}
            />
          </label>

          <div className="harbor-category-strip">
            <CategoryChip active={category === "all"} onClick={() => selectCategory("all")}>
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
        </div>
      </section>

      {featuredSite ? (
        <section className="shell">
          <FeaturedCard site={featuredSite} dict={dict} locale={locale} />
        </section>
      ) : null}

      {filteredSites.length ? (
        <section className="harbor-grid shell" aria-label={copy.manifestLabel}>
          {filteredSites
            .filter((site) => !featuredSite || site.id !== featuredSite.id)
            .map((site, index) => (
              <SiteCard
                key={site.id}
                site={site}
                dict={dict}
                locale={locale}
                index={index + 1}
              />
            ))}
        </section>
      ) : (
        <section className="shell">
          <div className="harbor-empty">
            <Compass size={28} aria-hidden />
            <h2>{dict.home.emptyTitle}</h2>
            <p>{query ? dict.home.emptyDescSearch : dict.home.emptyDescNone}</p>
          </div>
        </section>
      )}

      <footer className="harbor-footer shell">
        <span>{format(dict.home.footer.copyright, { year: new Date().getFullYear() })}</span>
        <span>{format(dict.home.showing, { shown: filteredSites.length, total: sites.length })}</span>
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
  const narrative = getSiteNarrative(site, locale, dict);
  const categoryLabel = site.categoryName || dict.home.uncategorized;
  const coverStyle = {
    "--cover-bg": pickCoverGradient(site.slug || site.name),
  } as CSSProperties;

  return (
    <article className="harbor-featured">
      <a
        className="harbor-featured-cover focus-ring"
        href={`/go/${site.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={coverStyle}
        aria-label={`${copy.openSite}: ${site.name}`}
      >
        <span className="harbor-featured-glass" aria-hidden />
        <span className="harbor-featured-flag">{copy.featuredLabel}</span>
        <SiteAvatar iconUrl={site.iconUrl} name={site.name} slug={site.slug} size="lg" />
        <span className="harbor-featured-name">{site.name}</span>
        <span className="harbor-featured-host">{formatUrl(site.url)}</span>
      </a>

      <div className="harbor-featured-body">
        <div className="harbor-featured-meta">
          <span className="harbor-tag">
            <Tag size={12} aria-hidden />
            {categoryLabel}
          </span>
          <span className="harbor-visits">
            <Activity size={13} aria-hidden />
            {format(dict.home.visits, { count: site.clickCount })}
          </span>
        </div>
        <h2>{site.name}</h2>
        <p className="harbor-featured-lead">{site.description || dict.home.noDescription}</p>
        <p className="harbor-featured-long">{narrative.longDescription}</p>

        <ol className="harbor-featured-highlights">
          {narrative.highlights.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>

        <div className="harbor-featured-actions">
          <a
            className="harbor-visit-button focus-ring"
            href={`/go/${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.openSite}
            <ArrowUpRight size={16} aria-hidden />
          </a>
          <span className="harbor-featured-role">{narrative.role}</span>
        </div>
      </div>
    </article>
  );
}

function SiteCard({
  site,
  dict,
  locale,
  index,
}: {
  site: DirectorySite;
  dict: Dictionary;
  locale: Locale;
  index: number;
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
      <span className="harbor-card-keel" aria-hidden />
      <div className="harbor-card-top">
        <SiteAvatar iconUrl={site.iconUrl} name={site.name} slug={site.slug} size="md" />
        <span className="harbor-card-index">{String(index).padStart(2, "0")}</span>
      </div>
      <h3 className="harbor-card-name">
        {site.name}
        <ArrowUpRight size={15} aria-hidden className="harbor-card-arrow" />
      </h3>
      <p className="harbor-card-host">{formatUrl(site.url)}</p>
      <p className="harbor-card-desc">{site.description || dict.home.noDescription}</p>
      <div className="harbor-card-foot">
        <span className="harbor-tag">
          <Tag size={11} aria-hidden />
          {categoryLabel}
        </span>
        <span className="harbor-visits">
          <Activity size={12} aria-hidden />
          {format(dict.home.visits, { count: site.clickCount })}
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

function pickCoverGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

function getSiteNarrative(site: DirectorySite, locale: Locale, dict: Dictionary): SiteNarrative {
  const description = site.description || dict.home.noDescription;
  const category = site.categoryName || dict.home.uncategorized;

  const zhNarratives: Record<string, SiteNarrative> = {
    siteharbor: {
      longDescription:
        "这是这台服务器的总入口，也是所有产品网站的索引页。它把分散在不同路径、子域和服务里的项目收束到一个可浏览的空间里，让访客不用记住每一个地址，也能快速理解每个站点的用途、状态和访问路径。",
      role: "服务器入口总控台",
      highlights: [
        "公开页负责展示可访问的网站，后台负责维护名称、分类、排序、启停和目标链接。",
        "每一次从入口跳转都会记录访问次数，方便判断哪些站点更常被打开。",
        "适合作为服务器主页，既能给访客导航，也能给自己留一张完整的网站地图。",
      ],
    },
    benliu: {
      longDescription:
        "奔流是面向桌面端的下载管理工具，重点解决浏览器下载分散、任务状态不清晰、视频站点处理复杂的问题。入口页用于把产品官网、下载说明和后续更新集中呈现，方便用户从一个稳定路径抵达。",
      role: "桌面下载管理器官网",
      highlights: [
        "浏览器扩展接管普通下载，多连接任务进入统一桌面队列。",
        "视频站点交给独立处理链路，减少普通下载和媒体解析互相干扰。",
        "适合作为用户下载、查看更新、理解产品能力的固定入口。",
      ],
    },
    birthday: {
      longDescription:
        "生日提醒站点把农历生日、下一次提醒时间和邮件通知放在一个轻量页面里。它更像一份安静运行的生活清单，负责把容易忘记的重要日期提前托管起来。",
      role: "生日与提醒管理",
      highlights: [
        "支持维护生日清单，并自动计算下一次需要提醒的时间。",
        "适合存放家人朋友的重要日期，减少临近当天才想起来的尴尬。",
        "邮件提醒让它可以在后台安静运行，不需要每天手动打开检查。",
      ],
    },
    profiledock: {
      longDescription:
        "ProfileDock 用来管理 Claude、Codex 等多账号本地配置，把不同账号的数据目录、启动入口和 Dock 图标隔离开。它的价值在于减少反复登录、切换环境和误用账号带来的混乱。",
      role: "多账号本地隔离工具",
      highlights: [
        "每个账号拥有独立的数据目录和启动入口，降低配置互相污染的风险。",
        "适合需要频繁在不同 AI 工具账号之间切换的本地工作流。",
        "备份、重置和入口管理集中在一个工具里，减少手工维护成本。",
      ],
    },
    "qingsong-notes": {
      longDescription:
        "青松笔记用于沉淀个人技术教程、排查记录和长期可复用的操作经验。它不是临时备忘，而是把已经验证过的步骤整理成之后还能重新执行的知识入口。",
      role: "个人技术笔记站",
      highlights: [
        "适合存放教程、排错过程、部署记录和反复使用的命令说明。",
        "内容面向之后的自己，强调可复现、可检索和少走弯路。",
        "作为服务器上的公开笔记入口，可以和其它产品站点自然串联。",
      ],
    },
    cloudshellconsole: {
      longDescription:
        "CloudShellConsole 是专业 SSH/SFTP 客户端的产品入口，面向需要经常连接服务器、管理文件和处理远程终端任务的用户。它强调原生桌面体验、多标签工作流和更安全的本地认证方式。",
      role: "SSH/SFTP 桌面客户端",
      highlights: [
        "终端、多标签和 SFTP 文件传输放在同一个桌面工作区里。",
        "面向 macOS 和 Windows 原生体验，减少 Web 工具常见的割裂感。",
        "支持 Touch ID / 安全隔区等认证方式，让高频连接更顺手。",
      ],
    },
    "online-exam": {
      longDescription:
        "在线考试系统负责题库、考试、阅卷、学习进度和后台权限等教学管理流程。它适合把考试组织、过程管理和结果查看集中在一个稳定入口里。",
      role: "在线考试与题库平台",
      highlights: [
        "覆盖题库维护、考试组织、阅卷和学习进度查看等核心流程。",
        "统一挂载在服务器固定路径，方便学生或管理员直接访问。",
        "后台权限与考试管理集中化，适合持续扩展教学场景。",
      ],
    },
  };

  const enNarratives: Record<string, SiteNarrative> = {
    siteharbor: {
      longDescription:
        "This is the server's front door and the map for every hosted project. It turns scattered paths, subdomains, and services into one readable directory so visitors can understand what each site does before opening it.",
      role: "Server entry console",
      highlights: [
        "The public page presents enabled sites while the admin area maintains names, categories, order, status, and target URLs.",
        "Every SiteHarbor jump records a visit count, making frequently used destinations easier to spot.",
        "It works as a practical server homepage for visitors and as a living site map for maintenance.",
      ],
    },
    benliu: {
      longDescription:
        "Benliu is a desktop download manager entry point. It gives users a stable place to understand the product, reach downloads, and follow updates without hunting through scattered links.",
      role: "Download manager site",
      highlights: [
        "Browser extension capture and desktop queue management live in one workflow.",
        "Media sites can use a dedicated path so ordinary downloads stay clean.",
        "The entry is built for downloads, product context, and update discovery.",
      ],
    },
  };

  const fallback: SiteNarrative = {
    longDescription:
      locale === "en"
        ? `${description} This entry keeps the destination, category, and visit context together so the site can be understood before opening it.`
        : `${description} 这个入口会把目标地址、分类、访问热度和站点说明放在一起展示，让访客在点击前先知道它解决什么问题、适合什么场景。`,
    role: category,
    highlights:
      locale === "en"
        ? [
            "Search and category filters keep the directory useful as the number of sites grows.",
            "Every card keeps the icon, description, entry path, and visit heat together.",
            "The `/go` entry keeps navigation consistent while preserving the target URL.",
          ]
        : [
            "搜索和分类可以在站点变多后继续保持入口清晰。",
            "每张卡片都保留图标、说明、访问路径与热度。",
            "统一通过 `/go` 入口跳转，既保持导航一致，也保留真实目标地址。",
          ],
  };

  return (locale === "en" ? enNarratives[site.slug] : zhNarratives[site.slug]) ?? fallback;
}

function getDirectoryCopy(locale: Locale) {
  if (locale === "en") {
    return {
      kicker: "Harbor manifest",
      subtitle:
        "Browse hosted sites with their icons, paths, categories, and visit context kept together.",
      statsLabel: "Directory statistics",
      manifestLabel: "Site manifest",
      featuredLabel: "Featured",
      openSite: "Open site",
    };
  }

  return {
    kicker: "港湾清单",
    subtitle: "按分类和搜索快速定位站点，每个入口都保留图标、说明、访问路径与热度。",
    statsLabel: "站点统计",
    manifestLabel: "站点清单",
    featuredLabel: "精选站点",
    openSite: "进入网站",
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
