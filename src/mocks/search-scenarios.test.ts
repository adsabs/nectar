import { describe, expect, it } from 'vitest';
import { searchEmptyFixture, searchResultsFixture } from '@/mocks/search-scenarios';

describe('e2e stub search fixtures', () => {
  it('matches the committed results fixture served by the e2e stub', async () => {
    await expect(JSON.stringify(searchResultsFixture, null, 2)).toMatchFileSnapshot(
      '../../e2e-stub/fixtures/search-results.json',
    );
  });

  it('matches the committed empty fixture served by the e2e stub', async () => {
    await expect(JSON.stringify(searchEmptyFixture, null, 2)).toMatchFileSnapshot(
      '../../e2e-stub/fixtures/search-empty.json',
    );
  });
});
