// load type definitions that come with Cypress module
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by test id.
     * @example cy.getByTestId('search-input')
     */
    getByTestId(selector: string): Chainable;

    /**
     * Custom command to select DOM element by role.
     * @example cy.getByRole('search-input')
     */
    getByRole(selector: string): Chainable;
  }
}
