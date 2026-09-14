# 2026-09-14 公开导航页打磨验收

状态：2026-09-14 已部署生产并完成线上验收。此前本地预览使用独立 SQLite 数据库；本次生产变更在备份校验后通过 Prisma 迁移应用。发布记录见 `docs/deployments/2026-09-14-ui-release.md`。

## 排序菜单后续打磨

- 原生 select 改为独立 `DirectorySort` 圆角浮层菜单：统一白底、海青色选中态、勾选标记、展开箭头和间距。
- 真实浏览器验证：点击选项保持排序功能；点击外部关闭；上下键循环、Home/End、Enter、Escape 回焦和 Tab 继续到下一张卡片均通过。
- 菜单在 320、390、1440 像素宽度内无越界；桌面与手机截图已更新，局部截图见 `docs/design/qa/siteharbor-sort-menu.png`。
- 本次改动后 lint、包含类型检查的生产构建、diff 检查均通过。

## 视觉结果

- 海青色页面、紧凑首屏、右侧深青精选入口，桌面三列／平板两列／手机单列产品卡片。
- 卡片完整展示简介，统一名称、图标、网址和访问入口；取消无业务含义的序号。
- 桌面截图：`docs/design/qa/siteharbor-public-desktop-1440x1024.png`（1440×1024 视口，全页截图）。
- 手机截图：`docs/design/qa/siteharbor-public-mobile-390x844.png`（390×844 视口，全页截图）。
- 两张截图已更新为线上 `https://qisw.top/` 的生产页面，桌面全页图已人工查看。

## 已验证

- `npm run lint`、`npm run typecheck`、`npm run build` 和 `git diff --check` 通过。
- 320、390、768、1440 像素宽度无横向溢出；英文 390 像素布局亦通过。
- 新名称与旧名称检索、零结果与重置、清空按钮、Escape 清空、分类选中状态、访问次数排序、名称排序、中英文切换通过浏览器操作与断言验证。
- 键盘焦点可见；减少动态效果设置关闭过渡。
- 首页返回 200，保留 CSP/HSTS 等安全响应头；旧 `/go/online-exam` 返回 307 到 `https://qisw.top/wenheng/`，`/go/birthday` 返回 307 到原生日网址。
- 品牌迁移已在隔离数据库执行：名称改为“岁时”“问衡”，保留 ID、slug、访问次数、自定义名称与自定义图标，不修改其他域名下的同名站点。
- Inter/Fraunces 字体本地打包后正式构建成功，不再请求 Google Fonts。

## 明确边界

- “岁时”网站 favicon 返回 `Cross-Origin-Resource-Policy: same-origin`，localhost 使用“岁”字回退；生产站点与图标同源，线上浏览器已验证图标加载完成且可见。
- 未修改生日产品自身的旧网页标题，只更新 SiteHarbor 目录中的品牌资料。
- 服务器镜像部署、生产数据库迁移和线上首页、名称、排序菜单、图标、移动端布局、跳转均已验证。
- 本次范围是公开导航页。以下后台记录保留为历史证据，未把它当作本次重新验收的结果。

---

**Product Design QA**

- Source visual truth path: `docs/design/qa/harbor-control-source.png`
- Implementation screenshot path: `docs/design/qa/siteharbor-admin-sites-1440x1024.png`
- Viewport: `1440x1024`
- State: authenticated `/admin/sites`, local SQLite demo data
- Full-view comparison evidence: `docs/design/qa/siteharbor-admin-comparison.png`
- Focused region comparison evidence: not needed for this pass; the main fidelity risks were global layout, brand asset placement, admin/editor proportions, and responsive control wrapping, all visible in the full desktop capture.
- Public portal carousel evidence: `docs/design/qa/siteharbor-public-desktop-1440x1024.png` and `docs/design/qa/siteharbor-public-mobile-390x844.png`

**Findings**

- No actionable P0/P1/P2 findings remain.

**Open Questions**

- The source mock includes non-existing controls such as extra top-right admin affordances and richer filter controls. The implementation intentionally preserves the current functional scope instead of adding nonfunctional UI.

**Implementation Checklist**

- Real generated harbor app icon is used in the product chrome and metadata.
- Public portal uses the Harbor Control palette, brand lockup, grouped command surface, stable stats, search, category chips, and scan-friendly site cards.
- Historical public portal used the Harbor Manifest layout: serif editorial masthead with accent-italic highlight, ledger-style stats with dotted leaders, search + category chip controls under a labelled rule, a featured (most-visited) site card with gradient cover and curated narrative, and a numbered manifest grid where every card keeps icon, host path, description, category tag, and visit heat together.
- Admin shell uses the new brand lockup, sea-teal active navigation, status panel, top command bar, metric panels, grouped site editing rows, right-side editor, and public page preview.
- Login screen uses the new brand lockup and updated surface treatment.
- Desktop and mobile screenshots were captured for visible layout checks.

**Patches Made Since Previous QA Pass**

- Added `public/brand/siteharbor-icon.png`, `public/icon.png`, and `public/apple-icon.png`.
- Added reusable `BrandMark`.
- Updated global visual tokens, buttons, cards, sidebar, directory shell, and editor/list surfaces.
- Added public preview section to `/admin/sites`.
- Fixed search input leading-icon spacing.
- Added missing i18n labels for the status panel and public preview.

**Final Result**

passed
