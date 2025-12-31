import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { listPermissions } from "@/server/services/rbacService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "admin:rbac");
  const permissions = await listPermissions();
  return NextResponse.json(permissions);
}
