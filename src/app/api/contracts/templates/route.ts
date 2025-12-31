import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { listContractTemplates, upsertContractTemplate } from "@/server/services/contractService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "contracts:view");
  const templates = await listContractTemplates();
  return NextResponse.json(templates);
}

const templateSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(),
  mergeFields: z.record(z.string(), z.any()),
  aiPrompt: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "contracts:create");

  const parsed = templateSchema.parse(await req.json());
  const template = await upsertContractTemplate({
    name: parsed.name,
    type: parsed.type,
    content: parsed.content,
    mergeFields: parsed.mergeFields,
    aiPrompt: parsed.aiPrompt,
    createdBy: { connect: { id: session.user.id } },
  });

  return NextResponse.json(template, { status: 201 });
}
