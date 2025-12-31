import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { exportContractPdf } from "@/server/services/contractService";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "contracts:view");

  const buffer = await exportContractPdf(params.id);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract-${params.id}.pdf"`,
    },
  });
}
