let booted = false;
const isVercel = process.env.VERCEL === "1";
const isProdBuild = process.env.NEXT_PHASE === "phase-production-build";

export function ensureScheduler() {
  if (booted || isVercel || isProdBuild) return;
  booted = true;
  void import("@/server/services/schedulerService")
    .then(({ startScheduler }) => startScheduler())
    .catch((error) => {
      // In build/edge environments we skip starting the scheduler; log and continue otherwise.
      console.error("Failed to start scheduler", error);
      booted = false;
    });
}
