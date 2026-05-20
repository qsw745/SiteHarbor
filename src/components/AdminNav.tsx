"use client";

import { FolderKanban, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Labels = {
  sites: string;
  categories: string;
};

export function AdminNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  const items = [
    { href: "/admin/sites", label: labels.sites, icon: FolderKanban },
    { href: "/admin/categories", label: labels.categories, icon: Tags },
  ];

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            className={`admin-nav-item ${active ? "active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <Icon size={16} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
