/* eslint-disable @typescript-eslint/no-var-requires */

const startMsw = async () => {
  if (typeof window === 'undefined') {
    const server = await import('./server').then((m) => m.server);
    server.listen();
  } else {
    const worker = await import('./browser').then((m) => m.worker);
    await worker.start();
  }
};

export default startMsw();
