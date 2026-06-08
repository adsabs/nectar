import { describe, expect, test } from 'vitest';

import { useNivoDarkTheme } from './useNivoDarkTheme';

describe('useNivoDarkTheme', () => {
  test('returns the expected dark theme shape', () => {
    const theme = useNivoDarkTheme();

    expect(theme).toEqual(
      expect.objectContaining({
        background: expect.any(String),
        text: expect.objectContaining({
          fill: expect.any(String),
        }),
        axis: expect.objectContaining({
          ticks: expect.objectContaining({
            text: expect.objectContaining({
              fill: expect.any(String),
            }),
          }),
        }),
        tooltip: expect.objectContaining({
          container: expect.objectContaining({
            background: expect.any(String),
          }),
        }),
        legends: expect.objectContaining({
          text: expect.objectContaining({
            fill: expect.any(String),
          }),
        }),
      }),
    );
  });

  test('returns the expected dark theme colors', () => {
    const theme = useNivoDarkTheme();

    expect(theme.background).toBe('#1C1C1C');
    expect(theme.text.fill).toBe('#000000');
    expect(theme.axis.ticks.text.fill).toBe('#ffffff');
    expect(theme.tooltip.container.background).toBe('#000000');
    expect(theme.legends.text.fill).toBe('#ffffff');
  });
});
