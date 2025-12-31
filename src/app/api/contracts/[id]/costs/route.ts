import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { addContractCost } from "@/server/services/contractService";

const schema = z.object({
  costType: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  note: z.string().optional(),
  effectiveDate: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "contracts:costs");

  const parsed = schema.parse(await req.json());
  const cost = await addContractCost(params.id, {
    id: "",
    contractId: params.id,
    costType: parsed.costType as any,
    amount: parsed.amount,
    currency: parsed.currency,
    note: parsed.note,
    effectiveDate: new Date(parsed.effectiveDate),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json(cost, { status: 201 });
}
