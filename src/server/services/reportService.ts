import { ReportFormat } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { buildExcelBuffer } from "@/lib/utils/excel";
import { buildPdfFromRows } from "@/lib/utils/pdf";

type RunResult = {
  rows: Record<string, any>[];
};

export async function listReportTemplates() {
  return prisma.reportTemplate.findMany({ orderBy: { createdAt: "desc" } });
}

export async function upsertReportTemplate(input: {
  name: string;
  description?: string;
  jsonSchema: any;
  queryDefinition: any;
  outputLayout: any;
  createdById?: string;
}) {
  return prisma.reportTemplate.upsert({
    where: { name: input.name },
    update: {
      description: input.description,
      jsonSchema: input.jsonSchema,
      queryDefinition: input.queryDefinition,
      outputLayout: input.outputLayout,
      createdById: input.createdById,
    },
    create: input,
  });
}

export async function runReport(
  templateId: string,
  params: Record<string, any>,
  runById?: string,
) {
  const template = await prisma.reportTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Template not found");

  const rows = await buildRows(template.queryDefinition as any, params);

  const run = await prisma.reportRun.create({
    data: {
      templateId,
      runById,
      params,
      format: ReportFormat.EXCEL,
      data: rows,
    },
  });

  return { run, rows, template };
}

export async function exportReport(runId: string, format: ReportFormat) {
  const run = await prisma.reportRun.findUnique({
    where: { id: runId },
    include: { template: true },
  });

  if (!run || !run.template) throw new Error("Report not found");

  const rows = (run.data as Record<string, any>[]) ?? [];

  if (format === ReportFormat.EXCEL) {
    const buffer = await buildExcelBuffer(run.template.name, rows);
    return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  }

  const buffer = await buildPdfFromRows(run.template.name, rows);
  return { buffer, contentType: "application/pdf" };
}

async function buildRows(definition: any, params: Record<string, any>): Promise<any[]> {
  const source = definition?.source;

  if (source === "employee") {
    const employees = await prisma.employee.findMany({
      where: {
        status: params.status ?? undefined,
      },
      include: { department: true, position: true },
    });

    if (definition?.groupBy?.includes("department")) {
      const grouped: Record<string, number> = {};
      employees.forEach((emp) => {
        const key = emp.department?.name ?? "Unassigned";
        grouped[key] = (grouped[key] ?? 0) + 1;
      });

      return Object.entries(grouped).map(([department, headcount]) => ({
        department,
        headcount,
      }));
    }

    return employees.map((emp) => ({
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name,
      position: emp.position?.title,
      status: emp.status,
      startDate: emp.startDate,
    }));
  }

  if (source === "contractCost") {
    const costs = await prisma.contractCost.findMany({
      include: { contract: { include: { employee: { include: { department: true } } } } },
    });

    const filtered = params.department
      ? costs.filter((c) => c.contract.employee.department?.code === params.department)
      : costs;

    if (definition?.groupBy?.includes("costType")) {
      const grouped: Record<string, number> = {};
      filtered.forEach((cost) => {
        const key = cost.costType;
        grouped[key] = (grouped[key] ?? 0) + Number(cost.amount);
      });

      return Object.entries(grouped).map(([costType, total]) => ({
        costType,
        total,
      }));
    }

    return filtered.map((cost) => ({
      employee: `${cost.contract.employee.firstName} ${cost.contract.employee.lastName}`,
      department: cost.contract.employee.department?.name,
      costType: cost.costType,
      amount: cost.amount,
      currency: cost.currency,
      effectiveDate: cost.effectiveDate,
    }));
  }

  return [];
}
