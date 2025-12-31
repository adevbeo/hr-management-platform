import { prisma } from "@/lib/db/client";
import { ReportsClient } from "@/components/reports/ReportsClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function ReportsPage() {
  await requirePagePermission("reports:view");
  const templates = await prisma.reportTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return <ReportsClient templates={templates} />;
}
