import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function requirePagePermission(permission?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  if (permission) {
    const perms = (session.user as any).permissions ?? [];
    if (!perms.includes(permission)) {
      redirect("/dashboard");
    }
  }

  return session;
}
