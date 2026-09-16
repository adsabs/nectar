import { ColorModeScript } from '@chakra-ui/react';
import { theme } from '@/theme';
import { COLOR_MODE_NO_FLASH_CSS } from '@/color-mode-no-flash';
import { getGtmSnippet, getGtmUserId } from '@/gtm-snippet';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { ReactElement } from 'react';
import { IUserData } from '@/api/user/types';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

class MyDocument extends Document {
  render(): ReactElement {
    // Seeding the id here rather than from the client hook is what lets the
    // Google tag read it on its first fire, so page_view carries the User-ID.
    const user = this.props.__NEXT_DATA__?.props?.pageProps?.dehydratedAppState?.user as IUserData | undefined;

    return (
      <Html lang="en">
        <Head>
          {gtmId ? <script dangerouslySetInnerHTML={{ __html: getGtmSnippet(gtmId, getGtmUserId(user)) }} /> : null}
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
