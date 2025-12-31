import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { generateReportInsights } from "@/server/services/aiService";

const schema = z.object({
  reportRunId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "automations:ai");

  const parsed = schema.parse(await req.json());
  const result = await generateReportInsights(parsed.reportRunId);

  return NextResponse.json(result);
}
