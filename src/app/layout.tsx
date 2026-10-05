import { ColorModeScript } from '@chakra-ui/react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { ReactNode, Suspense } from 'react';
import 'nprogress/nprogress.css';
import '../styles/styles.css';
import '../styles/page-loader.css';
import 'shepherd.js/dist/css/shepherd.css';
import { BRAND_NAME_FULL } from '@/config';
import { themeConfig } from '@/theme-tokens';
import { COLOR_MODE_NO_FLASH_CSS } from '@/color-mode-no-flash';
import { getGtmSnippet, getGtmUserId } from '@/gtm-snippet';
import { Providers } from '@/providers';
import { resolveAppState } from '@/lib/resolveAppState';
import { fetchSiteWideMsgServer } from '@/lib/serverside/siteWideMsg';
import { ACCESS_TOKEN_HEADER, resolveServerSession } from '@/lib/serverside/session';
import { readDismissedMsgHash } from '@/utils/common/prefs-cookie';
import { EmotionCacheProvider } from './emotion-cache-provider';
import { AppRouterCompatProvider } from '@/lib/useRouterCompat';
import { AppChrome } from './app-chrome';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const FORWARDED_URL_HEADER = 'x-scix-forwarded-url';

export const metadata: Metadata = {
  title: BRAND_NAME_FULL,
  verification: {
    google: '2K2Hn5eIn2hgc1C9qiHwQQa46piB4bcYshJK5BzPMq0',
  },
  description:
    'Science Explorer is a digital library for astronomy, physics, and earth science, providing access to 20+ million records and advanced research tools.',
  keywords:
    'Science Explorer, Digital library, Astronomy research, Physics research, Earth science research, Bibliographic collections, Scientific publications, Refereed literature, Preprints, Research tools, Citation tracking, Interdisciplinary studies, Open science, FAIR principles, Data catalogs, Advanced discovery tools, Scientific knowledge access, Scholarly articles, Bibliometrics, Information science',
  robots: 'index, follow',
  icons: {
    icon: [
      {
        url: '/light/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/light/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/dark/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/dark/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
        media: '(prefers-color-scheme: light)',
      },
    ],
    apple: [
      { url: '/light/apple-touch-icon.png', sizes: '180x180', media: '(prefers-color-scheme: dark)' },
      { url: '/dark/apple-touch-icon.png', sizes: '180x180', media: '(prefers-color-scheme: light)' },
    ],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = cookieStore.toString();

  const forwardedUrl = headerStore.get(FORWARDED_URL_HEADER) ?? '';
  const url = new URL(forwardedUrl, 'http://localhost');

  const rawSession = cookieStore.get(process.env.SCIX_SESSION_COOKIE_NAME)?.value;
  const { session, token: accessToken } = await resolveServerSession(rawSession, headerStore.get(ACCESS_TOKEN_HEADER));

  const dismissedMsgHash = readDismissedMsgHash(cookieHeader);
  const siteWideMsg = await fetchSiteWideMsgServer(accessToken);

  const dehydratedAppState = resolveAppState({
    pathname: url.pathname,
    forceModeParam: url.searchParams.get('forceMode') ?? undefined,
    dParam: url.searchParams.get('d') ?? undefined,
    notifyParam: url.searchParams.get('notify') ?? undefined,
    cookieHeader,
    userData: session?.token,
  });

  return (
    <html lang="en">
      <head>
        {gtmId ? (
          <script dangerouslySetInnerHTML={{ __html: getGtmSnippet(gtmId, getGtmUserId(session?.token)) }} />
        ) : null}
        <style dangerouslySetInnerHTML={{ __html: COLOR_MODE_NO_FLASH_CSS }} />
      </head>
      <body>
        <ColorModeScript type="cookie" initialColorMode={themeConfig.initialColorMode} />
        <EmotionCacheProvider>
          <Providers
            cookies={cookieHeader}
            dehydratedAppState={dehydratedAppState}
            dehydratedState={{ mutations: [], queries: [] }}
          >
            <Suspense>
              <AppRouterCompatProvider>
                <AppChrome initialSiteAlertMessage={siteWideMsg} initialSiteAlertDismissedHash={dismissedMsgHash}>
                  {children}
                </AppChrome>
              </AppRouterCompatProvider>
            </Suspense>
          </Providers>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
