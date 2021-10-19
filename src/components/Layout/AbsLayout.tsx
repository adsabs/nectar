import { IDocsEntity } from '@api';
import { AbstractSideNav } from '@components';
import Head from 'next/head';
import React, { FC, ReactChild } from 'react';

interface IAbsLayoutProps {
  children?: ReactChild;
  doc: IDocsEntity;
  hasGraphics: boolean;
  hasMetrics: boolean;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, hasGraphics, hasMetrics }) => {
  return (
    <>
      <section className="abstract-page-container">
        <Head>
          <title>{doc ? doc.title : ''}</title>
        </Head>
        <AbstractSideNav doc={doc} hasGraphics={hasGraphics} hasMetrics={hasMetrics} />
        {children}
      </section>
    </>
  );
};
