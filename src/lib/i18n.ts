export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "siteharbor_locale";

export type Dictionary = {
  brand: string;
  brandTag: string;
  viewHomepage: string;
  signOut: string;
  console: string;
  siteManagement: string;
  switchLanguage: string;
  switchTo: { zh: string; en: string };

  home: {
    titleBefore: string;
    titleHighlight: string;
    subtitle: string;
    searchPlaceholder: string;
    all: string;
    uncategorized: string;
    noDescription: string;
    /** Template with `{{count}}` placeholder. */
    visits: string;
    emptyTitle: string;
    emptyDescSearch: string;
    emptyDescNone: string;
    /** Template with `{{shown}}` and `{{total}}` placeholders. */
    showing: string;
    /** Template with `{{count}}` placeholder. */
    totalVisits: string;
    /** Stat tile labels in the hero. */
    statSites: string;
    statCategories: string;
    statVisits: string;
    visitCardLabel: string;
    footer: {
      /** Template with `{{year}}` placeholder. */
      copyright: string;
      tagline: string;
    };
  };

  nav: {
    sites: string;
    categories: string;
  };

  sites: {
    title: string;
    subtitle: string;
    scanNginx: string;
    metricTotal: string;
    metricActive: string;
    metricInactive: string;
    metricClicks: string;
    addSite: string;
    emptyTitle: string;
    emptyDesc: string;
    editorTag: string;
    save: string;
    enable: string;
    disable: string;
    delete: string;
    statusActive: string;
    statusInactive: string;
    /** Template with `{{count}}` placeholder. */
    visits: string;
  };

  categories: {
    title: string;
    subtitle: string;
    addCategory: string;
    add: string;
    existing: string;
    /** Template with `{{count}}` placeholder. */
    countCategories: string;
    /** Template with `{{count}}` placeholder. */
    countSites: string;
    empty: string;
    save: string;
    delete: string;
  };

  fields: {
    name: string;
    slug: string;
    slugAutoPlaceholder: string;
    slugFromNamePlaceholder: string;
    url: string;
    urlPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    iconUrl: string;
    iconUrlPlaceholder: string;
    category: string;
    status: string;
    sortOrder: string;
    statusEnabled: string;
    statusDisabled: string;
  };

  login: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
  };

  metadata: {
    title: string;
    description: string;
  };

  /**
   * Server-action result messages. Values may contain `{{name}}` placeholders that
   * are substituted from the URL query string by `resolveMessage`. Plain strings
   * (no functions) so the dictionary can be passed to client components.
   */
  messages: Record<string, string>;
};

