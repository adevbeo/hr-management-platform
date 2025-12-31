import { prisma } from "@/lib/db/client";
import { requirePagePermission } from "@/lib/auth/guard";
import { PositionsClient } from "@/components/org/PositionsClient";

export default async function PositionsPage() {
  await requirePagePermission("positions:view");
  const [positions, departments] = await Promise.all([
    prisma.position.findMany({ orderBy: { title: "asc" }, include: { department: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <PositionsClient initialPositions={positions} departments={departments} />;
}
