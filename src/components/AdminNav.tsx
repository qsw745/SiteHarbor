"use client";

import { FolderKanban, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/sites", label: "站点", icon: FolderKanban },
  { href: "/admin/categories", label: "分类", icon: Tags },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
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
