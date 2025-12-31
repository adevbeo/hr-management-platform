import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { assignRoleToUser } from "@/server/services/rbacService";

const schema = z.object({
  userId: z.string(),
  roleId: z.string(),
  scope: z.string().optional(),
  departmentId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "admin:rbac");

  const parsed = schema.parse(await req.json());
  const record = await assignRoleToUser(
    parsed.userId,
    parsed.roleId,
    parsed.scope as any,
    parsed.departmentId,
  );

  return NextResponse.json(record, { status: 201 });
}
