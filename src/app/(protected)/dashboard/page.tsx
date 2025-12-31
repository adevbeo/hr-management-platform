import { prisma } from "@/lib/db/client";
import { requirePagePermission } from "@/lib/auth/guard";

export default async function DashboardPage() {
  await requirePagePermission("dashboard:view");
  const [employeeCount, contractCount, reportCount, scheduledCount] = await Promise.all([
    prisma.employee.count(),
    prisma.contract.count(),
    prisma.reportTemplate.count(),
    prisma.scheduledReport.count(),
  ]);

  const expiringContracts = await prisma.contract.findMany({
    where: {
      endDate: { not: null },
    },
    include: { employee: true },
    orderBy: { endDate: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Nhân sự" value={employeeCount} />
        <StatCard label="Hợp đồng" value={contractCount} />
        <StatCard label="Mẫu báo cáo" value={reportCount} />
        <StatCard label="Lịch gửi báo cáo" value={scheduledCount} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Hợp đồng sắp hết hạn</h2>
          <span className="text-sm text-slate-500">5 bản gần nhất</span>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {expiringContracts.length === 0 && (
            <p className="py-4 text-sm text-slate-500">Chưa có dữ liệu hợp đồng sắp hết hạn.</p>
          )}
          {expiringContracts.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-semibold text-slate-900">
                  {contract.employee.firstName} {contract.employee.lastName}
                </div>
                <div className="text-slate-500">
                  Hết hạn {contract.endDate?.toLocaleDateString()} • Trạng thái {contract.status}
                </div>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                {contract.type}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
