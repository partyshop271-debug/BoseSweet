/**
 * Bose Sweets
 * Runtime Bootstrap
 * Version: 1.0.0
 */

(function bootstrapRuntime() {
  if (!window.BoseSweets) {
    window.BoseSweets = {
      Core: {},
      Runtime: {},
      Engines: {},
      Builders: {},
      UI: {},
      Admin: {},
      Integrations: {}
    };
  }

  console.info("[Bose Sweets] Runtime Initialized");
})();
