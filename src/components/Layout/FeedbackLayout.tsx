import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { FC, PropsWithChildren, ReactNode, useEffect, useRef } from 'react';

interface IFeedbackLayoutProps {
  title: string;
  alert?: ReactNode;
}

export const FeedbackLayout: FC<PropsWithChildren<IFeedbackLayoutProps>> = ({ children, title, alert }) => {
  const alertRef = useRef<HTMLDivElement>();

  // scroll to alert does not work
  useEffect(() => {
    if (alert) {
      alertRef.current.scrollIntoView();
    }
  }, [alert]);

  return (
    <Container maxW="container.lg" my={{ base: 2, lg: 10 }} px={0}>
      <Head>
        <title>{`${title} - NASA Science Explorer`}</title>
      </Head>
      <Box ref={alertRef}>{!!alert && alert}</Box>
      <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
        <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
          <Text as="span" fontSize="xl">
            {title}
          </Text>
        </Heading>
        <Box>{children}</Box>
      </Stack>
    </Container>
  );
};
