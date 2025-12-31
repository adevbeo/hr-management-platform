## HR Management Platform (Next.js + Prisma + TiDB/MySQL)

Full-stack HR platform with dynamic RBAC, contracts, reporting, scheduler, and Gemini-powered automations.

### Stack
- Next.js App Router (TypeScript), Tailwind
- Auth: NextAuth (Credentials + Prisma adapter)
- DB/ORM: Prisma + MySQL/TiDB
- Scheduler: node-cron (BullMQ-ready), Redis optional
- Email: Nodemailer (SMTP)
- Exports: pdf-lib, exceljs
- AI: Gemini REST (`GEMINI_API_KEY`)

### Quickstart
1) Install dependencies
   ```bash
   npm install
   ```
2) Configure env  
   Copy `.env.example` to `.env` and fill values:
   - `DATABASE_URL` (TiDB/MySQL; include SSL params if TiDB requires)
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
   - `GEMINI_API_KEY` (required for AI endpoints)
   - `REDIS_URL` (optional, future BullMQ worker)
3) Database
   ```bash
   npm run db:push   # create schema
   npm run db:seed   # seed users/roles/templates/data
   ```
4) Run
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

Seed logins:
- admin@demo.com / Admin123! (ADMIN)
- hr@demo.com / Hr123! (HR)
- manager@demo.com / Manager123! (MANAGER; department scoped)

### Features
- Core HR: employees, departments, positions, history logging
- Dynamic RBAC: roles, permissions, assignments; nav + APIs are permission-gated
- Contracts: templates with merge fields, generation, cost tracking, PDF export
- Reports: JSON-defined templates, run + export to PDF/Excel
- Scheduler: node-cron executes scheduled reports and emails recipients
- AI (Gemini): contract drafting, report insights, workflow suggestions
- Audit: employee history and contract generation logs

### Scheduler / Worker
- MVP uses in-app `node-cron`; jobs are registered at server boot via `ensureScheduler()`.
- Production: run a dedicated worker that calls `startScheduler()` and connect to Redis/BullMQ if you offload jobs.

### Exports
- PDF via `pdf-lib` (text-first rendering from HTML content; no headless browser required).
- Excel via `exceljs`.

### Notes
- AI endpoints require `GEMINI_API_KEY`; without it they fail fast.
- For TiDB with TLS, pass the proper SSL options inside `DATABASE_URL`.
- Email requires working SMTP credentials; for dev you can point to a local mail catcher.
