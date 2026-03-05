describe("Basic Site Navigation", () => {
  it("should load the homepage successfully", () => {
    cy.visit("/");
    cy.contains("Welcome"); // Replace 'Welcome' with text actually on your site
  });

  it("should navigate to the login page and show errors on empty submit", () => {
    cy.visit("/login");
    cy.get('button[type="submit"]').click();
    cy.get(".error-message").should("be.visible");
  });
});
