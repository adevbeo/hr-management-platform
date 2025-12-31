import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "positions:edit");

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const position = await prisma.position.update({
      where: { id: params.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? undefined,
        department: parsed.data.departmentId
          ? { connect: { id: parsed.data.departmentId } }
          : parsed.data.departmentId === null
            ? { disconnect: true }
            : undefined,
      },
    });
    return NextResponse.json(position);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to update position" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "positions:delete");

  try {
    await prisma.position.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to delete position" }, { status: 400 });
  }
}
