'use client';

import { useState } from "react";
import type { Permission, Role, User, RolePermission } from "@prisma/client";

type RoleWithPermissions = Role & { permissions: (RolePermission & { permission: Permission })[] };

type Props = {
  roles: RoleWithPermissions[];
  permissions: Permission[];
  users: User[];
};

export function RbacClient({ roles, permissions, users }: Props) {
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; permissionIds: string[] }>({
    name: "",
    description: "",
    permissionIds: [],
  });
  const [assignment, setAssignment] = useState<{ userId: string; roleId: string }>({
    userId: "",
    roleId: "",
  });
  const [roleList, setRoleList] = useState(roles);
  const [message, setMessage] = useState<string | null>(null);

  const togglePermission = (id: string) => {
    setRoleForm((prev) => {
      const exists = prev.permissionIds.includes(id);
      return {
        ...prev,
        permissionIds: exists ? prev.permissionIds.filter((p) => p !== id) : [...prev.permissionIds, id],
      };
    });
  };

  const saveRole = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissionIds.map((id) => ({ permissionId: id })),
      }),
    });
    if (!res.ok) {
      setMessage("Failed to save role");
      return;
    }
    const role = (await res.json()) as Role;
    setRoleList([{ ...role, permissions: [] } as any, ...roleList]);
    setMessage("Role saved");
  };

  const assignRole = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/assign-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment),
    });
    if (!res.ok) {
      setMessage("Failed to assign role");
      return;
    }
    setMessage("Role assigned");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Create / Update Role</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Name" value={roleForm.name} onChange={(name) => setRoleForm({ ...roleForm, name })} />
          <Input
            label="Description"
            value={roleForm.description}
            onChange={(description) => setRoleForm({ ...roleForm, description })}
          />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {permissions.map((perm) => (
            <label key={perm.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={roleForm.permissionIds.includes(perm.id)}
                onChange={() => togglePermission(perm.id)}
              />
              <span>{perm.module}:{perm.action}</span>
            </label>
          ))}
        </div>
        <button
          onClick={saveRole}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Save role
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Assign Role</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select
            label="User"
            value={assignment.userId}
            onChange={(userId) => setAssignment({ ...assignment, userId })}
            options={users.map((u) => ({ value: u.id, label: u.email ?? u.id }))}
          />
          <Select
            label="Role"
            value={assignment.roleId}
            onChange={(roleId) => setAssignment({ ...assignment, roleId })}
            options={roleList.map((r) => ({ value: r.id, label: r.name }))}
          />
        </div>
        <button
          onClick={assignRole}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Assign
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Roles</h2>
        <div className="mt-2 space-y-2">
          {roleList.map((role) => (
            <div key={role.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{role.name}</div>
                  <div className="text-xs text-slate-500">{role.description}</div>
                </div>
                <div className="text-xs text-slate-500">{role.permissions.length} permissions</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {role.permissions.map((rp) => (
                  <span key={rp.id} className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
                    {rp.permission.module}:{rp.permission.action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {message && <p className="text-sm text-slate-700">{message}</p>}
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
