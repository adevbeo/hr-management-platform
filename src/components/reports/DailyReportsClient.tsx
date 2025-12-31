'use client';

import { useMemo, useState } from "react";

type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department?: { name: string | null } | null;
  position?: { title: string | null } | null;
};

type UserLite = { id: string; name: string | null; email: string | null };

type WorkReport = {
  id: string;
  employeeId: string;
  date: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string | null;
  reviewer?: UserLite | null;
  submitter?: UserLite | null;
  employee: Employee;
};

type Props = {
  initialReports: WorkReport[];
  employees: Employee[];
  canReview: boolean;
  canSubmit: boolean;
  defaultEmployeeId?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return startOfMonth(d);
}

export function DailyReportsClient({
  initialReports,
  employees,
  canReview,
  canSubmit,
  defaultEmployeeId,
}: Props) {
  const [reports, setReports] = useState<WorkReport[]>(initialReports);
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId ?? "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());

  const reportsByDate = useMemo(() => {
    const map: Record<string, WorkReport[]> = {};
    reports.forEach((r) => {
      const key = formatISODate(new Date(r.date));
      map[key] = map[key] ? [...map[key], r] : [r];
    });
    return map;
  }, [reports]);

  const filteredReports = useMemo(
    () => reports.filter((r) => formatISODate(new Date(r.date)) === selectedDate),
    [reports, selectedDate],
  );

  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(
    currentMonth,
  );
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys()].map(
    (v) => (v === null ? null : (v as number) + 1),
  );

  const statusStyles: Record<WorkReport["status"], string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-700",
  };

  const submitReport = async () => {
    if (!form.employeeId) {
      setError("Khong tim thay nhan su tuong ung tai khoan nay.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/work-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: form.content }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit report");
      }
      const data = (await res.json()) as WorkReport;
      setReports((prev) => [data, ...prev]);
      setForm((f) => ({ ...f, content: "" }));
      const reportDate = formatISODate(new Date(data.date));
      setSelectedDate(reportDate);
      setCurrentMonth(startOfMonth(new Date(data.date)));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewReport = async (id: string, status: WorkReport["status"]) => {
    setReviewingId(id);
    setError(null);
    try {
      let reviewNote: string | undefined;
      if (status === "REJECTED") {
        reviewNote = window.prompt("Ly do tu choi?", "") ?? undefined;
      }

      const res = await fetch(`/api/work-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update report");
      }
      const data = (await res.json()) as WorkReport;
      setReports((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Báo cáo công việc hàng ngày</h2>
          <p className="text-sm text-slate-500">
            Gửi báo cáo ngày hiện tại, xem theo dạng lịch để theo dõi tình trạng.
          </p>
        </div>
      </div>

      {canSubmit && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Gửi báo cáo hôm nay</h3>
          <label className="mt-3 flex flex-col text-sm font-medium text-slate-700">
            <textarea
              className="mt-1 min-h-[120px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Mô tả công việc hoàn thành, mục tiêu, khó khăn, kiến nghị..."
            />
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={submitReport}
              disabled={submitting || !form.content || !form.employeeId}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Dang gui..." : "Gửi báo cáo hôm nay"}
            </button>
            <button
              onClick={() => setForm({ employeeId: defaultEmployeeId ?? "", content: "" })}
              className="text-sm text-slate- 600 hover:underline"
            >
              Xóa nội dung
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Lich bao cao</h3>
            <p className="text-xs text-slate-500">Chon ngay de xem chi tiet bao cao.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Thang truoc
            </button>
            <div className="text-sm font-semibold text-slate-900 min-w-[140px] text-center">{monthLabel}</div>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Thang sau
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            const iso = day
              ? formatISODate(new Date(year, month, day))
              : `blank-${idx}`;
            const dayReports = day ? reportsByDate[iso] ?? [] : [];
            const hasToday = iso === todayIso();
            const selected = iso === selectedDate;

            return day ? (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`flex h-20 flex-col items-start rounded-md border px-2 py-1 text-left text-xs transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-sm font-semibold ${selected ? "text-white" : "text-slate-900"}`}>
                    {day}
                  </span>
                  {hasToday && (
                    <span
                      className={`rounded-full px-2 py-[2px] text-[10px] font-semibold ${
                        selected ? "bg-white/20 text-white" : "bg-slate-900 text-white"
                      }`}
                    >
                      Hom nay
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayReports.map((r) => (
                    <span
                      key={r.id}
                      className={`rounded-full px-1.5 py-[2px] text-[10px] font-semibold ${
                        selected ? "bg-white/20 text-white" : statusStyles[r.status]
                      }`}
                    >
                      {r.status === "PENDING"
                        ? "Cho duyet"
                        : r.status === "APPROVED"
                          ? "Da duyet"
                          : "Tu choi"}
                    </span>
                  ))}
                </div>
              </button>
            ) : (
              <div key={iso} className="h-20 rounded-md bg-transparent" />
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Bao cao ngay {new Date(selectedDate).toLocaleDateString()}
          </h3>
          {filteredReports.length > 0 && (
            <span className="text-xs text-slate-500">{filteredReports.length} bao cao</span>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {filteredReports.map((report) => (
            <div key={report.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {report.employee.firstName} {report.employee.lastName} ({report.employee.employeeCode})
                  </span>
                  {report.employee.department?.name && (
                    <span className="text-slate-500">{report.employee.department.name}</span>
                  )}
                  {report.employee.position?.title && (
                    <span className="text-slate-500">{report.employee.position.title}</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[report.status]}`}
                  >
                    {report.status}
                  </span>
                </div>
                {canReview && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reviewReport(report.id, "APPROVED")}
                      disabled={reviewingId === report.id}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Duyet
                    </button>
                    <button
                      onClick={() => reviewReport(report.id, "REJECTED")}
                      disabled={reviewingId === report.id}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Tu choi
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{report.content}</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {report.submitter && (
                  <span>Gui boi: {report.submitter.name ?? report.submitter.email ?? "N/A"}</span>
                )}
                {report.reviewer && (
                  <span>Duyet boi: {report.reviewer.name ?? report.reviewer.email ?? "N/A"}</span>
                )}
                {report.reviewNote && <span>Ghi chu: {report.reviewNote}</span>}
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && <p className="text-sm text-slate-500">Chua co bao cao.</p>}
        </div>
      </div>
    </div>
  );
}
