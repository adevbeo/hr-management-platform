'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Settings, Bot, Clock3, ClipboardList, ShieldCheck } from "lucide-react";
import clsx from "clsx";

const iconMap = {
  Home,
  Users,
  FileText,
  Settings,
  Bot,
  Clock3,
  ClipboardList,
  ShieldCheck,
};

type IconName = keyof typeof iconMap;

export type NavItem = {
  label: string;
  href: string;
  icon?: IconName;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="px-4 py-5">
        <div className="text-lg font-semibold text-slate-900">Nền tảng HR</div>
        <p className="text-sm text-slate-500">Quản trị & tự động hóa</p>
      </div>
      <nav className="space-y-1 px-3 pb-6">
        {items.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] ?? Home : Home;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
