import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

function createPrismaClient() {
  if (isBuild) {
    // Avoid instantiating Prisma during the build step (e.g., on Vercel) to sidestep cached-client errors.
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("Prisma client is disabled during the build phase.");
      },
    });
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production" && !isBuild) {
  globalForPrisma.prisma = prisma;
}
