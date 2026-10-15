import { themeColors } from './theme-tokens';

// Pre-hydration anti-flash rule: ColorModeScript sets these classes/attrs
// synchronously before paint, so this CSS (inlined in <Head>) paints the
// correct background/text color before emotion's global styles load.
// Values must track `styles.global` in ./theme.ts or they will drift.
export const COLOR_MODE_NO_FLASH_CSS = `
  html[data-theme='dark'], body.chakra-ui-dark {
    background-color: ${themeColors.gray['800']};
    color: white;
  }
  html[data-theme='light'], body.chakra-ui-light {
    background-color: white;
    color: ${themeColors.gray['700']};
  }
`;
