import { Locator } from '@playwright/test';
import { SearchPage } from './search.page';

export class SearchResultsPage extends SearchPage {
  get resultRows(): Locator {
    return this.page.getByTestId('result-item');
  }

  get resultTitles(): Locator {
    return this.page.getByTestId('result-title');
  }

  get nextPageButton(): Locator {
    return this.page.getByTestId('pagination-next');
  }

  get prevPageButton(): Locator {
    return this.page.getByTestId('pagination-prev');
  }

  get paginationString(): Locator {
    return this.page.getByTestId('pagination-label');
  }

  get pageSizeSelector(): Locator {
    return this.page.getByTestId('pagination-numperpage');
  }

  get facetRootItems(): Locator {
    return this.page.getByTestId('search-facet-root-item');
  }

  get facetSectionToggles(): Locator {
    return this.page.getByRole('button', { name: /Toggle On|Toggle Off/ });
  }

  facetSectionToggle(label: string): Locator {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page.getByRole('button', { name: new RegExp(`Toggle (On|Off) ${escapedLabel}`) });
  }

  async gotoQuery(query: string): Promise<void> {
    await this.gotoWithParams(`?q=${encodeURIComponent(query)}`);
  }

  async setSearchScenario(scenario: string): Promise<void> {
    await this.mergeExtraHeaders({ 'x-test-search-scenario': scenario });
  }
}
