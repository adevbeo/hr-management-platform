import pino from "pino";
import pretty from "pino-pretty";

const stream =
  process.env.NODE_ENV === "production"
    ? undefined
    : pretty({
        colorize: true,
        translateTime: "SYS:standard",
      });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  stream,
);
