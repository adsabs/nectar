import pino from 'pino';

const config: pino.LoggerOptions = {
  name: 'nectar',
  level: process.env.LOG_LEVEL || 'error',
};

export const logger = pino(config);
