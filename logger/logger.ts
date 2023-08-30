import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  browser: {},
  level: 'debug',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});
