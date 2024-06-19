import './lib/instrument';

import { buildServer } from './app';
const isProduction = process.env.NODE_ENV === 'production';

buildServer({
  logger: {
    msgPrefix: '[server] ',
    level: isProduction ? 'info' : 'debug',
  },
  keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) || 300_000,
  pluginTimeout: 30000,
})
  .then((server) => {
    server.listen(
      {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 8000,
      },
      (err) => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
      },
    );
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
