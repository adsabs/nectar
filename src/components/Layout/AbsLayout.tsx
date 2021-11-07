import { IDocsEntity } from '@api';
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
    <>
      <section className="abstract-page-container">
        {!isBrowser() && (
          <Head>
            <title>{doc?.title ?? ''}</title>
            <Metatags doc={doc} />
          </Head>
        )}
        <AbstractSideNav doc={doc} />
        {children}
      </section>
    </>
  );
};
