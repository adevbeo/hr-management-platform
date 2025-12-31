import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { WorkReportStatus } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";

const updateSchema = z.object({
  status: z.nativeEnum(WorkReportStatus),
  reviewNote: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "workreports:review");

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const report = await prisma.workReport.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
        reviewNote: parsed.data.reviewNote,
      },
      include: {
        employee: { include: { department: true, position: true } },
        reviewer: true,
        submitter: true,
      },
    });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to update report" }, { status: 400 });
  }
}
