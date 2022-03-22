import { IADSApiSearchParams } from '@api/lib/search/types';
import { cy, describe, expect, it } from 'local-cypress';

const search = (params: Partial<IADSApiSearchParams>) => {
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

describe('Results Page URL sync', () => {
  it('searchbar shows correct search term', () => {
    search({ q: 'a' });
    cy.get('form').find('[type="text"]').first().should('have.value', 'a');
  });

  it('submission updates url correctly', () => {
    search({ q: 'a' });
    cy.get('form').find('[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
    cy.get('@input').should('have.value', 'a');

    updateAndSubmitForm(' b');
    assertQueryParam({ q: 'a b' });
    cy.get('@input').should('have.value', 'a b');

    updateAndSubmitForm(' c');
    assertQueryParam({ q: 'a b c' });
    cy.get('@input').should('have.value', 'a b c');
  });

  it.only('history updates url correctly', () => {
    search({ q: 'a' });
    cy.get('form').find('[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
    updateAndSubmitForm(' b');
    updateAndSubmitForm(' c');

    assertQueryParam({ q: 'a b c' });
    cy.get('@input').should('have.value', 'a b c');

    cy.go('back');
    assertQueryParam({ q: 'a b' });
    cy.get('@input').should('have.value', 'a b');

    cy.go('back');
    assertQueryParam({ q: 'a' });
    cy.get('@input').should('have.value', 'a');
  });
});
