(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const UIGlobal = {
    init: function () {
      this.cacheDOM();
      this.bindEvents();
      this.subscribeToEvents();
    },

    cacheDOM: function () {
      this.menuToggleBtn = document.getElementById("menu-toggle-btn");
      this.cartToggleBtn = document.getElementById("cart-toggle-btn");
      this.closeCartBtn = document.getElementById("close-cart-btn");
      this.cartDrawer = document.getElementById("sidebar-cart-drawer");
      this.heroCtaBtn = document.getElementById("hero-cta-btn");
      this.categoriesSection = document.getElementById("categories-grid-section");
      this.cartCounterBadge = document.getElementById("cart-counter-badge");
      
      if (!document.getElementById("drawer-overlay-bg")) {
        const overlay = document.createElement("div");
        overlay.id = "drawer-overlay-bg";
        overlay.className = "drawer-overlay";
        document.body.appendChild(overlay);
        this.drawerOverlay = overlay;
      } else {
        this.drawerOverlay = document.getElementById("drawer-overlay-bg");
      }
    },

    bindEvents: function () {
      if (this.menuToggleBtn) {
        this.menuToggleBtn.addEventListener("click", () => this.scrollToCategories());
      }
      if (this.heroCtaBtn) {
        this.heroCtaBtn.addEventListener("click", () => this.scrollToCategories());
      }
      if (this.cartToggleBtn) {
        this.cartToggleBtn.addEventListener("click", () => this.openCartDrawer());
      }
      if (this.closeCartBtn) {
        this.closeCartBtn.addEventListener("click", () => this.closeCartDrawer());
      }
      if (this.drawerOverlay) {
        this.drawerOverlay.addEventListener("click", () => this.closeCartDrawer());
      }
    },

    subscribeToEvents: function () {
      if (window.BoseSweets.EventBus) {
        window.BoseSweets.EventBus.on("cart.changed", (cartData) => {
          this.updateCartBadge(cartData);
        });
        
        window.BoseSweets.EventBus.on("ui.cart.open", () => {
          this.openCartDrawer();
        });
      }
    },

    scrollToCategories: function () {
      if (this.categoriesSection) {
        this.categoriesSection.scrollIntoView({ behavior: "smooth" });
      }
    },

    openCartDrawer: function () {
      if (this.cartDrawer && this.drawerOverlay) {
        this.cartDrawer.classList.add("active");
        this.drawerOverlay.classList.add("active");
        this.cartDrawer.setAttribute("aria-hidden", "false");
      }
    },

    closeCartDrawer: function () {
      if (this.cartDrawer && this.drawerOverlay) {
        this.cartDrawer.classList.remove("active");
        this.drawerOverlay.classList.remove("active");
        this.cartDrawer.setAttribute("aria-hidden", "true");
      }
    },

    updateCartBadge: function (cart) {
      if (this.cartCounterBadge && cart && Array.isArray(cart.items)) {
        let totalCount = 0;
        cart.items.forEach(item => {
          totalCount += (item.quantity || 1);
        });
        this.cartCounterBadge.textContent = totalCount;
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    UIGlobal.init();
    window.BoseSweets.UI = window.BoseSweets.UI || {};
    window.BoseSweets.UI.Global = UIGlobal;
  });
})();
