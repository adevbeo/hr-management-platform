import { EmployeeStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

function safeStringify(value: any, max = 1000) {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? s.slice(0, max) : s;
  } catch (e) {
    return String(value).slice(0, max);
  }
}

export async function listEmployees() {
  return prisma.employee.findMany({
    include: { department: true, position: true, manager: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: { department: true, position: true, manager: true, histories: true },
  });
}

export async function createEmployee(
  input: Prisma.EmployeeCreateInput,
  userId?: string,
) {
  const employee = await prisma.employee.create({ data: input });

  await prisma.employeeHistory.create({
    data: {
      employeeId: employee.id,
      field: "created",
      newValue: safeStringify(input),
      userId,
    },
  });

  return employee;
}

export async function updateEmployee(
  id: string,
  input: Prisma.EmployeeUpdateInput,
  userId?: string,
) {
  const before = await prisma.employee.findUnique({ where: { id } });
  const employee = await prisma.employee.update({
    where: { id },
    data: input,
  });

  if (before) {
    await prisma.employeeHistory.create({
      data: {
        employeeId: employee.id,
        field: "updated",
        oldValue: safeStringify(before),
        newValue: safeStringify(input),
        userId,
      },
    });
  }

  return employee;
}

export async function deleteEmployee(id: string, userId?: string) {
  const employee = await prisma.employee.delete({ where: { id } });

  await prisma.employeeHistory.create({
    data: {
      employeeId: id,
      field: "deleted",
      oldValue: safeStringify(employee),
      userId,
    },
  });

  return employee;
}

export function parseStatus(value?: string) {
  if (!value) return EmployeeStatus.ACTIVE;
  return (
    EmployeeStatus[value.toUpperCase() as keyof typeof EmployeeStatus] ??
    EmployeeStatus.ACTIVE
  );
}
