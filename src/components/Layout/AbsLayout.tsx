import { IDocsEntity } from '@api';
import { AbstractSideNav } from '@components';
import { Metatags } from '@components/Metatags/Metatags';
import Head from 'next/head';
import { FC } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc }) => {
  return (
    <>
      <section className="abstract-page-container">
        <Head>
          <title>{doc ? doc.title : ''}</title>
        </Head>
        <Metatags doc={doc} />
        <AbstractSideNav doc={doc} />
        {children}
      </section>
    </>
  );
};
