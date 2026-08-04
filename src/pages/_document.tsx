import { ColorModeScript } from '@chakra-ui/react';
import { theme } from '@/theme';
import { COLOR_MODE_NO_FLASH_CSS } from '@/color-mode-no-flash';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { ReactElement } from 'react';

class MyDocument extends Document {
  render(): ReactElement {
    return (
      <Html lang="en">
        <Head>
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
