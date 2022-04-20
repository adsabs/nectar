import { examples } from '@components/SearchExamples/examples';
import { themes } from '@components/NavBar/models';

const baseUrl = Cypress.config().baseUrl;

const themeOptions = Object.values(themes);

describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
  });
  describe('Search bar behaviors', () => {
    it('searchbar clear should clear input', () => {
      cy.getByTestId('searchbar-clear').should('not.exist');
      cy.get('@input').type('star');
      cy.get('@input').should('have.value', 'star');
      cy.getByTestId('searchbar-clear').click();
      cy.get('@input').should('have.value', '');
      cy.getByTestId('searchbar-clear').should('not.exist');
    });

    it('searchbar should not search empty term', () => {
      cy.get('@input').type(`{enter}`);
      cy.url().should('eq', baseUrl + '/');
      cy.getByTestId('searchbar-submit').click();
      cy.url().should('eq', baseUrl + '/');
    });

    it('search using enter should go to results page', () => {
      cy.get('@input').type(`star{enter}`);
      cy.url().should('eq', baseUrl + '/search?q=star&sort=date+desc&p=1');
    });

    it('search using submit button should go to results page', () => {
      cy.get('@input').type('star');
      cy.getByTestId('searchbar-submit').click();
      cy.url().should('eq', baseUrl + '/search?q=star&sort=date+desc&p=1');
    });
  });

  describe('Themes selection', () => {
    it('All themes should be available in the dropdown', () => {
      cy.get('#theme-selector').click();
      themeOptions.forEach((themeOption, i) => {
        cy.get(`#react-select-theme-selector-option-${i}`).should('have.text', themeOption.label);
      });
    });

    it('Switch theme should change to corresponding examples', () => {
      themeOptions.forEach((themeOption, i) => {
        const themeId = themeOption.id;
        cy.get('#theme-selector').click();
        cy.get(`#react-select-theme-selector-option-${i}`).click();
        cy.get('.search-example').eq(0).should('have.text', examples[themeId].left[0].text);
        cy.get('.search-example').eq(1).should('have.text', examples[themeId].left[1].text);
        cy.get('.search-example').eq(2).should('have.text', examples[themeId].left[2].text);
        cy.get('.search-example').eq(3).should('have.text', examples[themeId].left[3].text);
        cy.get('.search-example').eq(4).should('have.text', examples[themeId].left[4].text);
        cy.get('.search-example').eq(5).should('have.text', examples[themeId].left[5].text);
        cy.get('.search-example').eq(6).should('have.text', examples[themeId].left[6].text);
        cy.get('.search-example').eq(7).should('have.text', examples[themeId].right[0].text);
        cy.get('.search-example').eq(8).should('have.text', examples[themeId].right[1].text);
        cy.get('.search-example').eq(9).should('have.text', examples[themeId].right[2].text);
        cy.get('.search-example').eq(10).should('have.text', examples[themeId].right[3].text);
        cy.get('.search-example').eq(11).should('have.text', examples[themeId].right[4].text);
        cy.get('.search-example').eq(12).should('have.text', examples[themeId].right[5].text);
      });
    });

    it('Classic and paper forms should only be available on Astrophysics', () => {
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-0').click();
      cy.get('a[href="/classic-form"]').should('not.exist');
      cy.get('a[href="/paper-form"]').should('not.exist');
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-1').click();
      cy.get('a[href="/classic-form"]').should('exist');
      cy.get('a[href="/paper-form"]').should('exist');
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-2').click();
      cy.get('a[href="/classic-form"]').should('not.exist');
      cy.get('a[href="/paper-form"]').should('not.exist');
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-3').click();
      cy.get('a[href="/classic-form"]').should('not.exist');
      cy.get('a[href="/paper-form"]').should('not.exist');
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-4').click();
      cy.get('a[href="/classic-form"]').should('not.exist');
      cy.get('a[href="/paper-form"]').should('not.exist');
      cy.get('#theme-selector').click();
      cy.get('#react-select-theme-selector-option-5').click();
      cy.get('a[href="/classic-form"]').should('not.exist');
      cy.get('a[href="/paper-form"]').should('not.exist');
    });
  });

  describe('Search examples', () => {
    it('there should be 13 examples', () => {
      cy.get('.search-example').should('have.length', 13);
    });

    it('click on search examples should apply to search input', () => {
      themeOptions.forEach((themeOption, i) => {
        const themeId = themeOption.id;
        cy.get('#theme-selector').click();
        cy.get(`#react-select-theme-selector-option-${i}`).click();
        cy.get('.search-example').eq(0).click();
        cy.get('@input').should('have.value', examples[themeId].left[0].text);
        cy.get('.search-example').eq(7).click();
        cy.get('@input').should('have.value', `${examples[themeId].left[0].text} ${examples[themeId].right[0].text}`);
        cy.getByTestId('searchbar-clear').click();
      });
    });
  });
});
