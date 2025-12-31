import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { WorkReportStatus } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";

const createSchema = z.object({
  content: z.string().min(1),
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "workreports:view");

  const perms = (session.user as any)?.permissions ?? [];
  const canReview = perms.includes("workreports:review");

  const reports = await prisma.workReport.findMany({
    where: canReview ? {} : { submitterId: session.user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      employee: { include: { department: true, position: true } },
      reviewer: true,
      submitter: true,
    },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "workreports:submit");

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const employee =
    session.user?.email
      ? await prisma.employee.findFirst({ where: { email: session.user.email } })
      : null;

  if (!employee) {
    return NextResponse.json({ error: "No employee profile found for this user" }, { status: 400 });
  }

  const today = startOfToday();

  try {
    const report = await prisma.workReport.create({
      data: {
        employeeId: employee.id,
        submitterId: session.user.id,
        date: today,
        content: parsed.data.content,
        status: WorkReportStatus.PENDING,
      },
      include: {
        employee: { include: { department: true, position: true } },
        reviewer: true,
        submitter: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to create report" }, { status: 400 });
  }
}
