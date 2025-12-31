'use client';

import { useState } from "react";

type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

type FormState = {
  name: string;
  code: string;
  description: string;
};

export function DepartmentsClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [form, setForm] = useState<FormState>({ name: "", code: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "", code: "", description: "" });
    setEditingId(null);
  };

  const saveDepartment = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, description: form.description || undefined };
      const res = await fetch(
        editingId ? `/api/departments/${editingId}` : "/api/departments",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save department");
      }

      const data = (await res.json()) as Department;
      if (editingId) {
        setDepartments((prev) => prev.map((d) => (d.id === data.id ? data : d)));
      } else {
        setDepartments((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (id: string) => {
    if (!confirm("Xoa phong ban nay?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete department");
      }
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Phong ban</h2>
            <p className="text-sm text-slate-500">Them, sua, xoa phong ban</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveDepartment}
              disabled={loading || !form.name || !form.code}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? "Cap nhat" : "Them phong ban"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Lam moi
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Ten
            <input
              className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Ma code
            <input
              className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-1">
            Mo ta
            <input
              className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Danh sach phong ban</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Ten</th>
                <th className="px-2 py-2">Ma</th>
                <th className="px-2 py-2">Mo ta</th>
                <th className="px-2 py-2 text-right">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-2 py-2 font-medium text-slate-900">{dept.name}</td>
                  <td className="px-2 py-2 font-mono text-slate-700">{dept.code}</td>
                  <td className="px-2 py-2 text-slate-700">{dept.description ?? "-"}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditingId(dept.id);
                        setForm({
                          name: dept.name,
                          code: dept.code,
                          description: dept.description ?? "",
                        });
                      }}
                      className="mr-3 text-xs font-semibold text-slate-700 hover:underline"
                    >
                      Sua
                    </button>
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xoa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
