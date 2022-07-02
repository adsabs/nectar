import { examples } from '@components/SearchExamples/examples';
import { themes } from '@components/NavBar/models';
import { quickfields, allSearchTerms } from '@components/SearchBar/models';
import { Theme } from '@types';

const baseUrl = Cypress.config().baseUrl;

const themeOptions = Object.values(themes);

describe('Landing Page', () => {
  it.only('searchbar behaviors', () => {
    cy.visit('/');
    cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');

    // search bar clear
    cy.getByTestId('searchbar-clear').should('not.exist');
    cy.get('@input').type('star');
    cy.get('@input').should('have.value', 'star');
    cy.getByTestId('searchbar-clear').click();
    cy.get('@input').should('have.value', '');
    cy.getByTestId('searchbar-clear').should('not.exist');

    // empty form should not be submitted
    cy.get('@input').type(`{enter}`);
    cy.url().should('eq', baseUrl + '/');
    cy.getByTestId('searchbar-submit').click();
    cy.url().should('eq', baseUrl + '/');

    // normal search using keyboard enter
    cy.get('@input').type(`star{enter}`);
    cy.url().should('eq', baseUrl + '/search?q=star&sort=date+desc%2Cbibcode+desc&p=1');

    // normal search using submit button
    cy.visit('/');
    cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
    cy.get('@input').type('star');
    cy.getByTestId('searchbar-submit').click();
    cy.url().should('eq', baseUrl + '/search?q=star&sort=date+desc%2Cbibcode+desc&p=1');

    // quick field
    cy.visit('/');
    cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
    cy.getByTestId('quickfield').should('have.length', quickfields.length);
    quickfields.forEach((quickfield, i) => {
      cy.getByTestId('quickfield').eq(i).contains(quickfield.title);
    });

    // click on quick fields
    cy.get('[data-value=\'author:""\']').click();
    cy.get('@input').should('have.value', 'author:""');
    cy.get('@input').type('Smith, John M.');
    cy.get('@input').should('have.value', 'author:"Smith, John M."');
    cy.get('[data-value=\'year:""\']').click();
    cy.get('@input').should('have.value', 'author:"Smith, John M." year:""');
    cy.get('@input').type('2000');
    cy.get('@input').should('have.value', 'author:"Smith, John M." year:"2000"');
    cy.getByTestId('searchbar-clear').click();

    // select from all search terms
    cy.getByTestId('allSearchTermsMenuItem').should('not.exist');
    cy.getByTestId('allSearchTermsMenuToggle').click();
    cy.getByTestId('allSearchTermsMenuItem').should('have.length.above', 0);
    cy.getByTestId('allSearchTermsMenuToggle').click();
    cy.getByTestId('allSearchTermsTooltip').should('not.exist');
    cy.getByTestId('allSearchTermsInput').type('count');
    cy.getByTestId('allSearchTermsMenuItem').should('have.length', 2);
    cy.getByTestId('allSearchTermsTooltip').should('be.visible');
    cy.getByTestId('allSearchTooltipTitle').should('have.text', 'author count');
    cy.getByTestId('allSearchTermsInput').type('{esc}i');
    cy.getByTestId('allSearchTooltipTitle').should('have.text', 'identifier');
    cy.getByTestId('allSearchTermsInput').type('n');
    cy.getByTestId('allSearchTooltipTitle').should('have.text', 'institution');
    cy.getByTestId('allSearchTermsInput').type('{esc}abs');
    cy.getByTestId('allSearchTermsMenuItem').should('have.length', 2);
    cy.getByTestId('allSearchTermsTooltip').should('be.visible');
    cy.getByTestId('allSearchTermsInput').type('{downArrow}{enter}');
    cy.get('@input').should('have.value', 'abstract:""');
    cy.get('@input').type('star');
    cy.getByTestId('allSearchTermsInput').type('inst{enter}');
    cy.get('@input').should('have.value', 'abstract:"star" inst:""');
    cy.getByTestId('allSearchTermsInput').type('aaaaaaa');
    cy.getByTestId('allSearchTermsMenuItem').should('have.length', 0);
    cy.getByTestId('allSearchTermsInput').type('{enter}');
    cy.getByTestId('allSearchTermsMenuItem').should('not.exist');
    cy.getByTestId('allSearchTermsInput').should('have.value', '');
    cy.get('@input').should('have.value', 'abstract:"star" inst:""');
  });

  it('Theme selector and corresponding search examples', () => {
    cy.visit('/');
    cy.get('form').find('input[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');

    // all themes are available
    themeOptions.forEach((themeOption, i) => {
      cy.get('#theme-selector').click();
      cy.get(`#react-select-theme-selector-option-${i}`).should('have.text', themeOption.label);
      cy.get(`#react-select-theme-selector-option-${i}`).click();
      cy.get('#theme-selector').contains(themeOption.label);

      if (themeOption.id === Theme.ASTROPHYSICS) {
        cy.get('a[href="/classic-form"]').should('exist');
        cy.get('a[href="/paper-form"]').should('exist');
      } else {
        cy.get('a[href="/classic-form"]').should('not.exist');
        cy.get('a[href="/paper-form"]').should('not.exist');
      }
    });

    // check search examples when theme switch
    themeOptions.forEach((themeOption, i) => {
      const themeId = themeOption.id;
      cy.get('#theme-selector').click();
      cy.get(`#react-select-theme-selector-option-${i}`).click();

      cy.get('.search-example').eq(0).should('have.text', examples[themeId].left[0].text);
      cy.get('.search-example').eq(0).click();
      cy.get('@input').should('have.value', examples[themeId].left[0].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(1).should('have.text', examples[themeId].left[1].text);
      cy.get('.search-example').eq(1).click();
      cy.get('@input').should('have.value', examples[themeId].left[1].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(2).should('have.text', examples[themeId].left[2].text);
      cy.get('.search-example').eq(2).click();
      cy.get('@input').should('have.value', examples[themeId].left[2].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(3).should('have.text', examples[themeId].left[3].text);
      cy.get('.search-example').eq(3).click();
      cy.get('@input').should('have.value', examples[themeId].left[3].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(4).should('have.text', examples[themeId].left[4].text);
      cy.get('.search-example').eq(4).click();
      cy.get('@input').should('have.value', examples[themeId].left[4].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(5).should('have.text', examples[themeId].left[5].text);
      cy.get('.search-example').eq(5).click();
      cy.get('@input').should('have.value', examples[themeId].left[5].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(6).should('have.text', examples[themeId].left[6].text);
      cy.get('.search-example').eq(6).click();
      cy.get('@input').should('have.value', examples[themeId].left[6].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(7).should('have.text', examples[themeId].right[0].text);
      cy.get('.search-example').eq(7).click();
      cy.get('@input').should('have.value', examples[themeId].right[0].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(8).should('have.text', examples[themeId].right[1].text);
      cy.get('.search-example').eq(8).click();
      cy.get('@input').should('have.value', examples[themeId].right[1].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(9).should('have.text', examples[themeId].right[2].text);
      cy.get('.search-example').eq(9).click();
      cy.get('@input').should('have.value', examples[themeId].right[2].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(10).should('have.text', examples[themeId].right[3].text);
      cy.get('.search-example').eq(10).click();
      cy.get('@input').should('have.value', examples[themeId].right[3].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(11).should('have.text', examples[themeId].right[4].text);
      cy.get('.search-example').eq(11).click();
      cy.get('@input').should('have.value', examples[themeId].right[4].text);
      cy.getByTestId('searchbar-clear').click();

      cy.get('.search-example').eq(12).should('have.text', examples[themeId].right[5].text);
      cy.get('.search-example').eq(12).click();
      cy.get('@input').should('have.value', examples[themeId].right[5].text);
      cy.getByTestId('searchbar-clear').click();

      // appending search terms
      cy.get('.search-example').eq(0).click();
      cy.get('.search-example').eq(12).click();
      cy.get('@input').should('have.value', `${examples[themeId].left[0].text} ${examples[themeId].right[5].text}`);
      cy.getByTestId('searchbar-clear').click();
    });
  });
});
