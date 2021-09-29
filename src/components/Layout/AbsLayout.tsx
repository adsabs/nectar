import { IDocsEntity } from '@api';
import { AbstractSideNav } from '@components';
import Head from 'next/head';
import React, { FC, ReactChild } from 'react';

interface IAbsLayoutProps {
  children?: ReactChild;
  doc: IDocsEntity;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc }) => {
  return (
    <>
      <section className="abstract-page-container">
        <Head>
          <title>{doc.title}</title>
        </Head>
        <AbstractSideNav doc={doc} />
        {children}
      </section>
    </>
  );
};
