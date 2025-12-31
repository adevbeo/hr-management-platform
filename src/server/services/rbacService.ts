import { PermissionScope, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
}

export async function listRoles() {
  return prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, userRoles: true },
    orderBy: { name: "asc" },
  });
}

export async function upsertRole(
  name: string,
  description: string,
  permissions: { permissionId: string; scope?: PermissionScope }[],
) {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: role.id,
      permissionId: p.permissionId,
      scope: p.scope ?? PermissionScope.ALL,
    })),
  });

  return role;
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  scope: PermissionScope = PermissionScope.ALL,
  departmentId?: string,
) {
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: { scope, departmentId },
    create: { userId, roleId, scope, departmentId },
  });
}
