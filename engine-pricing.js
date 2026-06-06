(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const PricingEngine = {
    calculateItemPrice: function (baseProduct, configurations = {}) {
      if (!baseProduct || typeof baseProduct.price !== "number") {
        console.error("Pricing Engine Rejected: Invalid base product price.");
        return { amount: 0, currency: "EGP" };
      }

      let finalPrice = baseProduct.price;

      if (baseProduct.categoryId === "cakes" && configurations.cakeBuilder) {
        finalPrice = PricingEngine.calculateCakeCustomization(baseProduct, configurations.cakeBuilder);
      } 
      else if (baseProduct.categoryId === "flowers" && configurations.flowerBuilder) {
        finalPrice = PricingEngine.calculateFlowerCustomization(baseProduct, configurations.flowerBuilder);
      }

      if (configurations.discountPercentage && configurations.discountPercentage > 0) {
        const discountAmount = finalPrice * (configurations.discountPercentage / 100);
        finalPrice = Math.max(0, finalPrice - discountAmount);
      }

      return {
        amount: Math.round(finalPrice),
        currency: "EGP"
      };
    },

    calculateCakeCustomization: function (product, cakeConfig) {
      let price = product.price; 
      const persons = parseInt(cakeConfig.persons, 10) || 2;
      
      if (persons > 2) {
        const extraPersons = persons - 2;
        const perPersonCost = product.perPersonAdditionalCost || 50; 
        price += extraPersons * perPersonCost;
      }

      if (cakeConfig.printingOption === "edible") {
        price += 60; 
      } else if (cakeConfig.printingOption === "non-edible") {
        price += 20; 
      }

      if (cakeConfig.tiers && cakeConfig.tiers > 1) {
        price += (cakeConfig.tiers - 1) * 150; 
      }

      return price;
    },

    calculateFlowerCustomization: function (product, flowerConfig) {
      let price = product.price || 400; 
      const flowerCount = parseInt(flowerConfig.flowersCount, 10) || 15;
      
      if (flowerCount > 15) {
        const extraFlowers = flowerCount - 15;
        const extraFlowerPrice = product.extraFlowerPrice || 35; 
        price += extraFlowers * extraFlowerPrice;
      }

      if (flowerConfig.chocolateId) {
        const chocolatePrice = flowerConfig.chocolatePrice || 100; 
        price += chocolatePrice;
      }

      return price;
    },

    getShippingCost: function (zoneId) {
      const zones = {
        "kifah": 20,
        "farafra-center": 10,
        "villages": 35
      };
      return zones[zoneId] !== undefined ? zones[zoneId] : 0;
    }
  };

  window.BoseSweets.Engines.PricingEngine = PricingEngine;
  window.BoseSweets.Engines.calculateItemPrice = PricingEngine.calculateItemPrice;
  window.BoseSweets.Engines.getShippingCost = PricingEngine.getShippingCost;
})();