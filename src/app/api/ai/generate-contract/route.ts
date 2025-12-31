import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { generateContractWithAI } from "@/server/services/aiService";

const schema = z.object({
  templateId: z.string(),
  employeeId: z.string(),
  extraParams: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "automations:ai");

  const parsed = schema.parse(await req.json());
  const result = await generateContractWithAI(parsed);

  return NextResponse.json(result);
}
