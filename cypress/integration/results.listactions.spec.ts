import { IADSApiSearchParams } from '@api';

const baseUrl = Cypress.config().baseUrl;

const search = (params: Partial<IADSApiSearchParams & { p: number }>) => {
  cy.visit('/search', {
    qs: params,
  });
};

describe('Result Page - list actions', () => {
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
      cy.url().should('eq', baseUrl + '/search?q=trending%28star%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('trending-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=trending%28docs%28012345690%29%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('reviews-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=reviews%28star%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('reviews-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=reviews%28docs%28012345690%29%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('useful-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=useful%28star%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('useful-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=useful%28docs%28012345690%29%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('similar-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=similar%28star%29&sort=score+desc&sort=bibcode+desc');

      search({ q: 'star' });
      cy.getByTestId('listactions-checkbox').find('input[type=checkbox]').check({ force: true });
      cy.getByTestId('explorer-menu-btn').click();
      cy.getByTestId('explorer-menu-items').should('be.visible');
      cy.getByTestId('similar-operator').trigger('mouseover').click();
      cy.url().should('eq', baseUrl + '/search?q=similar%28docs%28012345690%29%29&sort=score+desc&sort=bibcode+desc');
    });
  });

  describe('Highlights', () => {
    it('Highlights toggle show and hide highlights', () => {
      search({ q: 'star' });
    });
  });
});
