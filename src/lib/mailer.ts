import nodemailer from "nodemailer";
import { env } from "./config";
import { logger } from "./logger";

export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      ...options,
    });
  } catch (error) {
    logger.error({ error }, "Failed to send email");
    throw error;
  }
}
