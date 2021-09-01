import { Session } from 'express-session';
import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';
import { IncomingMessage } from 'node:http';
import { isNil } from 'ramda';
import React from 'react';

type NectarInitialProps = DocumentInitialProps & {
  session: Session;
};

class MyDocument extends Document<NectarInitialProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<NectarInitialProps> {
    const initialProps = (await Document.getInitialProps(ctx)) as NectarInitialProps;

    if (!isNil(ctx.req)) {
      initialProps.session = (ctx.req as IncomingMessage & { session: Session }).session;
    }

    return initialProps;
  }

  render(): React.ReactElement {
    const { session } = this.props;

    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          <script
            type="application/json"
            id="__session__"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(session) }}
          ></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
