import pino from 'pino';

/**
 * Runtime-level pretty printing only when we’re **not** in production.
 * You still get full-structured JSON in prod for ingestion by e.g. GCP Logging.
 */
const stream = process.env.NODE_ENV === 'production'
  ? undefined                                  // stdout JSON
  : pino.transport({ target: 'pino-pretty', options: { colorize: true } });

/** Root logger for the whole monorepo. */
export const logger = pino(
  {
    level : process.env.LOG_LEVEL ?? 'info',
    /** ISO timestamps are easier to search / sort */
    timestamp: pino.stdTimeFunctions.isoTime,
    base : undefined            // drop pid/hostname for cleaner output
  },
  stream
);

/** Convenience helper */
export const makeChild = (bindings: pino.Bindings) => logger.child(bindings);
