'use client';

import { useState } from "react";
import type { ContractTemplate, Employee, ReportRun } from "@prisma/client";

type Props = {
  templates: ContractTemplate[];
  employees: Employee[];
  reportRuns: ReportRun[];
};

export function AutomationsClient({ templates, employees, reportRuns }: Props) {
  const [contractAI, setContractAI] = useState({
    templateId: "",
    employeeId: "",
    extra: "{}",
    output: "",
  });
  const [insights, setInsights] = useState<{ reportRunId: string; output?: string }>({
    reportRunId: reportRuns[0]?.id ?? "",
  });
  const [workflow, setWorkflow] = useState({ goal: "", context: "", output: "" });
  const [error, setError] = useState<string | null>(null);

  const generateContract = async () => {
    setError(null);
    if (!contractAI.templateId || !contractAI.employeeId) {
      setError("Select a template and employee");
      return;
    }
    try {
      const res = await fetch("/api/ai/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: contractAI.templateId,
          employeeId: contractAI.employeeId,
          extraParams: JSON.parse(contractAI.extra || "{}"),
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const json = await res.json();
      setContractAI((prev) => ({ ...prev, output: json.output }));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  };

  const generateInsights = async () => {
    setError(null);
    if (!insights.reportRunId) {
      setError("Choose a report run first");
      return;
    }
    try {
      const res = await fetch("/api/ai/generate-report-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportRunId: insights.reportRunId }),
      });
      if (!res.ok) throw new Error("Failed to generate insights");
      const json = await res.json();
      setInsights((prev) => ({ ...prev, output: json.output }));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  };

  const buildWorkflow = async () => {
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: workflow.goal, context: workflow.context }),
      });
      if (!res.ok) throw new Error("Failed to build workflow");
      const json = await res.json();
      setWorkflow((prev) => ({ ...prev, output: json.output }));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">AI Contract Draft</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Select
            label="Template"
            value={contractAI.templateId}
            onChange={(templateId) => setContractAI({ ...contractAI, templateId })}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Select
            label="Employee"
            value={contractAI.employeeId}
            onChange={(employeeId) => setContractAI({ ...contractAI, employeeId })}
            options={employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
          />
          <Input
            label="Extra params (JSON)"
            value={contractAI.extra}
            onChange={(extra) => setContractAI({ ...contractAI, extra })}
          />
        </div>
        <button
          onClick={generateContract}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Generate with Gemini
        </button>
        {contractAI.output && (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800">
            <div dangerouslySetInnerHTML={{ __html: contractAI.output }} />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Report Insights</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select
            label="Report run"
            value={insights.reportRunId}
            onChange={(reportRunId) => setInsights({ ...insights, reportRunId })}
            options={reportRuns.map((r) => ({ value: r.id, label: `Run ${r.id.slice(0, 6)}` }))}
          />
          <div className="flex items-end">
            <button
              onClick={generateInsights}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Generate insights
            </button>
          </div>
        </div>
        {insights.output && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            {insights.output}
          </pre>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Workflow Suggestion</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Goal" value={workflow.goal} onChange={(goal) => setWorkflow({ ...workflow, goal })} />
          <Input
            label="Context"
            value={workflow.context}
            onChange={(context) => setWorkflow({ ...workflow, context })}
          />
        </div>
        <button
          onClick={buildWorkflow}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Suggest workflow
        </button>
        {workflow.output && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            {workflow.output}
          </pre>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
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
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
