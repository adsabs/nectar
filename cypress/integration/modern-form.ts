describe('Modern Form', () => {
  it('clicking search examples update search bar', () => {
    cy.visit('/');
    cy.contains('year:2000').click();
    cy.get('input[name=q]').should('have.value', 'year:2000');
    cy.contains('property:refereed').click();
    cy.get('input[name=q]').should('have.value', 'year:2000 property:refereed');
  });
});
