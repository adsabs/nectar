import { Container } from '@chakra-ui/react';
import Head from 'next/head';
import { FC } from 'react';

interface ILibrariesLayoutProps {
  title: string;
}

export const LibrariesLayout: FC<ILibrariesLayoutProps> = ({ children, title }) => {
  return (
    <Container maxW="container.lg">
      <Head>
        <title>{title}</title>
      </Head>
      {children}
    </Container>
  );
};
