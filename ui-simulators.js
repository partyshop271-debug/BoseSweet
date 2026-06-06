(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const UISimulators = {
    init: function () {
      this.cacheDOM();
      this.bindEvents();
    },

    cacheDOM: function () {
      this.openCakeBtn = document.getElementById("open-cake-sim-btn");
      this.openFlowerBtn = document.getElementById("open-flower-sim-btn");
      
      if (!document.getElementById("simulator-modal-wrapper")) {
        const modal = document.createElement("div");
        modal.id = "simulator-modal-wrapper";
        modal.style.display = "none";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.right = "0";
        modal.style.bottom = "0";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.zIndex = "3000";
        modal.style.padding = "20px";
        modal.style.overflowY = "auto";
        document.body.appendChild(modal);
        this.simModal = modal;
      } else {
        this.simModal = document.getElementById("simulator-modal-wrapper");
      }
    },

    bindEvents: function () {
      if (this.openCakeBtn) {
        this.openCakeBtn.addEventListener("click", () => this.openCakeSimulator());
      }
      if (this.openFlowerBtn) {
        this.openFlowerBtn.addEventListener("click", () => this.openFlowerSimulator());
      }
    },

    openCakeSimulator: function () {
      if (!this.simModal) return;
      
      if (window.BoseSweets.Builders && window.BoseSweets.Builders.initializeCakeCustomization) {
        window.BoseSweets.Builders.initializeCakeCustomization();
      }

      this.simModal.innerHTML = `
        <div style="background:#FFFFFF; max-width:500px; margin:40px auto; padding:25px; border-radius:6px; border:1px solid #FF91A4; position:relative;">
          <button id="close-sim-modal-btn" style="position:absolute; top:15px; left:15px; background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
          <h3 style="font-weight:700; font-size:20px; margin-bottom:20px; border-bottom:1px solid rgba(255,145,164,0.3); padding-bottom:10px;">محاكي التورتات الذكي</h3>
          
          <div style="margin-bottom:15px;">
            <label style="display:block; font-size:14px; font-weight:600; margin-bottom:5px;">حجم التورتة (عدد الأفراد):</label>
            <input type="number" id="cake-persons-input" value="2" min="2" max="50" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo';">
          </div>

          <div style="margin-bottom:15px;">
            <label style="display:block; font-size:14px; font-weight:600; margin-bottom:5px;">الكتابة على التورتة:</label>
            <input type="text" id="cake-text-input" placeholder="اكتبي عبارة التهنئة هنا" maxlength="60" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo';">
          </div>

          <div style="margin-bottom:20px; text-align:left; height:30px;">
            <span style="font-weight:700; font-size:16px;">السعر التقريبي: </span>
            <span id="cake-sim-price-display" style="font-weight:700; font-size:18px; color:#111111;">0 جنيه</span>
          </div>

          <button id="add-cake-sim-to-cart" style="width:100%; background:#FFFFFF; border:1px solid #FF91A4; padding:10px; font-family:'Cairo'; font-weight:700; cursor:pointer; border-radius:4px;">تأكيد وإضافة للسلة</button>
        </div>
      `;

      this.simModal.style.display = "block";
      this.attachCakeListeners();
    },

    attachCakeListeners: function () {
      const closeBtn = document.getElementById("close-sim-modal-btn");
      const personsInput = document.getElementById("cake-persons-input");
      const textInput = document.getElementById("cake-text-input");
      const addToCartBtn = document.getElementById("add-cake-sim-to-cart");

      if (closeBtn) closeBtn.addEventListener("click", () => this.closeSimulator());
      
      const updateHandler = () => {
        if (window.BoseSweets.Builders && window.BoseSweets.Builders.updateCakeConfiguration) {
          const config = window.BoseSweets.Builders.updateCakeConfiguration({
            persons: parseInt(personsInput.value, 10) || 2,
            textOnCake: textInput.value
          });
          this.updateCakePriceDisplay(config.updatedCake);
        }
      };

      if (personsInput) personsInput.addEventListener("input", updateHandler);
      if (textInput) textInput.addEventListener("input", updateHandler);
      
      if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
          const finalConfig = window.BoseSweets.Core.getState("builders")?.cake;
          if (finalConfig && window.BoseSweets.Engines && window.BoseSweets.Engines.addItem) {
            const baseProduct = { price: 350, categoryId: "cakes" };
            const finalPrice = window.BoseSweets.Engines.PricingEngine ? window.BoseSweets.Engines.PricingEngine.calculateItemPrice(baseProduct, { cakeBuilder: finalConfig }) : { amount: 350 };
            
            window.BoseSweets.Engines.addItem({
              id: "custom-cake-" + Date.now(),
              type: "cake_simulator",
              title: `تورتة مخصصة (${finalConfig.persons} فرد) - ${finalConfig.textOnCake || 'بدون كتابة'}`,
              quantity: 1,
              unitPrice: { amount: finalPrice.amount }
            });
            this.closeSimulator();
            if (window.BoseSweets.Core.emit) {
              window.BoseSweets.Core.emit("ui.cart.open");
            }
          }
        });
      }

      updateHandler();
    },

    updateCakePriceDisplay: function (cakeConfig) {
      const display = document.getElementById("cake-sim-price-display");
      if (display && window.BoseSweets.Engines && window.BoseSweets.Engines.PricingEngine) {
        const baseProduct = { price: 350, categoryId: "cakes" };
        const finalPrice = window.BoseSweets.Engines.PricingEngine.calculateItemPrice(baseProduct, { cakeBuilder: cakeConfig });
        display.textContent = `${finalPrice.amount} جنيه`;
      }
    },

    openFlowerSimulator: function () {
      if (!this.simModal) return;

      if (window.BoseSweets.Builders && window.BoseSweets.Builders.initializeFlowerCustomization) {
        window.BoseSweets.Builders.initializeFlowerCustomization();
      }

      this.simModal.innerHTML = `
        <div style="background:#FFFFFF; max-width:500px; margin:40px auto; padding:25px; border-radius:6px; border:1px solid #FF91A4; position:relative;">
          <button id="close-sim-modal-btn" style="position:absolute; top:15px; left:15px; background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
          <h3 style="font-weight:700; font-size:20px; margin-bottom:20px; border-bottom:1px solid rgba(255,145,164,0.3); padding-bottom:10px;">محاكي بوكسات الورد الفاخر</h3>
          
          <div style="margin-bottom:15px;">
            <label style="display:block; font-size:14px; font-weight:600; margin-bottom:5px;">عدد الوردات الطبيعي في البوكس:</label>
            <input type="number" id="flower-count-input" value="15" min="5" max="100" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo';">
          </div>

          <div style="margin-bottom:20px; text-align:left; height:30px;">
            <span style="font-weight:700; font-size:16px;">السعر الإجمالي: </span>
            <span id="flower-sim-price-display" style="font-weight:700; font-size:18px; color:#111111;">0 جنيه</span>
          </div>

          <button id="add-flower-sim-to-cart" style="width:100%; background:#FFFFFF; border:1px solid #FF91A4; padding:10px; font-family:'Cairo'; font-weight:700; cursor:pointer; border-radius:4px;">تأكيد وإضافة للسلة</button>
        </div>
      `;

      this.simModal.style.display = "block";
      this.attachFlowerListeners();
    },

    attachFlowerListeners: function () {
      const closeBtn = document.getElementById("close-sim-modal-btn");
      const countInput = document.getElementById("flower-count-input");
      const addToCartBtn = document.getElementById("add-flower-sim-to-cart");

      if (closeBtn) closeBtn.addEventListener("click", () => this.closeSimulator());

      const updateHandler = () => {
        if (window.BoseSweets.Builders && window.BoseSweets.Builders.updateFlowerConfiguration) {
          const config = window.BoseSweets.Builders.updateFlowerConfiguration({
            flowersCount: parseInt(countInput.value, 10) || 15
          });
          this.updateFlowerPriceDisplay(config.updatedFlower);
        }
      };

      if (countInput) countInput.addEventListener("input", updateHandler);

      if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
          const finalConfig = window.BoseSweets.Core.getState("builders")?.flower;
          if (finalConfig && window.BoseSweets.Engines && window.BoseSweets.Engines.addItem) {
            const baseProduct = { price: 400, categoryId: "flowers" };
            const finalPrice = window.BoseSweets.Engines.PricingEngine ? window.BoseSweets.Engines.PricingEngine.calculateItemPrice(baseProduct, { flowerBuilder: finalConfig }) : { amount: 400 };

            window.BoseSweets.Engines.addItem({
              id: "custom-flower-" + Date.now(),
              type: "flower_simulator",
              title: `بوكس تنسيق ورد طبيعي فاخر (${finalConfig.flowersCount} وردة)`,
              quantity: 1,
              unitPrice: { amount: finalPrice.amount }
            });
            this.closeSimulator();
            if (window.BoseSweets.Core.emit) {
              window.BoseSweets.Core.emit("ui.cart.open");
            }
          }
        });
      }

      updateHandler();
    },

    updateFlowerPriceDisplay: function (flowerConfig) {
      const display = document.getElementById("flower-sim-price-display");
      if (display && window.BoseSweets.Engines && window.BoseSweets.Engines.PricingEngine) {
        const baseProduct = { price: 400, categoryId: "flowers" };
        const finalPrice = window.BoseSweets.Engines.PricingEngine.calculateItemPrice(baseProduct, { flowerBuilder: flowerConfig });
        display.textContent = `${finalPrice.amount} جنيه`;
      }
    },

    closeSimulator: function () {
      if (this.simModal) {
        this.simModal.style.display = "none";
        this.simModal.innerHTML = "";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    UISimulators.init();
    window.BoseSweets.UI = window.BoseSweets.UI || {};
    window.BoseSweets.UI.Simulators = UISimulators;
  });
})();
