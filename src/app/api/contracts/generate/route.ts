import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { createOrUpdateContract, generateContractContent } from "@/server/services/contractService";
import { ContractStatus } from "@prisma/client";

const schema = z.object({
  employeeId: z.string(),
  templateId: z.string(),
  extraParams: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "contracts:generate");

  const parsed = schema.parse(await req.json());
  const result = await generateContractContent(
    parsed.employeeId,
    parsed.templateId,
    parsed.extraParams,
    session.user.id,
  );

  const contract = await createOrUpdateContract({
    employeeId: parsed.employeeId,
    templateId: parsed.templateId,
    startDate: new Date(),
    status: ContractStatus.DRAFT,
    generatedContent: result.content,
  });

  return NextResponse.json({ contractId: contract.id, content: result.content });
}
