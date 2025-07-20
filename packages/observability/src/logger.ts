import pino from 'pino';
export const logger = pino({
  level     : process.env.LOG_LEVEL ?? 'info',
  timestamp : pino.stdTimeFunctions.isoTime,
  formatters: { bindings: b => ({ pid: b.pid, host: b.hostname }) },
  transport : process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});
