import { prisma } from "@/lib/db/client";
import { RbacClient } from "@/components/admin/RbacClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function RbacPage() {
  await requirePagePermission("admin:rbac");
  const [roles, permissions, users] = await Promise.all([
    prisma.role.findMany({ include: { permissions: { include: { permission: true } }, userRoles: true } }),
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] }),
    prisma.user.findMany({ orderBy: { email: "asc" } }),
  ]);

  return <RbacClient roles={roles} permissions={permissions} users={users} />;
}
