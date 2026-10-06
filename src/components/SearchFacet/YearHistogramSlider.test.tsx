import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import { FACET_HISTOGRAM_HEIGHT, HistogramSliderLoader } from './YearHistogramSlider';

describe('HistogramSliderLoader', () => {
  test('reserves the loaded histogram height so facets below it do not shift', () => {
    const { container } = render(<HistogramSliderLoader />);

    const loader = [...container.querySelectorAll('div')].find(
      (el) => getComputedStyle(el).minHeight === `${FACET_HISTOGRAM_HEIGHT}px`,
    );
    expect(loader).toBeDefined();
  });
});
