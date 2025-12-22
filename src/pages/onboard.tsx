import { sessionConfig } from '@/config';
import { GetServerSideProps, NextPage } from 'next';
import { withIronSessionSsr } from 'iron-session/next';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/logger';

const OnboardPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = withIronSessionSsr(async (ctx) => {
  const referer = ctx.req.headers.referer ?? null;
  Sentry.captureMessage('onboard_redirect', {
    level: 'info',
    extra: { referer },
  });
  logger.info({ referer }, 'Onboard route hit, redirecting to home (legacy mode detected via referer)');

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}, sessionConfig);

export default OnboardPage;
