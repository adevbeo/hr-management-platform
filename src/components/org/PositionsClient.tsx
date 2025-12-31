'use client';

import { useState } from "react";

type Department = { id: string; name: string; code: string };
type Position = {
  id: string;
  title: string;
  description: string | null;
  department: Department | null;
};

type FormState = {
  title: string;
  description: string;
  departmentId: string;
};

export function PositionsClient({
  initialPositions,
  departments,
}: {
  initialPositions: Position[];
  departments: Department[];
}) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [form, setForm] = useState<FormState>({ title: "", description: "", departmentId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ title: "", description: "", departmentId: "" });
    setEditingId(null);
  };

  const savePosition = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        departmentId: form.departmentId || null,
      };
      const res = await fetch(
        editingId ? `/api/positions/${editingId}` : "/api/positions",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save position");
      }

      const data = (await res.json()) as Position;
      if (editingId) {
        setPositions((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        setPositions((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const deletePosition = async (id: string) => {
    if (!confirm("Xoa chuc danh nay?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete position");
      }
      setPositions((prev) => prev.filter((p) => p.id !== id));
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
            <h2 className="text-base font-semibold text-slate-900">Chuc danh</h2>
            <p className="text-sm text-slate-500">Quan ly danh sach chuc danh</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={savePosition}
              disabled={loading || !form.title}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? "Cap nhat" : "Them chuc danh"}
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
            Ten chuc danh
            <input
              className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Phong ban
            <select
              className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
            >
              <option value="">Khong chon</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
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
        <h3 className="text-sm font-semibold text-slate-900">Danh sach chuc danh</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Ten</th>
                <th className="px-2 py-2">Phong ban</th>
                <th className="px-2 py-2">Mo ta</th>
                <th className="px-2 py-2 text-right">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos) => (
                <tr key={pos.id}>
                  <td className="px-2 py-2 font-medium text-slate-900">{pos.title}</td>
                  <td className="px-2 py-2 text-slate-700">
                    {pos.department ? `${pos.department.name} (${pos.department.code})` : "-"}
                  </td>
                  <td className="px-2 py-2 text-slate-700">{pos.description ?? "-"}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditingId(pos.id);
                        setForm({
                          title: pos.title,
                          description: pos.description ?? "",
                          departmentId: pos.department?.id ?? "",
                        });
                      }}
                      className="mr-3 text-xs font-semibold text-slate-700 hover:underline"
                    >
                      Sua
                    </button>
                    <button
                      onClick={() => deletePosition(pos.id)}
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
