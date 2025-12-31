import { prisma } from "@/lib/db/client";
import { EmployeeClient } from "@/components/employees/EmployeeClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function EmployeesPage() {
  await requirePagePermission("employees:view");
  const [employees, departments, positions] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true, position: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.position.findMany({ orderBy: { title: "asc" }, include: { department: true } }),
  ]);

  return (
    <EmployeeClient
      initialEmployees={employees}
      departments={departments}
      positions={positions}
    />
  );
}
