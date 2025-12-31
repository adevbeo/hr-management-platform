import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/options";
import { SidebarNav, NavItem } from "@/components/navigation/sidebar";

const NAV_ITEMS: (NavItem & { permission?: string })[] = [
  { label: "Tổng quan", href: "/dashboard", icon: "Home", permission: "dashboard:view" },
  { label: "Nhân sự", href: "/employees", icon: "Users", permission: "employees:view" },
  { label: "Hợp đồng", href: "/contracts", icon: "FileText", permission: "contracts:view" },
  { label: "Báo cáo", href: "/reports", icon: "ClipboardList", permission: "reports:view" },
  { label: "Tự động hóa", href: "/automations", icon: "Bot", permission: "automations:ai" },
  { label: "Lịch gửi", href: "/scheduler", icon: "Clock3", permission: "scheduler:manage" },
  { label: "Quản trị phân quyền", href: "/admin/rbac", icon: "ShieldCheck", permission: "admin:rbac" },
];

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const permissions = (session?.user as any)?.permissions ?? [];
  const items = NAV_ITEMS.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex">
          <SidebarNav items={items} />
          <div className="flex min-h-screen flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur-md">
              <div>
                <div className="text-sm text-slate-500">Xin chào</div>
                <div className="text-base font-semibold">{session?.user?.email}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Tổng quan
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Đăng xuất
                  </button>
                </form>
              </div>
            </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
