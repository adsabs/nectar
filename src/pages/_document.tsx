import { ColorModeScript } from '@chakra-ui/react';
import { theme } from '@/theme';
import { COLOR_MODE_NO_FLASH_CSS } from '@/color-mode-no-flash';
import { getGtmSnippet } from '@/gtm-snippet';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { ReactElement } from 'react';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

class MyDocument extends Document {
  render(): ReactElement {
    return (
      <Html lang="en">
        <Head>
          {gtmId ? <script dangerouslySetInnerHTML={{ __html: getGtmSnippet(gtmId) }} /> : null}
          <style dangerouslySetInnerHTML={{ __html: COLOR_MODE_NO_FLASH_CSS }} />
        </Head>
        <body>
          <ColorModeScript type="cookie" initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
