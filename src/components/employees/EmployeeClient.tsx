'use client';

import { useState, useRef } from "react";
import type { Department, Employee, Position } from "@prisma/client";

type Props = {
  initialEmployees: (Employee & { department: Department | null; position: Position | null })[];
  departments: Department[];
  positions: (Position & { department: Department | null })[];
};

export function EmployeeClient({ initialEmployees, departments, positions }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    departmentId: "",
    positionId: "",
    startDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || new Date().toISOString(),
          departmentId: form.departmentId || undefined,
          positionId: form.positionId || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create employee");
      }
      const employee = (await res.json()) as Employee;
      setEmployees([{ ...employee, department: null, position: null } as any, ...employees]);
      setForm({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        departmentId: "",
        positionId: "",
        startDate: "",
      });
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (rows: Record<string, string>[]) => {
    setImporting(true);
    setImportError(null);
    setImportProgress({ done: 0, total: rows.length });
    try {
      const created: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const payload = {
          employeeCode: r.employeeCode || r.code || "",
          firstName: r.firstName || r.first || "",
          lastName: r.lastName || r.last || "",
          email: r.email || "",
          departmentId: r.departmentId || undefined,
          positionId: r.positionId || undefined,
          startDate: r.startDate || undefined,
        };
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Row ${i + 1} failed: ${text}`);
        }
        const emp = await res.json();
        created.push({ ...emp, department: null, position: null } as any);
        setImportProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      setEmployees((prev) => [...created.map((c) => ({ ...c })), ...prev]);
    } catch (e: any) {
      setImportError(e?.message ?? "Import error");
    } finally {
      setImporting(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportError(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 1) {
      setImportError("File kosong hoặc không có header");
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length === 0) continue;
      const obj: Record<string, string> = {};
      for (let j = 0; j < header.length; j++) {
        const key = header[j].trim().replace(/\s+/g, "");
        obj[key] = (cols[j] || "").trim();
      }
      rows.push(obj);
    }
    if (rows.length === 0) {
      setImportError("Không có hàng dữ liệu");
      return;
    }
    await handleBulkCreate(rows);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa nhân sự này?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees(employees.filter((emp) => emp.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Danh sách nhân sự</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Tạo mới
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="text/csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Mã</th>
                <th className="px-2 py-2">Họ tên</th>
                <th className="px-2 py-2">Phòng ban</th>
                <th className="px-2 py-2">Chức danh</th>
                <th className="px-2 py-2">Trạng thái</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-2 py-2 font-mono text-slate-700">{emp.employeeCode}</td>
                  <td className="px-2 py-2">{emp.firstName} {emp.lastName}</td>
                  <td className="px-2 py-2">{emp.department?.name ?? "-"}</td>
                  <td className="px-2 py-2">{emp.position?.title ?? "-"}</td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thêm nhân sự mới</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Mã nhân sự" value={form.employeeCode} onChange={(employeeCode) => setForm({ ...form, employeeCode })} />
              <Input label="Tên" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />
              <Input label="Họ" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} />
              <Input label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
              <Select
                label="Phòng ban"
                value={form.departmentId}
                onChange={(departmentId) => setForm({ ...form, departmentId })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
              <Select
                label="Chức danh"
                value={form.positionId}
                onChange={(positionId) => setForm({ ...form, positionId })}
                options={positions.map((p) => ({
                  value: p.id,
                  label: `${p.title}${p.department ? ` (${p.department.code})` : ""}`,
                }))}
              />
              <Input
                label="Ngày vào làm"
                type="date"
                value={form.startDate}
                onChange={(startDate) => setForm({ ...form, startDate })}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => { await handleCreate(); setShowCreateModal(false); }}
                disabled={loading}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Đang lưu..." : "Tạo mới"}
              </button>
              <button onClick={() => setShowCreateModal(false)} className="text-sm text-slate-600">Hủy</button>
            </div>
          </div>
        </Modal>
      )}

      {importing && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm">Importing {importProgress.done} / {importProgress.total}</p>
        </div>
      )}
      {importError && <p className="text-sm text-red-600">{importError}</p>}
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
        onChange={(e) => onChange(e.target.value)}
        type={type}
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

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
