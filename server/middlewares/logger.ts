import pino from 'pino';

const config: pino.LoggerOptions = {
  name: 'nectar',
  level: 'debug',
};

export default pino(config);
