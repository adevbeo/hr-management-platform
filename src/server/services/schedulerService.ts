import cron, { ScheduledTask } from "node-cron";
import { ReportFormat } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { exportReport, runReport } from "./reportService";
import { sendMail } from "@/lib/mailer";
import { logger } from "@/lib/logger";

const jobs = new Map<string, ScheduledTask>();
let initialized = false;

export async function startScheduler() {
  if (initialized) return;
  initialized = true;
  try {
    const schedules = await prisma.scheduledReport.findMany({ where: { active: true } });
    schedules.forEach(registerScheduledReport);
  } catch (error) {
    initialized = false;
    logger.error({ error }, "Failed to initialize scheduler");
  }
}

export function registerScheduledReport(schedule: {
  id: string;
  scheduleCron: string;
}) {
  jobs.get(schedule.id)?.stop();

  const task = cron.schedule(schedule.scheduleCron, () => {
    executeScheduledReport(schedule.id).catch((error) =>
      logger.error({ error }, "Scheduled report failed"),
    );
  });

  jobs.set(schedule.id, task);
}

export async function executeScheduledReport(scheduleId: string) {
  const schedule = await prisma.scheduledReport.findUnique({
    where: { id: scheduleId },
    include: { template: true },
  });
  if (!schedule || !schedule.template) return;

  const params = (schedule.filters as Record<string, any>) ?? {};
  const { run } = await runReport(schedule.templateId, params);

  const { buffer, contentType } = await exportReport(run.id, ReportFormat.PDF);
  const recipients = Array.isArray(schedule.recipients)
    ? (schedule.recipients as string[])
    : [];

  if (recipients.length) {
    await sendMail({
      to: recipients,
      subject: `Scheduled report: ${schedule.template.name}`,
      text: "Find the scheduled report attached.",
      attachments: [
        {
          filename: `${schedule.template.name}.pdf`,
          content: buffer,
        },
      ],
    });
  }

  await prisma.scheduledReport.update({
    where: { id: schedule.id },
    data: { lastRunAt: new Date() },
  });

  logger.info({ scheduleId }, "Scheduled report executed");
}
