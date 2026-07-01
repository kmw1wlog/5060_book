const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 10000
  }
});
