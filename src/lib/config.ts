import { z } from "zod";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).optional(),
    DB_HOST: z.string().optional(),
    DB_PORT: z.string().optional(),
    DB_USERNAME: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_DATABASE: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().optional(),
    SMTP_HOST: z.string().optional().transform((v) => v ?? "localhost"),
    SMTP_PORT: z.coerce.number().optional().transform((v) => v ?? 1025),
    SMTP_USER: z.string().optional().transform((v) => v ?? "user"),
    SMTP_PASS: z.string().optional().transform((v) => v ?? "pass"),
    MAIL_FROM: z.string().optional().transform((v) => v ?? "no-reply@example.com"),
    REDIS_URL: z.string().optional(),
  })
  .refine(
    (val) =>
      Boolean(val.DATABASE_URL) ||
      (val.DB_HOST && val.DB_USERNAME && val.DB_PASSWORD && val.DB_DATABASE),
    {
      message:
        "Provide DATABASE_URL or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE to build it.",
    },
  )
  .superRefine((_, ctx) => {
    const enforceSmtp = process.env.ENFORCE_SMTP_ENV === "true";
    if (isBuildPhase || !enforceSmtp) return;
    const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"] as const;
    required.forEach((key) => {
      if (!process.env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Missing required environment variable ${key}`,
        });
      }
    });
  });

function buildDatabaseUrl(parsed: z.infer<typeof envSchema>) {
  if (parsed.DATABASE_URL) return parsed.DATABASE_URL;
  if (!parsed.DB_HOST || !parsed.DB_USERNAME || !parsed.DB_PASSWORD || !parsed.DB_DATABASE) {
    throw new Error("Database connection is not configured");
  }

  const username = encodeURIComponent(parsed.DB_USERNAME);
  const password = encodeURIComponent(parsed.DB_PASSWORD);
  const host = parsed.DB_HOST;
  const port = parsed.DB_PORT || "3306";
  const db = parsed.DB_DATABASE;
  return `mysql://${username}:${password}@${host}:${port}/${db}`;
}

const parsed = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM,
  REDIS_URL: process.env.REDIS_URL,
});

export const env = {
  ...parsed,
  DATABASE_URL: buildDatabaseUrl(parsed),
};

export const appConfig = {
  aiTimeoutMs: 15000,
  aiMaxRetries: 2,
};
