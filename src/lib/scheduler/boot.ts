import { startScheduler } from "@/server/services/schedulerService";

let booted = false;

export function ensureScheduler() {
  if (booted) return;
  booted = true;
  void startScheduler();
}
