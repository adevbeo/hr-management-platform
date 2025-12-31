import { prisma } from "@/lib/db/client";
import { requirePagePermission } from "@/lib/auth/guard";
import { DailyReportsClient } from "@/components/reports/DailyReportsClient";

export default async function DailyReportsPage() {
  const session = await requirePagePermission("workreports:view");
  const permissions = (session?.user as any)?.permissions ?? [];
  const userId = (session?.user as any)?.id as string | undefined;
  const canReview = permissions.includes("workreports:review");
  const canSubmit = permissions.includes("workreports:submit");

  const [reports, employees] = await Promise.all([
    prisma.workReport.findMany({
      where: canReview ? {} : { submitterId: userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        employee: { include: { department: true, position: true } },
        reviewer: true,
        submitter: true,
      },
    }),
    prisma.employee.findMany({
      orderBy: { firstName: "asc" },
      include: { department: true, position: true },
    }),
  ]);

  const defaultEmployeeId =
    employees.find(
      (emp) =>
        emp.email &&
        emp.email.toLowerCase() === (session?.user?.email ?? "").toLowerCase(),
    )?.id ?? "";

  return (
    <DailyReportsClient
      initialReports={reports as any}
    employees={employees as any}
    canReview={canReview}
    canSubmit={canSubmit}
    defaultEmployeeId={defaultEmployeeId}
  />
);
}
