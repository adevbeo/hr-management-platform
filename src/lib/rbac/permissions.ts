import { PermissionScope } from "@prisma/client";
import { prisma } from "../db/client";
import { logger } from "../logger";

export type PermissionKey = `${string}:${string}`;

export type UserPermission = {
  key: PermissionKey;
  scope: PermissionScope;
  roleId: string;
};

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  if (!userId) return [];
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions: UserPermission[] = [];
  roles.forEach((userRole) => {
    userRole.role.permissions.forEach((rp) => {
      permissions.push({
        key: `${rp.permission.module}:${rp.permission.action}` as PermissionKey,
        scope: rp.scope,
        roleId: userRole.roleId,
      });
    });
  });

  return permissions;
}

export function hasPermission(
  permissions: UserPermission[],
  key: PermissionKey,
  scope?: PermissionScope,
) {
  return permissions.some(
    (p) => p.key === key && (scope ? p.scope === scope || p.scope === PermissionScope.ALL : true),
  );
}

export async function requirePermission(userId: string, key: PermissionKey) {
  const permissions = await getUserPermissions(userId);
  if (!hasPermission(permissions, key)) {
    logger.warn({ userId, key }, "Permission denied");
    throw new Error("FORBIDDEN");
  }
  return permissions;
}
