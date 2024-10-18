import pino, { Logger } from 'pino';

export const logger: Logger = pino({
  errorKey: 'error',
  browser: {
    asObject: true,
  },
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

// for use in edge functions (i.e. middleware)
export const edgeLogger: Logger = pino({
  browser: {
    // this is a workaround for the edge function environment, which does not support
    // some formatter pino uses under the hood
    write: (obj) => {
      try {
        console.log(JSON.stringify(obj));
      } catch (err) {
        if (err instanceof Error) {
          // without a `replacer` argument, stringify on Error results in `{}`
          console.log(JSON.stringify(err, ['name', 'message', 'stack']));
        } else {
          console.log(JSON.stringify({ message: 'Unknown error type' }));
        }
      }
    },
  },
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});
