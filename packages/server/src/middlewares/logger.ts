import pino from 'pino';

const config: pino.LoggerOptions = {
  name: 'nectar',
  level: 'debug',
  prettyPrint: { colorize: true },
};

export default pino(config);
