/* eslint-disable @typescript-eslint/no-var-requires */
import { SetupWorkerApi } from 'msw';
import { SetupServerApi } from 'msw/lib/types/node';

(function () {
  if (typeof window === 'undefined') {
    const { server } = require('./server') as { server: SetupServerApi };
    server.listen();
  } else {
    const { worker } = require('./browser') as { worker: SetupWorkerApi };
    void worker.start();
  }
})();
