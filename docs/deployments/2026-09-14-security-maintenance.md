# 2026-09-14 磁盘与依赖安全维护

## 已完成的服务器清理

- 清理前根分区 98%，约 1.1 GB 可用。清理无容器引用的无标签镜像、历史系统日志、npm 下载缓存和 DNF 缓存后，可用 11,085,623,296 字节（约 10.3 GiB），使用率 73%。
- 保留所有运行及停止容器、命名镜像（含回滚版本）、数据卷、业务文件、源码和数据库备份。
- 系统日志从约 2.7 GB 缩减为 440 MB；新增 `/etc/systemd/journald.conf.d/60-siteharbor-disk-budget.conf`，限制 512 MB，并为系统保留 2 GB 空间。
- Compose 为 SiteHarbor 设置容器日志轮转：单文件 10 MB，最多 3 份。
- Docker 构建仅安装一次依赖，生产阶段使用裁剪后的依赖；npm 下载缓存保留在 BuildKit cache mount，移除 `.next/cache`，减少运行镜像体积。

## 安全修复与兼容范围

- Next.js / eslint-config-next 从 16.2.6 同步升级至 16.3.5，带入修复后的 sharp 和 PostCSS。
- Prisma / @prisma/client 保持 6.19.3，通过限定在 `@prisma/config` 下的 npm override 使用 deepmerge-ts 8.0.0。
- [Next.js 图像优化安全公告](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)与 [deepmerge-ts 8.0.0 发布说明](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0)是本次修复版本依据。
- deepmerge-ts 8 的 Map 合并行为有变化；当前项目没有 Prisma 配置中的 Map，自带配置加载使用普通对象。新增配置文件加载和循环引用回归，另验证 Prisma 生成与迁移。
- 其余漏洞依赖通过不带 `--force` 的 `npm audit fix` 在已有版本约束内更新。未执行 Prisma 自动降级。
- 范围为 SiteHarbor npm 依赖与镜像/日志空间管理，不代表对同服务器其他应用或操作系统做过全面渗透测试。

## 发布前备份

- `/opt/siteharbor-backups/20260914144927/siteharbor.db`，权限 0600；SQLite 完整性检查和 8 条站点记录数量比对通过。
- `siteharbor-siteharbor:rollback-20260914144927` 保留本次修复前镜像；源码为 7228239。
- 同时保留更早的 UI 更新前备份与回滚镜像。

## 验证与发布状态

- 全量 npm audit：0 项已知漏洞（包含开发依赖），审计基准为 2026-09-14 的官方 npm registry。
- lint、typecheck、完整 Next.js 构建通过。
- Prisma 配置与循环引用回归 2/2 通过；隔离 SQLite 完整执行 4 条迁移；Linux 镜像内重复配置回归 2/2 通过。
- 本地浏览器：未登录后台拦截、错误密码拒绝、正确登录、HttpOnly / SameSite=Lax、篡改 Cookie 拒绝、排序菜单、390px 无横向溢出均通过。
- 岁时图标在本地预览受站点自身 same-origin 策略阻拦，使用既有文字回退；线上同源图标另行验收。
- 已部署应用源码 `eb64b77`；运行镜像 `sha256:9fdf05b5bd9a8643c75993204a8662b90241ad880cfcdaa1cfdcf6f35e15973b`，容器 running、重启次数 0。
- 从生产容器提取实际 package.json / package-lock.json 后再次执行生产依赖审计：0 项已知漏洞。运行版本确认为 Next.js 16.3.5、sharp 0.35.4、Prisma 6.19.3、deepmerge-ts 8.0.0。
- 镜像实际大小 1,171,409,075 → 870,547,673 字节，下降约 25.7%；传输压缩包约 440 → 258 MB。
- 发布后最终可用空间 10,385,006,592 字节（df 显示 9.7G），根分区使用率从 98% 降至 75%。新的运行镜像、两版回滚镜像与数据库备份均保留。
- 线上浏览器验证：首页 200，新名称、排序、岁时/问衡图标成功加载，390px 无横向溢出；工作截图在 `output/playwright/security-release-mobile.png`。
- HTTP 验证：未登录 `/admin/sites` 返回 307 到登录页，登录页 200，原考试入口 307 到 `/wenheng/`，图片优化接口返回 200 image/webp；CSP/HSTS 等响应头正常。
- 生产 SQLite 完整性正常；8 条站点业务资料与发布前备份一致，点击量未减少，管理员账号、密码哈希和会话版本未变。
- 已清理本次上传的镜像包、Git bundle、临时 QA 容器与 3101 测试进程；原有本地预览保持可用。
