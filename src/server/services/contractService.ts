import { format } from "date-fns";
import {
  Contract,
  ContractCost,
  ContractStatus,
  ContractType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { mergeContractTemplate } from "@/lib/utils/contractTemplate";
import { buildPdfFromHtml } from "@/lib/utils/pdf";

export async function listContractTemplates() {
  return prisma.contractTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertContractTemplate(
  input: Prisma.ContractTemplateCreateInput,
) {
  return prisma.contractTemplate.upsert({
    where: { name: input.name },
    update: input,
    create: input,
  });
}

export async function listContracts() {
  return prisma.contract.findMany({
    include: { employee: true, template: true, costs: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addContractCost(
  contractId: string,
  cost: Omit<ContractCost, "id" | "contractId" | "createdAt" | "updatedAt">,
) {
  return prisma.contractCost.create({
    data: {
      contractId,
      costType: cost.costType,
      amount: cost.amount,
      currency: cost.currency,
      note: cost.note,
      effectiveDate: cost.effectiveDate,
    },
  });
}

export async function generateContractContent(
  employeeId: string,
  templateId: string,
  extra: Record<string, string | number> = {},
  createdById?: string,
) {
  const [employee, template, costs] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, position: true },
    }),
    prisma.contractTemplate.findUnique({ where: { id: templateId } }),
    prisma.contractCost.findMany({
      where: { contract: { employeeId } },
    }),
  ]);

  if (!employee || !template) {
    throw new Error("Missing employee or template");
  }

  const costTotal = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);

  const mergeData: Record<string, string | number> = {
    "employee.name": `${employee.firstName} ${employee.lastName}`,
    "employee.department": employee.department?.name ?? "",
    "employee.position": employee.position?.title ?? "",
    "contract.startDate": format(employee.startDate, "yyyy-MM-dd"),
    "contract.endDate": employee.endDate ? format(employee.endDate, "yyyy-MM-dd") : "",
    "contract.type": ContractType.FULL_TIME,
    "cost.total": costTotal.toFixed(2),
    "cost.currency": costs[0]?.currency ?? "USD",
    ...extra,
  };

  const generated = mergeContractTemplate(template.content, mergeData);

  await prisma.contractGenerationLog.create({
    data: {
      templateId,
      employeeId,
      createdById,
      params: extra,
      output: generated,
    },
  });

  return { content: generated, mergeData, template, employee };
}

export async function createOrUpdateContract(input: {
  employeeId: string;
  templateId?: string;
  startDate: Date;
  endDate?: Date | null;
  status?: ContractStatus;
  type?: ContractType;
  generatedContent?: string;
  version?: number;
}) {
  return prisma.contract.upsert({
    where: {
      id: `${input.employeeId}-${input.templateId ?? "contract"}`,
    },
    update: {
      templateId: input.templateId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status ?? ContractStatus.DRAFT,
      type: input.type ?? ContractType.FULL_TIME,
      generatedContent: input.generatedContent,
      version: input.version ?? 1,
    },
    create: {
      id: `${input.employeeId}-${input.templateId ?? "contract"}`,
      employeeId: input.employeeId,
      templateId: input.templateId,
      startDate: input.startDate,
      endDate: input.endDate ?? undefined,
      status: input.status ?? ContractStatus.DRAFT,
      type: input.type ?? ContractType.FULL_TIME,
      generatedContent: input.generatedContent,
      version: input.version ?? 1,
    },
  });
}

export async function exportContractPdf(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { employee: true },
  });
  if (!contract) throw new Error("Contract not found");
  const html = contract.generatedContent ?? "Contract content not available";
  const title = `Contract for ${contract.employee.firstName} ${contract.employee.lastName}`;
  return buildPdfFromHtml(title, html);
}
