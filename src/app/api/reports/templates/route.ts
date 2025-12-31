import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { listReportTemplates, upsertReportTemplate } from "@/server/services/reportService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "reports:view");
  const templates = await listReportTemplates();
  return NextResponse.json(templates);
}

const schema = z.object({
  name: z.string(),
  description: z.string().optional(),
  jsonSchema: z.any(),
  queryDefinition: z.any(),
  outputLayout: z.any(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "reports:create");

  const parsed = schema.parse(await req.json());
  const template = await upsertReportTemplate({
    ...parsed,
    createdById: session.user.id,
  });

  return NextResponse.json(template, { status: 201 });
}
