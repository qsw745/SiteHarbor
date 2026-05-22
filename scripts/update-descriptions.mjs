#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const UPDATES = [
  {
    slug: "siteharbor",
    description:
      "服务器站点聚合门户：搜索、筛选并一键直达你部署的全部网站，后台可统一维护链接、分类、排序与启停状态。",
  },
  {
    slug: "benliu",
    description:
      "桌面下载管理器：浏览器扩展接管下载、多连接自适应加速，YouTube / Bilibili 等视频站点交给 yt-dlp 单独处理，所有任务都汇入一个清晰的桌面队列。",
  },
  {
    slug: "birthday",
    description:
      "农历生日提醒中心：维护家人朋友的生日清单，自动计算下一次提醒时间，到点通过邮件准时送达，再也不会错过重要的人。",
  },
  {
    slug: "profiledock",
    description:
      "Claude / Codex 多账号隔离工具：为每个账号分配独立的本地数据目录与 Dock 图标，一键切换、备份与重置，告别反复登出登录的折腾。",
  },
];

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let missing = 0;
  for (const item of UPDATES) {
    const result = await prisma.site.updateMany({
      where: { slug: item.slug },
      data: { description: item.description },
    });
    if (result.count === 0) {
      console.warn(`No site found for slug "${item.slug}", skipped.`);
      missing += 1;
    } else {
      console.log(`Updated ${result.count} site(s) for slug "${item.slug}".`);
      updated += result.count;
    }
  }
  console.log(`\nDone. Updated ${updated}, skipped ${missing}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
