import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { requirePermission } from "@/lib/rbac/permissions";
import { createEmployee, listEmployees, parseStatus } from "@/server/services/employeeService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "employees:view");

  const employees = await listEmployees();
  return NextResponse.json(employees);
}

const createEmployeeSchema = z.object({
  employeeCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(session.user.id, "employees:create");

  const json = await req.json();
  const parsed = createEmployeeSchema.parse(json);

  const employee = await createEmployee(
    {
      employeeCode: parsed.employeeCode,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      status: parseStatus(parsed.status),
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      department: parsed.departmentId ? { connect: { id: parsed.departmentId } } : undefined,
      position: parsed.positionId ? { connect: { id: parsed.positionId } } : undefined,
      manager: parsed.managerId ? { connect: { id: parsed.managerId } } : undefined,
    },
    session.user.id,
  );

  return NextResponse.json(employee, { status: 201 });
}
