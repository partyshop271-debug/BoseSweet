(function () {
  if (window.BoseSweets) {
    console.warn("BoseSweets bootstrap executed more than once. Process blocked.");
    return;
  }

  window.BoseSweets = {
    Core: {},
    Runtime: {},
    Engines: {},
    Builders: {},
    UI: {},
    Admin: {},
    Integrations: {}
  };

  const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-46D1CS3WLB"
  };

  const cloudinaryConfig = {
    cloudName: "dyx4w0dr1",
    uploadPreset: "gcti28h"
  };

  let isInitialized = false;

  async function bootstrap() {
    if (isInitialized) return;
    
    try {
      console.log("Starting BoseSweets Platform Initialization...");
      
      const response = await fetch("schema-constants.json");
      if (!response.ok) {
        throw new Error("Failed to load schema-constants.json file");
      }
      window.BoseSweets.Runtime.Schema = await response.ok ? response.json() : null;

      if (window.BoseSweets.Integrations.FirebaseService && window.BoseSweets.Integrations.FirebaseService.initialize) {
        window.BoseSweets.Integrations.FirebaseService.initialize(firebaseConfig);
      }

      if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
        window.BoseSweets.Core.EventBus.emit("system.initialized", {
          timestamp: new Date().toISOString(),
          context: "production"
        });
      }

      isInitialized = true;
      console.log("BoseSweets Platform Core Successfully Bootstrapped.");
    } catch (error) {
      console.error("Critical Failure During System Bootstrap:", error);
      if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
        window.BoseSweets.Core.EventBus.emit("system.error", {
          type: "RuntimeError",
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  window.BoseSweets.Core.bootstrap = bootstrap;
  window.BoseSweets.Core.getFirebaseConfig = function () { return { ...firebaseConfig }; };
  window.BoseSweets.Core.getCloudinaryConfig = function () { return { ...cloudinaryConfig }; };

  document.addEventListener("DOMContentLoaded", () => {
    bootstrap();
  });
})();