import { Flex, Heading, LayoutProps, Stack, Text } from '@chakra-ui/react';

import Head from 'next/head';
import { FC, ReactNode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { SuspendedAlert } from '@/components/Feedbacks/SuspendedAlert';
import { BRAND_NAME_FULL } from '@/config';
import { SettingsSideNav } from '@/components/Settings';

interface ISettingsLayoutProps {
  title: string;
  maxW?: LayoutProps['maxW'];
  headerAction?: ReactNode;
}

export const SettingsLayout: FC<ISettingsLayoutProps> = ({ children, title, headerAction }) => {
  return (
    <Stack direction={{ base: 'column', lg: 'row' }} spacing={6} my={{ base: 2, lg: 10 }}>
      <Head>
        <title>{`${BRAND_NAME_FULL} ${title}`}</title>
      </Head>
      <SettingsSideNav />
      <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
        <Flex justify="space-between" align="center">
          <Heading as="h2" fontSize="2xl" variant="abstract" id="settings-section-title">
            <Text as="span" fontSize="xl" id="title">
              {title}
            </Text>
          </Heading>
          {headerAction}
        </Flex>
        <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
      </Stack>
    </Stack>
  );
};

const Fallback = (props: FallbackProps) => <SuspendedAlert label="Error loading settings" {...props} />;
