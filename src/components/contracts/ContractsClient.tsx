'use client';

import { useState } from "react";
import type { Contract, ContractTemplate, Employee } from "@prisma/client";

type Props = {
  templates: ContractTemplate[];
  employees: Employee[];
  contracts: (Contract & { employee: Employee })[];
};

export function ContractsClient({ templates, employees, contracts }: Props) {
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "FULL_TIME",
    content: "<h1>Hợp đồng</h1>",
    mergeFields: `{"employee":["name","department"],"contract":["startDate"]}`,
  });
  const [generation, setGeneration] = useState<{
    employeeId: string;
    templateId: string;
    extra: string;
    result?: string;
    contractId?: string;
  }>({
    employeeId: "",
    templateId: "",
    extra: "{}",
  });
  const [templatesState, setTemplatesState] = useState(templates);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleCreateTemplate = async () => {
    const res = await fetch("/api/contracts/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...templateForm,
        mergeFields: JSON.parse(templateForm.mergeFields || "{}"),
      }),
    });
    if (!res.ok) {
      alert("Lưu mẫu hợp đồng thất bại");
      return;
    }
    const tmpl = (await res.json()) as ContractTemplate;
    setTemplatesState([tmpl, ...templatesState]);
    setTemplateForm({ name: "", type: "FULL_TIME", content: "<h1>Hợp đồng</h1>", mergeFields: "{}" });
  };

  const handleGenerate = async () => {
    setGenerationError(null);
    if (!generation.employeeId || !generation.templateId) {
      setGenerationError("Chọn nhân sự và mẫu hợp đồng trước");
      return;
    }
    try {
      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: generation.employeeId,
          templateId: generation.templateId,
          extraParams: JSON.parse(generation.extra || "{}"),
        }),
      });
      if (!res.ok) throw new Error("Sinh hợp đồng thất bại");
      const json = await res.json();
      setGeneration((prev) => ({ ...prev, result: json.content, contractId: json.contractId }));
    } catch (error: any) {
      setGenerationError(error?.message ?? "Không sinh được hợp đồng");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Tạo mẫu hợp đồng</h2>
          <p className="text-xs text-slate-500">Điền tên mẫu, loại, nội dung và trường merge (JSON)</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Tên mẫu" value={templateForm.name} onChange={(name) => setTemplateForm({ ...templateForm, name })} />
          <Input label="Loại hợp đồng" value={templateForm.type} onChange={(type) => setTemplateForm({ ...templateForm, type })} />
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-slate-700">Nội dung (HTML/Markdown)</label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-200 p-3 text-sm focus:border-slate-500 focus:outline-none"
            rows={4}
            value={templateForm.content}
            onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-slate-700">Trường merge (JSON)</label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-200 p-3 text-sm focus:border-slate-500 focus:outline-none"
            rows={3}
            value={templateForm.mergeFields}
            onChange={(e) => setTemplateForm({ ...templateForm, mergeFields: e.target.value })}
          />
        </div>
        <button
          onClick={handleCreateTemplate}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Lưu mẫu
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Sinh hợp đồng</h2>
          <p className="text-xs text-slate-500">Chọn nhân sự, mẫu và tham số bổ sung (nếu có)</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Select
            label="Nhân sự"
            value={generation.employeeId}
            onChange={(employeeId) => setGeneration({ ...generation, employeeId })}
            options={employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
          />
          <Select
            label="Mẫu hợp đồng"
            value={generation.templateId}
            onChange={(templateId) => setGeneration({ ...generation, templateId })}
            options={templatesState.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Input
            label="Tham số thêm (JSON)"
            value={generation.extra}
            onChange={(extra) => setGeneration({ ...generation, extra })}
          />
        </div>
        {generationError && <p className="mt-2 text-sm text-red-600">{generationError}</p>}
        <button
          onClick={handleGenerate}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Sinh nội dung
        </button>
        {generation.result && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Nội dung đã sinh</h3>
              {generation.contractId && (
                <a
                  href={`/api/contracts/${generation.contractId}/export`}
                  className="text-sm font-semibold text-slate-900 underline"
                >
                  Xuất PDF
                </a>
              )}
            </div>
            <div
              className="mt-2 space-y-2 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: generation.result }}
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Danh sách hợp đồng</h2>
          <span className="text-sm text-slate-500">{contracts.length} hợp đồng</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Nhân sự</th>
                <th className="px-2 py-2">Loại</th>
                <th className="px-2 py-2">Trạng thái</th>
                <th className="px-2 py-2">Phiên bản</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td className="px-2 py-2">{c.employee.firstName} {c.employee.lastName}</td>
                  <td className="px-2 py-2">{c.type}</td>
                  <td className="px-2 py-2">{c.status}</td>
                  <td className="px-2 py-2">{c.version}</td>
                  <td className="px-2 py-2 text-right">
                    <a
                      className="text-xs font-semibold text-slate-900 underline"
                      href={`/api/contracts/${c.id}/export`}
                    >
                      Xuất PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        value={value}
        type={type}
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
