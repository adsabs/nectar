import expressPinoLogger from 'express-pino-logger';

const config: expressPinoLogger.Options = {
  name: 'nectar',
  level: process.env.LOG_LEVEL || 'silent',
  prettyPrint: true,
};

export const logger = expressPinoLogger(config);
