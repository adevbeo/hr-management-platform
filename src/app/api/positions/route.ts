import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const positions = await prisma.position.findMany({
    orderBy: { title: "asc" },
    include: { department: true },
  });
  return NextResponse.json(positions);
}
