const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Change this from http://localhost:3000 to http://localhost
    baseUrl: "http://localhost",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
