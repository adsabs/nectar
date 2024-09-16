import { edgeLogger } from '@/logger';
import { NextRequest } from 'next/server';

const log = edgeLogger.child({}, { msgPrefix: '[decorateHeaders] ' });
export const decorateHeaders = (req: NextRequest) => {
  log.debug('Decorating headers');
  const { cspHeader, reportToHeader, nonce } = generateCSP();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('Report-To', reportToHeader);
  requestHeaders.set('X-Nonce', nonce);
  requestHeaders.set(
    !!process.env.CSP_REPORT_ONLY ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    cspHeader,
  );
  log.debug('Headers set');

  return requestHeaders;
};

const generateCSP = () => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = `
    default-src 'self' https://o1060269.ingest.sentry.io;
    script-src 'self' ${
      process.env.NODE_ENV === 'development' ? `'unsafe-eval'` : ''
    } https://www.googletagmanager.com https://www.youtube-nocookie.com;
    style-src 'self' ${process.env.NODE_ENV === 'development' ? `'unsafe-inline'` : ''};
    img-src 'self';
    font-src 'self';
    connect-src 'self' https://*.adsabs.harvard.edu https://o1060269.ingest.sentry.io;
    frame-src https://www.google.com https://www.recaptcha.net;
    frame-ancestors 'self';
    form-action 'self';
    base-uri 'self';
    manifest-src 'self';
    worker-src 'self';
    object-src 'none';
    require-trusted-types-for 'script';
    report-uri ${process.env.CSP_REPORT_URI}
    report-to csp-reporter;
  ` as const;

  const reportToHeader = {
    group: 'csp-reporter',
    max_age: 10886400,
    endpoints: [{ url: process.env.CSP_REPORT_URI }],
  };

  return {
    nonce,
    reportToHeader: JSON.stringify(reportToHeader),
    cspHeader: csp.replace(/\s{2,}/g, ' ').trim(),
  };
};
