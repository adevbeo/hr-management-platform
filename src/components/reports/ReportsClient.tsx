'use client';

import { useState } from "react";
import type { ReportTemplate } from "@prisma/client";

type Props = {
  templates: ReportTemplate[];
};

export function ReportsClient({ templates }: Props) {
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    jsonSchema: `{"type":"object","properties":{"from":{"type":"string","format":"date","title":"Từ ngày"},"to":{"type":"string","format":"date","title":"Đến ngày"}}}`,
    queryDefinition: `{"source":"employee","groupBy":["department"],"metrics":[{"field":"id","op":"count","alias":"headcount"}]}`,
    outputLayout: `{"type":"table","columns":["department","headcount"]}`,
  });
  const [templatesState, setTemplatesState] = useState(templates);
  const [runState, setRunState] = useState<{
    templateId: string;
    params: string;
    runId?: string;
    rows?: Record<string, any>[];
  }>({ templateId: "", params: "{}" });
  const [error, setError] = useState<string | null>(null);

  const handleCreateTemplate = async () => {
    try {
      const res = await fetch("/api/reports/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          description: templateForm.description,
          jsonSchema: JSON.parse(templateForm.jsonSchema || "{}"),
          queryDefinition: JSON.parse(templateForm.queryDefinition || "{}"),
          outputLayout: JSON.parse(templateForm.outputLayout || "{}"),
        }),
      });
      if (!res.ok) throw new Error("Lưu mẫu báo cáo thất bại");
      const template = (await res.json()) as ReportTemplate;
      setTemplatesState([template, ...templatesState]);
      setTemplateForm({
        name: "",
        description: "",
        jsonSchema: "{}",
        queryDefinition: "{}",
        outputLayout: "{}",
      });
    } catch (e: any) {
      setError(e?.message ?? "Lỗi không xác định");
    }
  };

  const handleRunReport = async () => {
    setError(null);
    if (!runState.templateId) {
      setError("Chọn mẫu báo cáo trước khi chạy");
      return;
    }
    try {
      const res = await fetch("/api/reports/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: runState.templateId,
          params: JSON.parse(runState.params || "{}"),
        }),
      });
      if (!res.ok) throw new Error("Chạy báo cáo thất bại");
      const json = await res.json();
      setRunState((prev) => ({ ...prev, runId: json.runId, rows: json.rows }));
    } catch (e: any) {
      setError(e?.message ?? "Lỗi không xác định");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Tạo mẫu báo cáo</h2>
          <p className="text-xs text-slate-500">Khai báo form (JSON Schema), truy vấn và layout đầu ra</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Tên mẫu" value={templateForm.name} onChange={(name) => setTemplateForm({ ...templateForm, name })} />
          <Input
            label="Mô tả"
            value={templateForm.description}
            onChange={(description) => setTemplateForm({ ...templateForm, description })}
          />
        </div>
        <Textarea
          label="JSON Schema (các trường nhập)"
          value={templateForm.jsonSchema}
          onChange={(jsonSchema) => setTemplateForm({ ...templateForm, jsonSchema })}
        />
        <Textarea
          label="Định nghĩa truy vấn"
          value={templateForm.queryDefinition}
          onChange={(queryDefinition) => setTemplateForm({ ...templateForm, queryDefinition })}
        />
        <Textarea
          label="Bố cục hiển thị"
          value={templateForm.outputLayout}
          onChange={(outputLayout) => setTemplateForm({ ...templateForm, outputLayout })}
        />
        <button
          onClick={handleCreateTemplate}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Lưu mẫu
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Chạy báo cáo</h2>
          <p className="text-xs text-slate-500">Chọn mẫu, nhập tham số JSON (lọc/gom nhóm)</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Select
            label="Mẫu"
            value={runState.templateId}
            onChange={(templateId) => setRunState({ ...runState, templateId })}
            options={templatesState.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Input
            label="Tham số (JSON)"
            value={runState.params}
            onChange={(params) => setRunState({ ...runState, params })}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleRunReport}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Chạy báo cáo
        </button>
        {runState.rows && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Kết quả</div>
              {runState.runId && (
                <div className="space-x-3 text-sm">
                  <a
                    className="font-semibold text-slate-900 underline"
                    href={`/api/reports/run/${runState.runId}/export?format=pdf`}
                  >
                    Xuất PDF
                  </a>
                  <a
                    className="font-semibold text-slate-900 underline"
                    href={`/api/reports/run/${runState.runId}/export?format=excel`}
                  >
                    Xuất Excel
                  </a>
                </div>
              )}
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    {runState.rows.length > 0 &&
                      Object.keys(runState.rows[0]).map((key) => (
                        <th key={key} className="px-2 py-2">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runState.rows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="px-2 py-2 text-slate-800">
                          {String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {runState.rows.length === 0 && (
                <p className="py-4 text-sm text-slate-500">Không có dữ liệu.</p>
              )}
            </div>
          </div>
        )}
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

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mt-3 flex flex-col text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="mt-1 w-full rounded-md border border-slate-200 p-3 text-sm focus:border-slate-500 focus:outline-none"
        rows={3}
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
        <option value="">Chọn</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
