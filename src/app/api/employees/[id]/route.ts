import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { deleteEmployee, getEmployee, parseStatus, updateEmployee } from "@/server/services/employeeService";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "employees:view");

  const employee = await getEmployee(params.id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "employees:edit");

  const parsed = updateSchema.parse(await req.json());
  const employee = await updateEmployee(
    params.id,
    {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email ?? undefined,
      phone: parsed.phone ?? undefined,
      status: parsed.status ? parseStatus(parsed.status) : undefined,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      department: parsed.departmentId
        ? { connect: { id: parsed.departmentId } }
        : parsed.departmentId === null
          ? { disconnect: true }
          : undefined,
      position: parsed.positionId
        ? { connect: { id: parsed.positionId } }
        : parsed.positionId === null
          ? { disconnect: true }
          : undefined,
      manager: parsed.managerId
        ? { connect: { id: parsed.managerId } }
        : parsed.managerId === null
          ? { disconnect: true }
          : undefined,
    },
    session.user.id,
  );

  return NextResponse.json(employee);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "employees:delete");

  await deleteEmployee(params.id, session.user.id);
  return NextResponse.json({ ok: true });
}
