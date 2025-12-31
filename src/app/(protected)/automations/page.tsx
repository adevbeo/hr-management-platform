import { prisma } from "@/lib/db/client";
import { AutomationsClient } from "@/components/automations/AutomationsClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function AutomationsPage() {
  await requirePagePermission("automations:ai");
  const [templates, employees, reportRuns] = await Promise.all([
    prisma.contractTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ orderBy: { firstName: "asc" } }),
    prisma.reportRun.findMany({ orderBy: { generatedAt: "desc" }, take: 5 }),
  ]);

  return (
    <AutomationsClient
      templates={templates}
      employees={employees}
      reportRuns={reportRuns}
    />
  );
}
