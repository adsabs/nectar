import { Container, Box, Stack, VStack, Heading, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { FC } from 'react';

interface IFeedbackLayoutProps {
  title: string;
}

export const FeedbackLayout: FC<IFeedbackLayoutProps> = ({ children, title }) => {
  return (
    <Container maxW="container.md" my={{ base: 2, lg: 10 }}>
      <Head>
        <title>{title}</title>
      </Head>
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
