import { prisma } from "@/lib/db/client";
import { ContractsClient } from "@/components/contracts/ContractsClient";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function ContractsPage() {
  await requirePagePermission("contracts:view");
  const [templates, employees, contracts] = await Promise.all([
    prisma.contractTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.employee.findMany({ orderBy: { firstName: "asc" } }),
    prisma.contract.findMany({ include: { employee: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <ContractsClient
      templates={templates}
      employees={employees}
      contracts={contracts}
    />
  );
}
