import { prisma } from "@/lib/db/client";
import { requirePagePermission } from "@/lib/auth/guard";
import { DepartmentsClient } from "@/components/org/DepartmentsClient";

export default async function DepartmentsPage() {
  await requirePagePermission("departments:view");
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return <DepartmentsClient initialDepartments={departments} />;
}
