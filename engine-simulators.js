(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const SimulatorEngine = {
    initializeCakeCustomization: function () {
      const defaultCake = {
        baseProductId: "custom-cake",
        categoryId: "cakes",
        persons: 2,
        tiers: 1,
        flavourId: "vanilla",
        fillingId: "nutella",
        printingOption: "none",
        textOnCake: "",
        extraInstructions: ""
      };
      window.BoseSweets.Core.setState("builders", { ...window.BoseSweets.Core.getState("builders"), cake: defaultCake });
      return defaultCake;
    },

    updateCakeConfiguration: function (patch) {
      const currentBuilders = window.BoseSweets.Core.getState("builders") || { cake: null, flower: null };
      if (!currentBuilders.cake) {
        SimulatorEngine.initializeCakeCustomization();
      }
      
      const updatedCake = { ...window.BoseSweets.Core.getState("builders").cake, ...patch };
      
      const validation = SimulatorEngine.validateCakeConfig(updatedCake);
      if (!validation.valid) {
        console.warn("Cake Configuration Invalid Status:", validation.errors);
        return { updatedCake, valid: false, errors: validation.errors };
      }

      window.BoseSweets.Core.updateState("builders", { cake: updatedCake });

      if (window.BoseSweets.Core.emit) {
        window.BoseSweets.Core.emit("cake.configuration.updated", updatedCake);
      }

      return { updatedCake, valid: true, errors: [] };
    },

    initializeFlowerCustomization: function () {
      const defaultFlower = {
        baseProductId: "custom-flower",
        categoryId: "flowers",
        boxColor: "white",
        flowersCount: 15,
        flowerTypeId: "red-roses",
        chocolateId: "none",
        cardText: ""
      };
      window.BoseSweets.Core.setState("builders", { ...window.BoseSweets.Core.getState("builders"), flower: defaultFlower });
      return defaultFlower;
    },

    updateFlowerConfiguration: function (patch) {
      const currentBuilders = window.BoseSweets.Core.getState("builders") || { cake: null, flower: null };
      if (!currentBuilders.flower) {
        SimulatorEngine.initializeFlowerCustomization();
      }

      const updatedFlower = { ...window.BoseSweets.Core.getState("builders").flower, ...patch };

      const validation = SimulatorEngine.validateFlowerConfig(updatedFlower);
      if (!validation.valid) {
        console.warn("Flower Configuration Invalid Status:", validation.errors);
        return { updatedFlower, valid: false, errors: validation.errors };
      }

      window.BoseSweets.Core.updateState("builders", { flower: updatedFlower });

      if (window.BoseSweets.Core.emit) {
        window.BoseSweets.Core.emit("flower.configuration.updated", updatedFlower);
      }

      return { updatedFlower, valid: true, errors: [] };
    },

    validateCakeConfig: function (cake) {
      const result = { valid: true, errors: [] };
      const persons = parseInt(cake.persons, 10);
      
      if (isNaN(persons) || persons < 2 || persons > 50) {
        result.valid = false;
        result.errors.push({ field: "persons", message: "عدد الأفراد يجب أن يكون بين 2 و 50 فرد." });
      }
      if (cake.textOnCake && cake.textOnCake.length > 60) {
        result.valid = false;
        result.errors.push({ field: "textOnCake", message: "الكتابة على التورتة لا تتعدى 60 حرفاً لضمان فخامة الشكل." });
      }
      return result;
    },

    validateFlowerConfig: function (flower) {
      const result = { valid: true, errors: [] };
      const count = parseInt(flower.flowersCount, 10);

      if (isNaN(count) || count < 5 || count > 100) {
        result.valid = false;
        result.errors.push({ field: "flowersCount", message: "عدد الورد يجب أن يكون بين 5 و 100 وردة." });
      }
      return result;
    }
  };

  window.BoseSweets.Builders.SimulatorEngine = SimulatorEngine;
  window.BoseSweets.Builders.updateCakeConfiguration = SimulatorEngine.updateCakeConfiguration;
  window.BoseSweets.Builders.updateFlowerConfiguration = SimulatorEngine.updateFlowerConfiguration;
  window.BoseSweets.Builders.initializeCakeCustomization = SimulatorEngine.initializeCakeCustomization;
  window.BoseSweets.Builders.initializeFlowerCustomization = SimulatorEngine.initializeFlowerCustomization;
})();
