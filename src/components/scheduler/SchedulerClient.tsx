'use client';

import { useState } from "react";
import type { ReportTemplate, ScheduledReport } from "@prisma/client";

type Props = {
  templates: ReportTemplate[];
  schedules: (ScheduledReport & { template: ReportTemplate | null })[];
};

export function SchedulerClient({ templates, schedules }: Props) {
  const [form, setForm] = useState({
    templateId: "",
    scheduleCron: "0 9 * * 1",
    recipients: "hr@example.com",
    filters: "{}",
  });
  const [records, setRecords] = useState(schedules);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!form.templateId || !form.scheduleCron) {
      setError("Can chon mau va nhap cron");
      return;
    }
    try {
      const res = await fetch("/api/scheduler/scheduled-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: form.templateId,
          scheduleCron: form.scheduleCron,
          recipients: form.recipients.split(",").map((r) => r.trim()),
          filters: JSON.parse(form.filters || "{}"),
          active: true,
        }),
      });
      if (!res.ok) throw new Error("Tao lich gui that bai");
      const json = await res.json();
      setRecords([json, ...records]);
    } catch (e: any) {
      setError(e?.message ?? "Loi khong xac dinh");
    }
  };

  const triggerRun = async (id: string) => {
    await fetch("/api/scheduler/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId: id }),
    });
    alert("Da chay lich gui bao cao");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Tao lich gui bao cao</h2>
          <p className="text-xs text-slate-500">Nhap cron, chon mau va danh sach email nhan</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select
            label="Mau bao cao"
            value={form.templateId}
            onChange={(templateId) => setForm({ ...form, templateId })}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Input
            label="Cron (vi du 0 9 * * 1)"
            value={form.scheduleCron}
            onChange={(scheduleCron) => setForm({ ...form, scheduleCron })}
          />
          <Input
            label="Nguoi nhan (cach nhau dau phay)"
            value={form.recipients}
            onChange={(recipients) => setForm({ ...form, recipients })}
          />
          <Input
            label="Bo loc (JSON)"
            value={form.filters}
            onChange={(filters) => setForm({ ...form, filters })}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleCreate}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Luu lich
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Danh sach lich gui</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Mau</th>
                <th className="px-2 py-2">Cron</th>
                <th className="px-2 py-2">Nguoi nhan</th>
                <th className="px-2 py-2">Lan chay gan nhat</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td className="px-2 py-2">{rec.template?.name ?? rec.templateId}</td>
                  <td className="px-2 py-2 font-mono text-slate-700">{rec.scheduleCron}</td>
                  <td className="px-2 py-2">{Array.isArray(rec.recipients) ? rec.recipients.join(", ") : ""}</td>
                  <td className="px-2 py-2">{rec.lastRunAt ? new Date(rec.lastRunAt).toLocaleString() : "--"}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => triggerRun(rec.id)}
                      className="text-xs font-semibold text-slate-900 underline"
                    >
                      Chay ngay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="py-4 text-sm text-slate-500">Chua co lich gui nao.</p>}
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-sm font-medium text-slate-700">
      {label}
      <select
        className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Chon</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

