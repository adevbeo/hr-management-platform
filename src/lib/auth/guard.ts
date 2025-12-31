import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function requirePagePermission(permission?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  if (permission) {
    const perms = (session.user as any).permissions ?? [];
    if (!perms.includes(permission)) {
      const fallback =
        perms.includes("workreports:view")
          ? "/reports/daily"
          : perms.includes("employees:view")
            ? "/employees"
            : perms.includes("dashboard:view")
              ? "/dashboard"
              : "/auth/signin";
      redirect(fallback);
    }
  }

  return session;
}
