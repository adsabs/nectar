import { describe, expect, test, vi } from 'vitest';
import { config } from '@fortawesome/fontawesome-svg-core';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/search', query: {}, asPath: '/search', push: vi.fn() }),
}));

describe('FontAwesome does not inject its stylesheet from JavaScript (criterion 4)', () => {
  test.each([
    ['ListActions', () => import('@/components/ResultList/ListActions')],
    ['abs graphics page', () => import('@/pages/abs/[id]/graphics')],
  ])('%s disables autoAddCss when loaded', async (_name, load) => {
    config.autoAddCss = true;

    const mod = await load();

    expect(mod, 'the module failed to load').toBeDefined();
    expect(config.autoAddCss).toBe(false);
  });
});
