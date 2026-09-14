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
- Linux 镜像已构建；生产发布与线上验收待完成。
