'use client';

import { ReactElement, ReactNode } from 'react';

import { Layout } from '@/components/Layout/Layout';
import { AppModeRouter, SettingsSync, UserSync } from '@/components/AppChrome';

interface AppChromeProps {
  children: ReactNode;
  initialSiteAlertMessage?: string | null;
  initialSiteAlertDismissedHash?: string;
}

export const AppChrome = ({
  children,
  initialSiteAlertMessage,
  initialSiteAlertDismissedHash,
}: AppChromeProps): ReactElement => {
  return (
    <>
      <AppModeRouter />
      <UserSync />
      <SettingsSync />
      <Layout
        initialSiteAlertMessage={initialSiteAlertMessage}
        initialSiteAlertDismissedHash={initialSiteAlertDismissedHash}
      >
        {children}
      </Layout>
    </>
  );
};
