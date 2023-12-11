import { Heading, Stack, Text } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

interface IAbsRefLayoutProps {
  titleDescription: string;
  docTitle: string | string[];
}

export const AbstractRefLayout = ({ children, titleDescription, docTitle }: PropsWithChildren<IAbsRefLayoutProps>) => {
  return (
    <Stack direction="column" as="section" aria-labelledby="title" gap={1} width="full">
      <Heading as="h2" id="title" fontSize="2xl">
        <Text as="span" fontSize="xl">
          {titleDescription}
        </Text>{' '}
        <Text>{docTitle}</Text>
      </Heading>
      {children}
    </Stack>
  );
};
