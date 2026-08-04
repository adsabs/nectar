import { describe, expect, it } from 'vitest';
import { COLOR_MODE_NO_FLASH_CSS } from './color-mode-no-flash';
import { theme } from './theme';

/**
 * Extract the declaration block whose selector list mentions the given
 * color-mode token (e.g. "dark" -> the rule keyed to the dark color-mode
 * class/attribute that ColorModeScript sets synchronously before hydration).
 */
const blockForMode = (css: string, mode: 'dark' | 'light'): string => {
  const match = css.match(new RegExp(`([^{}]*${mode}[^{}]*)\\{([^}]*)\\}`, 'i'));
  return match ? match[2] : '';
};

describe('COLOR_MODE_NO_FLASH_CSS', () => {
  it('paints the dark theme background for the dark color-mode selector before hydration', () => {
    const darkBlock = blockForMode(COLOR_MODE_NO_FLASH_CSS, 'dark');
    const darkBg = theme.colors.gray['800'];

    // The dark rule must set the theme dark background — this is what prevents
    // the white flash on first paint before emotion injects global styles.
    const bgMatch = darkBlock.match(/background-color:\s*([^;]+);/i);
    expect(bgMatch?.[1]?.trim()).toBe(darkBg);

    // Regression guard: the dark background must never resolve to white. Scope
    // this to the background declaration so a `color: white` text rule is fine.
    expect(bgMatch?.[1] ?? '').not.toMatch(/#fff\b|#ffffff\b|\bwhite\b/i);
  });
});
