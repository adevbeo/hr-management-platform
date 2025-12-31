import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { listRoles, upsertRole } from "@/server/services/rbacService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "admin:rbac");
  const roles = await listRoles();
  return NextResponse.json(roles);
}

const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      permissionId: z.string(),
      scope: z.string().optional(),
    }),
  ),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "admin:rbac");

  const parsed = roleSchema.parse(await req.json());
  const role = await upsertRole(
    parsed.name,
    parsed.description ?? "",
    parsed.permissions.map((p) => ({
      permissionId: p.permissionId,
      scope: p.scope as any,
    })),
  );

  return NextResponse.json(role, { status: 201 });
}
