import { IDocsEntity } from '@api';
import { Stack } from '@chakra-ui/layout';
import { AbstractSideNav } from '@components';
import { Metatags } from '@components/Metatags/Metatags';
import { isBrowser } from '@utils';
import Head from 'next/head';
import { FC } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc }) => {
  return (
    <Stack direction={{ base: 'column', lg: 'row' }} my={{ base: '6', lg: '16' }} spacing={6}>
      {!isBrowser() && (
        <Head>
          <title>{doc?.title ?? ''}</title>
          <Metatags doc={doc} />
        </Head>
      )}
      <AbstractSideNav doc={doc} />
      {children}
    </Stack>
  );
};
