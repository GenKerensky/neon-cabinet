console.log("[CONFIG] cucumber.cjs loaded, timeout:", { timeout: 30000 });
module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    import: [
      "step-definitions/**/*.ts",
      "support/world.ts",
      "support/hooks.ts",
    ],
    format: [
      "progress-bar",
      "html:test-results/cucumber-report.html",
      "json:test-results/cucumber-report.json",
    ],
    formatOptions: { snippetInterface: "async-await" },
    tags: "",
    timeout: 30000,
  },
};
