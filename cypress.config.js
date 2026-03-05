const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    supportFile: false, // This bypasses the requirement for cypress/support/e2e.js
    baseUrl: "http://localhost:3000", // Update to your app's URL
  },
});
