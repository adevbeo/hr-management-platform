import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { executeScheduledReport } from "@/server/services/schedulerService";

const schema = z.object({
  scheduleId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "scheduler:manage");

  const parsed = schema.parse(await req.json());
  await executeScheduledReport(parsed.scheduleId);

  return NextResponse.json({ ok: true });
}
