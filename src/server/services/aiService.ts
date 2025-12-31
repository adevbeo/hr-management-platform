import { prisma } from "@/lib/db/client";
import { callGemini } from "@/lib/ai/gemini";
import { logger } from "@/lib/logger";

export async function generateContractWithAI(input: {
  templateId: string;
  employeeId: string;
  extraParams?: Record<string, any>;
}) {
  const template = await prisma.contractTemplate.findUnique({ where: { id: input.templateId } });
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    include: { department: true, position: true },
  });
  const costs = await prisma.contractCost.findMany({
    where: { contract: { employeeId: input.employeeId } },
  });

  if (!template || !employee) throw new Error("Missing template or employee");

  const basePrompt = `
  You are an HR assistant. Using the template content below, generate a finalized contract section that is concise and normalized.
  Template content:
  ${template.content}

  Employee:
  Name: ${employee.firstName} ${employee.lastName}
  Department: ${employee.department?.name ?? ""}
  Position: ${employee.position?.title ?? ""}

  Costs:
  ${costs.map((c) => `${c.costType}: ${c.amount} ${c.currency}`).join(", ")}

  Extra params: ${JSON.stringify(input.extraParams ?? {})}
  `;

  const output = await callGemini(basePrompt.trim());

  await prisma.contractGenerationLog.create({
    data: {
      templateId: template.id,
      employeeId: employee.id,
      params: input.extraParams,
      output,
    },
  });

  return { output };
}

export async function generateReportInsights(reportRunId: string) {
  const run = await prisma.reportRun.findUnique({ where: { id: reportRunId } });
  if (!run?.data) throw new Error("Report run not found");

  const prompt = `
  You are an HR analyst. Summarize the key KPIs, trends, and risk alerts from this report data.
  Return short bullet points.
  Data: ${JSON.stringify(run.data).slice(0, 8000)}
  `;

  const output = await callGemini(prompt.trim());

  await prisma.reportRun.update({
    where: { id: reportRunId },
    data: { insights: { summary: output } },
  });

  return { output };
}

export async function suggestWorkflow(goal: string, context?: string) {
  const prompt = `
  Build a JSON workflow with steps, conditions, and actions to achieve the goal: "${goal}".
  Context: ${context ?? "N/A"}
  Provide 3-5 steps with clear action names.
  `;

  try {
    const output = await callGemini(prompt.trim());
    return { output };
  } catch (error) {
    logger.error({ error }, "Failed to suggest workflow");
    throw error;
  }
}
