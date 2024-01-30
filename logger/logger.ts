import pino, { Logger } from 'pino';

export const logger: Logger = pino({
  browser: {
    asObject: true,
  },
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});