const zh: Dictionary = {
  brand: "SiteHarbor",
  brandTag: "SiteHarbor · 站点导航",
  viewHomepage: "查看首页",
  signOut: "退出登录",
  console: "控制台",
  siteManagement: "网站管理",
  switchLanguage: "切换语言",
  switchTo: { zh: "切换为中文", en: "Switch to English" },

  home: {
    titleBefore: "统一管理你的",
    titleHighlight: "服务器网站入口",
    subtitle: "在这里选择目标站点，链接、分类与启停状态由后台集中维护。",
    searchPlaceholder: "搜索名称、描述、URL",
    all: "全部",
    uncategorized: "未分类",
    noDescription: "暂无描述",
    visits: "{{count}} 次访问",
    emptyTitle: "没有匹配的站点",
    emptyDescSearch: "换一个关键词或者切换分类试试。",
    emptyDescNone: "启用一个站点后，它会出现在这里。",
    showing: "展示 {{shown}} / {{total}} 个站点",
    totalVisits: "累计访问 {{count}}",
    statSites: "在线站点",
    statCategories: "分类",
    statVisits: "累计访问",
    visitCardLabel: "访问",
    footer: {
      copyright: "© {{year}} SiteHarbor",
      tagline: "由 SiteHarbor 统一调度",
    },
  },

  nav: {
    sites: "站点",
    categories: "分类",
  },

  sites: {
    title: "站点列表",
    subtitle: "维护链接、分类与显示状态，启用的站点会出现在公开首页。",
    scanNginx: "扫描 Nginx 配置",
    metricTotal: "站点总数",
    metricActive: "启用",
    metricInactive: "停用",
    metricClicks: "累计访问",
    addSite: "添加站点",
    emptyTitle: "还没有站点",
    emptyDesc: "在右侧添加一个入口，或扫描 Nginx 配置批量导入。",
    editorTag: "Editor",
    save: "保存",
    enable: "启用",
    disable: "停用",
    delete: "删除",
    statusActive: "启用",
    statusInactive: "停用",
    visits: "{{count}} 次访问",
  },

  categories: {
    title: "分类管理",
    subtitle: "分类用于首页筛选，删除分类不会删除站点（站点会变为未分类）。",
    addCategory: "添加分类",
    add: "添加",
    existing: "现有分类",
    countCategories: "{{count}} 个分类",
    countSites: "{{count}} 个站点",
    empty: "还没有分类，站点可以暂时放在「未分类」。",
    save: "保存",
    delete: "删除",
  },

  fields: {
    name: "名称",
    slug: "Slug",
    slugAutoPlaceholder: "自动生成",
    slugFromNamePlaceholder: "留空时按名称自动生成",
    url: "目标 URL",
    urlPlaceholder: "https://example.com",
    description: "描述",
    descriptionPlaceholder: "简短描述此站点",
    iconUrl: "图标 URL",
    iconUrlPlaceholder: "https://example.com/favicon.ico",
    category: "分类",
    status: "状态",
    sortOrder: "排序",
    statusEnabled: "启用",
    statusDisabled: "停用",
  },

  login: {
    title: "管理员登录",
    subtitle: "登录后可维护站点入口、分类、排序与显示状态。",
    passwordLabel: "管理员密码",
    passwordPlaceholder: "输入管理员密码",
    submit: "登录后台",
    submitting: "登录中",
  },

  metadata: {
    title: "SiteHarbor",
    description: "统一管理你的服务器网站入口。",
  },

  messages: {
    "site-created": "站点已添加。",
    "site-updated": "站点已保存。",
    "site-enabled": "站点已启用。",
    "site-disabled": "站点已停用。",
    "site-deleted": "站点已删除。",
    "category-created": "分类已添加。",
    "category-updated": "分类已保存。",
    "category-deleted": "分类已删除，原站点会变为未分类。",
    "discovery-synced": "已同步 {{created}} 个新站点，更新 {{updated}} 个已有站点。",
    "err-slug-taken": "站点 Slug 已存在，请换一个。",
    "err-site-not-found": "站点不存在。",
    "err-category-conflict": "分类名称或 Slug 已存在。",
    "err-discovery-empty": "没有发现可导入的网站，请确认服务器已挂载 Nginx 配置目录。",
    "err-form-invalid": "表单内容无效。",
    "err-password-required": "请输入管理员密码。",
    "err-password-invalid": "密码不正确，或服务器还没有配置 ADMIN_PASSWORD_HASH。",
    "err-name-required": "站点名称不能为空。",
    "err-name-too-long": "站点名称最长 80 个字符。",
    "err-category-name-required": "分类名称不能为空。",
    "err-category-name-too-long": "分类名称最长 60 个字符。",
    "err-slug-required": "Slug 不能为空。",
    "err-slug-too-long": "Slug 最长 80 个字符。",
    "err-slug-format": "Slug 只能包含小写字母、数字和短横线。",
    "err-url-invalid": "请输入有效的 URL。",
    "err-url-protocol": "URL 必须以 http:// 或 https:// 开头。",
    "err-icon-url-invalid": "图标 URL 必须是有效的 http(s) 地址。",
    "err-desc-too-long": "描述最长 240 个字符。",
    "err-sort-order-range": "排序值应在 0 到 99999 之间。",
  },
};

