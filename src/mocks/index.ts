const bypassStrings = ['sentry.io', '_next', '__next', 'site.webmanifest', 'favicon'];

const startMsw = async () => {
  if (typeof window === 'undefined') {
    const server = await import('./server').then((m) => m.server);
    server.listen({
      onUnhandledRequest(request, print) {
        if (bypassStrings.some((bypassString) => request.url.hostname.includes(bypassString))) {
          return;
        }

        print.warning();
      },
    });
  } else {
    const worker = await import('./browser').then((m) => m.worker);
    await worker.start();
  }
};

export default startMsw();
