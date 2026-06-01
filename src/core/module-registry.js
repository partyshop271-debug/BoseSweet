/**
 * Bose Sweets
 * Module Registry
 * Version: 1.0.0
 */

(function initializeModuleRegistry() {
  const modules = new Map();

  function registerModule(name, instance) {
    if (!name || typeof name !== "string") {
      throw new Error("Module name is required.");
    }

    if (modules.has(name)) {
      throw new Error(`Module already registered: ${name}`);
    }

    modules.set(name, instance);
  }

  function unregisterModule(name) {
    modules.delete(name);
  }

  function getModule(name) {
    return modules.get(name) || null;
  }

  function hasModule(name) {
    return modules.has(name);
  }

  function listModules() {
    return Array.from(modules.keys());
  }

  window.BoseSweets.Core.ModuleRegistry = {
    registerModule,
    unregisterModule,
    getModule,
    hasModule,
    listModules
  };
})();
