// load type definitions that come with Cypress module
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by test id.
     * @example cy.getByTestId('search-input')
     */
    getByTestId(selector: string): Chainable;
  }
}
