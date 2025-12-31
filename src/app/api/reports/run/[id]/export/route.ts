import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { exportReport } from "@/server/services/reportService";
import { ReportFormat } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "reports:export");

  const { searchParams } = new URL(req.url);
  const formatParam = (searchParams.get("format") || "pdf").toUpperCase();
  const format = formatParam === "EXCEL" ? ReportFormat.EXCEL : ReportFormat.PDF;

  const result = await exportReport(params.id, format);

  return new NextResponse(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename=\"report-${params.id}.${format === ReportFormat.EXCEL ? "xlsx" : "pdf"}\"`,
    },
  });
}
