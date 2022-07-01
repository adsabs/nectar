import { IADSApiSearchParams } from '@api';

const baseUrl = Cypress.config().baseUrl;

const search = (params: Partial<IADSApiSearchParams & { p: number }>) => {
  cy.visit('/search', {
    qs: params,
  });
};

const updateAndSubmitForm = (value: string) => {
  cy.get('@input', { timeout: 10000 }).should('be.enabled').type(value);
  cy.get('form').submit();
  cy.get('@input', { timeout: 10000 }).should('be.enabled');
};

const assertQueryParam = (checks: Record<string, string>) => {
  cy.location().then((location) => {
    const params = new URLSearchParams(location.search);
    Object.keys(checks).forEach((key) => expect(checks[key]).eq(params.get(key), `checking query param (${key})`));
  });
};

describe('Result Page', () => {
  describe('URL synchronization', () => {
    it('searchbar shows correct search term', () => {
      search({ q: 'a' });
      cy.get('form').find('input[type="text"]').first().should('have.value', 'a');
    });

    it('submission updates url correctly', () => {
      search({ q: 'a' });
      cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
      cy.get('@input').should('have.value', 'a');

      updateAndSubmitForm(' b');
      assertQueryParam({ q: 'a b' });
      cy.get('@input').should('have.value', 'a b');

      updateAndSubmitForm(' c');
      assertQueryParam({ q: 'a b c' });
      cy.get('@input').should('have.value', 'a b c');
    });

    it('history updates url correctly', () => {
      search({ q: 'a' });

      // update search and submit two more times to create history entries
      cy.get('form').find('[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
      updateAndSubmitForm(' b');
      updateAndSubmitForm(' c');

      // assert the query param and the underlying input
      assertQueryParam({ q: 'a b c' });
      cy.get('@input').should('have.value', 'a b c');

      // pop history entry and assert input/param have changed
      cy.go('back');
      assertQueryParam({ q: 'a b' });
      cy.get('@input').should('have.value', 'a b');

      // pop again, and assert
      cy.go('back');
      assertQueryParam({ q: 'a' });
      cy.get('@input').should('have.value', 'a');
    });

    it('sort change causes new search and updates URL', () => {
      search({ q: 'star' });
      cy.getByTestId('sort').children().first().as('sort');

      cy.get('input[name="sort"]').should('have.value', 'date desc');
      assertQueryParam({ sort: 'date desc' });

      // update sort value and assert the URL param has been updated
      cy.get('@sort').click();
      cy.focused().type('{downArrow}{enter}');
      assertQueryParam({ sort: 'entry_date desc' });
      cy.get('input[name="sort"]').should('have.value', 'entry_date desc,date desc');

      // toggle the direction button and assert param
      cy.getByTestId('sort-direction-toggle').click();
      assertQueryParam({ sort: 'entry_date asc' });
      cy.get('input[name="sort"]').should('have.value', 'entry_date asc,date desc');
    });
  });

  describe('Pagination', () => {
    it('updates `p` param, results correct when changing pages', () => {
      search({ q: 'star', p: 1 });

      // check each index to confirm they are correct
      cy.getByTestId('results-index')
        .should('have.length', 10)
        .each((e, i) => expect(e.text()).eq(`${1 + i}`));

      // next
      assertQueryParam({ p: '1' });
      cy.getByTestId('pagination-next').click();
      assertQueryParam({ p: '2' });

      cy.getByTestId('results-index')
        .should('have.length', 10)
        .each((e, i) => expect(e.text()).eq(`${11 + i}`));

      // prev
      cy.getByTestId('pagination-prev').click();
      assertQueryParam({ p: '1' });

      // manual page selection
      cy.getByTestId('pagination-select-page').click();
      cy.focused().type('30{enter}{esc}');
      assertQueryParam({ p: '30' });

      cy.getByTestId('results-index')
        .should('have.length', 10)
        .each((e, i) => expect(e.text()).eq(`${291 + i}`));
    });

    it('correctly updates results when changing numPerPages', () => {
      search({ q: 'star', p: 1 });

      // 10
      cy.getByTestId('results-index').should('have.length', 10).last().should('have.text', '10');
      cy.getByTestId('pagination-numperpage').should('include.text', '10').click();
      cy.focused().type('{downArrow}{enter}');

      // 25
      cy.getByTestId('results-index').should('have.length', 25).last().should('have.text', '25');
      cy.getByTestId('pagination-numperpage').should('include.text', '25').click();
      cy.focused().type('{downArrow}{enter}');

      // 50
      cy.getByTestId('results-index').should('have.length', 50).last().should('have.text', '50');
      cy.getByTestId('pagination-numperpage').should('include.text', '50').click();
      cy.focused().type('{downArrow}{enter}');

      // 100
      cy.getByTestId('results-index').should('have.length', 100).last().should('have.text', '100');
      cy.getByTestId('pagination-numperpage').should('include.text', '100');
    });
  });

  describe('Results Selection', () => {
    it('selection works properly, and across pages', () => {
      search({ q: 'star' });

      cy.getByTestId('results-checkbox').find('input[type=checkbox]').as('results-checkbox');
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').as('selectall');

      const assertNoSelection = () => {
        cy.get('@selectall').should('not.be.checked');
        cy.getByTestId('listactions-selected').should('not.exist');
        cy.getByTestId('listactions-clearall').should('not.exist');
      };

      const assertRecordsSelected = (count: number) => {
        // should be indeterminate here, since only one is selected
        cy.getByTestId('listactions-checkbox').find('[data-indeterminate]').should('exist');
        cy.getByTestId('listactions-selected').should('have.text', `${count} Selected`);
        cy.getByTestId('listactions-clearall').should('exist');
      };

      // only select 1 to begin with
      cy.get('@results-checkbox').first().check({ force: true }).should('be.checked');
      assertRecordsSelected(1);

      // select none, so we can assert the opposite
      cy.get('@results-checkbox').first().uncheck({ force: true }).should('not.be.checked');
      assertNoSelection();

      // select all records and check that we full check the select all box
      cy.get('@results-checkbox').check({ force: true });
      cy.getByTestId('listactions-checkbox').find('[data-checked]');
      cy.getByTestId('listactions-selected').should('have.text', '10 Selected');

      cy.get('@results-checkbox').should('be.checked').should('have.length', 10);

      // clear all, and assert they are in fact cleared
      cy.getByTestId('listactions-clearall').should('exist').click();
      assertNoSelection();

      // selections should be cleared by new search
      cy.get('@results-checkbox').first().should('not.be.checked').check({ force: true });
      cy.getByTestId('searchbar-input').focus().type('test');
      cy.get('form').submit();
      assertNoSelection();

      // select the first one again, go to next page, and select more
      // this should assert that selections persist across pages
      cy.get('@results-checkbox').first().should('not.be.checked').check({ force: true });
      cy.getByTestId('pagination-next').click();
      cy.getByTestId('results-index').first().should('have.text', '11');
      cy.get('@results-checkbox').first().should('not.be.checked').check({ force: true });
      cy.getByTestId('pagination-next').click();
      cy.getByTestId('results-index').first().should('have.text', '21');
      cy.get('@results-checkbox').first().should('not.be.checked').check({ force: true });
      assertRecordsSelected(3);
    });
  });

  describe('Operators', () => {
    it('Operators link to proper search', () => {
      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('trending-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=trending(star)-(star)&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('trending-operator').trigger('mouseover').click();
      cy.url().should(
        'eq',
        baseUrl + '/search?q=trending(docs(012345690))-(docs(012345690))&sort=score+desc%2Cbibcode+desc&p=1',
      );

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('reviews-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=reviews(star)&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('reviews-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=reviews(docs(012345690))&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('useful-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=useful(star)&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('useful-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=useful(docs(012345690))&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('similar-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=similar(star)&sort=score+desc%2Cbibcode+desc&p=1');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('similar-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=similar(docs(012345690))&sort=score+desc%2Cbibcode+desc&p=1');
    });
  });
});
