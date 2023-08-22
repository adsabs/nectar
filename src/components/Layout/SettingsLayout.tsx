import { Container, Heading, LayoutProps, Stack, Text } from '@chakra-ui/react';
import { SettingsSideNav } from '@components';
import Head from 'next/head';
import { FC } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { SuspendedAlert } from '@components/Feedbacks/SuspendedAlert';

interface ISettingsLayoutProps {
  title: string;
  maxW?: LayoutProps['maxW'];
}

export const SettingsLayout: FC<ISettingsLayoutProps> = ({ children, title, maxW = 'container.sm' }) => {
  return (
    <Container maxW="container.lg">
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={6} my={{ base: 2, lg: 10 }}>
        <Head>
          <title>{title}</title>
        </Head>
        <SettingsSideNav />
        <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
          <Heading as="h2" fontSize="2xl" variant="abstract" id="settings-section-title">
            <Text as="span" fontSize="xl">
              {title}
            </Text>
          </Heading>
          <Container pt={5} maxW={maxW}>
            <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
          </Container>
        </Stack>
      </Stack>
    </Container>
  );
};

const Fallback = (props: FallbackProps) => <SuspendedAlert label="Error loading settings" {...props} />;