const en: Dictionary = {
  brand: "SiteHarbor",
  brandTag: "SiteHarbor · Site directory",
  viewHomepage: "View site",
  signOut: "Sign out",
  console: "Console",
  siteManagement: "Site management",
  switchLanguage: "Switch language",
  switchTo: { zh: "切换为中文", en: "Switch to English" },

  home: {
    titleBefore: "One place to manage your",
    titleHighlight: "server site directory",
    subtitle:
      "Pick the destination here — links, categories and visibility are maintained from the admin console.",
    searchPlaceholder: "Search name, description, URL",
    all: "All",
    uncategorized: "Uncategorised",
    noDescription: "No description yet.",
    visits: "{{count}} visits",
    emptyTitle: "No sites match",
    emptyDescSearch: "Try a different keyword or switch the category.",
    emptyDescNone: "Enable a site and it will show up here.",
    showing: "Showing {{shown}} of {{total}} sites",
    totalVisits: "{{count}} total visits",
    statSites: "Live sites",
    statCategories: "Categories",
    statVisits: "Total visits",
    visitCardLabel: "Visits",
    footer: {
      copyright: "© {{year}} SiteHarbor",
      tagline: "Routed through SiteHarbor",
    },
  },

  nav: {
    sites: "Sites",
    categories: "Categories",
  },

  sites: {
    title: "Sites",
    subtitle:
      "Maintain links, categories and visibility. Active sites appear on the public homepage.",
    scanNginx: "Scan Nginx config",
    metricTotal: "Total sites",
    metricActive: "Active",
    metricInactive: "Disabled",
    metricClicks: "Total visits",
    addSite: "Add site",
    emptyTitle: "No sites yet",
    emptyDesc: "Add one from the editor on the right, or scan Nginx to import in bulk.",
    editorTag: "Editor",
    save: "Save",
    enable: "Enable",
    disable: "Disable",
    delete: "Delete",
    statusActive: "Active",
    statusInactive: "Disabled",
    visits: "{{count}} visits",
  },

  categories: {
    title: "Categories",
    subtitle:
      "Categories drive the homepage filters. Deleting a category does not delete its sites (they become uncategorised).",
    addCategory: "Add category",
    add: "Add",
    existing: "Existing categories",
    countCategories: "{{count}} categories",
    countSites: "{{count}} sites",
    empty: "No categories yet. Sites can stay in “Uncategorised”.",
    save: "Save",
    delete: "Delete",
  },

  fields: {
    name: "Name",
    slug: "Slug",
    slugAutoPlaceholder: "Auto-generated",
    slugFromNamePlaceholder: "Leave empty to derive from name",
    url: "Target URL",
    urlPlaceholder: "https://example.com",
    description: "Description",
    descriptionPlaceholder: "Short description",
    iconUrl: "Icon URL",
    iconUrlPlaceholder: "https://example.com/favicon.ico",
    category: "Category",
    status: "Status",
    sortOrder: "Sort order",
    statusEnabled: "Active",
    statusDisabled: "Disabled",
  },

  login: {
    title: "Admin sign in",
    subtitle: "Sign in to maintain site entries, categories, sort order and visibility.",
    passwordLabel: "Admin password",
    passwordPlaceholder: "Enter the admin password",
    submit: "Sign in",
    submitting: "Signing in…",
  },

  metadata: {
    title: "SiteHarbor",
    description: "A unified portal for the websites you host.",
  },

  messages: {
    "site-created": "Site added.",
    "site-updated": "Site saved.",
    "site-enabled": "Site enabled.",
    "site-disabled": "Site disabled.",
    "site-deleted": "Site deleted.",
    "category-created": "Category added.",
    "category-updated": "Category saved.",
    "category-deleted": "Category deleted. Its sites are now uncategorised.",
    "discovery-synced":
      "Synced {{created}} new site(s) and updated {{updated}} existing one(s).",
    "err-slug-taken": "That site slug already exists. Choose another.",
    "err-site-not-found": "Site not found.",
    "err-category-conflict": "Category name or slug already exists.",
    "err-discovery-empty":
      "No sites discovered. Make sure the Nginx config directory is mounted.",
    "err-form-invalid": "Form input is invalid.",
    "err-password-required": "Please enter the admin password.",
    "err-password-invalid":
      "Incorrect password, or ADMIN_PASSWORD_HASH has not been configured on the server.",
    "err-name-required": "Name is required.",
    "err-name-too-long": "Name must be 80 characters or fewer.",
    "err-category-name-required": "Category name is required.",
    "err-category-name-too-long": "Category name must be 60 characters or fewer.",
    "err-slug-required": "Slug is required.",
    "err-slug-too-long": "Slug must be 80 characters or fewer.",
    "err-slug-format": "Slug may only contain lowercase letters, digits and dashes.",
    "err-url-invalid": "Please enter a valid URL.",
    "err-url-protocol": "URL must start with http:// or https://.",
    "err-icon-url-invalid": "Icon URL must be a valid http(s) URL.",
    "err-desc-too-long": "Description must be 240 characters or fewer.",
    "err-sort-order-range": "Sort order must be between 0 and 99999.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function resolveLocale(value: string | undefined | null): Locale {
  if (value === "en" || value === "zh") return value;
  return DEFAULT_LOCALE;
}

/** Substitute `{{name}}` placeholders in a template with a params map. */
export function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function translateMessage(
  dict: Dictionary,
  key: string,
  params?: Record<string, string | number>,
): string {
  const template = dict.messages[key];
  if (!template) {
    // Fall back to raw key (so missing translations are visible without crashing).
    return key;
  }
  return format(template, params);
}
