import { prisma } from "@/lib/db/client";
import { SchedulerClient } from "@/components/scheduler/SchedulerClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function SchedulerPage() {
  await requirePagePermission("scheduler:manage");
  const [templates, schedules] = await Promise.all([
    prisma.reportTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.scheduledReport.findMany({ include: { template: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return <SchedulerClient templates={templates} schedules={schedules} />;
}
