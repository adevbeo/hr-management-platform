import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/client";
import { registerScheduledReport } from "@/server/services/schedulerService";

const schema = z.object({
  templateId: z.string(),
  scheduleCron: z.string(),
  recipients: z.array(z.string()),
  filters: z.record(z.string(), z.any()).optional(),
  active: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "scheduler:manage");

  const records = await prisma.scheduledReport.findMany({
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "scheduler:manage");

  const parsed = schema.parse(await req.json());
  const record = await prisma.scheduledReport.create({
    data: {
      templateId: parsed.templateId,
      scheduleCron: parsed.scheduleCron,
      recipients: parsed.recipients,
      filters: parsed.filters,
      active: parsed.active,
    },
  });

  if (record.active) {
    registerScheduledReport(record);
  }

  return NextResponse.json(record, { status: 201 });
}
