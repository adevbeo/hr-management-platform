import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";

const positionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "positions:view");

  const positions = await prisma.position.findMany({
    orderBy: { title: "asc" },
    include: { department: true },
  });
  return NextResponse.json(positions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requirePermission(session.user.id, "positions:create");

  const parsed = positionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const position = await prisma.position.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        department: parsed.data.departmentId ? { connect: { id: parsed.data.departmentId } } : undefined,
      },
    });
    return NextResponse.json(position, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to create position" }, { status: 400 });
  }
}
