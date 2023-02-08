import { Stack, Heading, Text, Container, LayoutProps } from '@chakra-ui/react';
import { SettingsSideNav } from '@components';
import Head from 'next/head';
import { FC } from 'react';

interface ISettingsLayoutProps {
  title: string;
  maxW?: LayoutProps['maxW'];
}

export const SettingsLayout: FC<ISettingsLayoutProps> = ({ children, title, maxW = 'container.sm' }) => {
  return (
    <Stack direction={{ base: 'column', lg: 'row' }} spacing={6} my={{ base: 2, lg: 10 }}>
      <Head>
        <title>{title}</title>
      </Head>
      <SettingsSideNav />
      <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
        <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
          <Text as="span" fontSize="xl">
            {title}
          </Text>
        </Heading>
        <Container pt={5} maxW={maxW}>
          {children}
        </Container>
      </Stack>
    </Stack>
  );
};
