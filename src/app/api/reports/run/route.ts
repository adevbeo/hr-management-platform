import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { runReport } from "@/server/services/reportService";

const schema = z.object({
  templateId: z.string(),
  params: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "reports:run");

  const parsed = schema.parse(await req.json());
  const result = await runReport(parsed.templateId, parsed.params ?? {}, session.user.id);

  return NextResponse.json({ runId: result.run.id, rows: result.rows });
}
