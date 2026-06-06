(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const CartEngine = {
    addItem: function (item) {
      if (!item || !item.id || !item.type) {
        console.error("Cart Engine Rejected: Invalid cart item structure.");
        return;
      }

      let currentCart = window.BoseSweets.Core.getState("cart");
      if (!currentCart) {
        currentCart = { items: [], totalItems: 0, subtotal: { amount: 0, currency: "EGP" } };
      }

      const existingItemIndex = currentCart.items.findIndex(
        (cartItem) => cartItem.id === item.id && cartItem.type === item.type
      );

      if (existingItemIndex > -1) {
        currentCart.items[existingItemIndex].quantity += item.quantity || 1;
        currentCart.items[existingItemIndex].totalPrice.amount =
          currentCart.items[existingItemIndex].quantity * currentCart.items[existingItemIndex].unitPrice.amount;
      } else {
        const newItem = {
          id: item.id,
          type: item.type,
          title: item.title,
          imageUrl: item.imageUrl || "",
          quantity: item.quantity || 1,
          unitPrice: { amount: item.unitPrice.amount, currency: "EGP" },
          totalPrice: { amount: (item.quantity || 1) * item.unitPrice.amount, currency: "EGP" }
        };
        currentCart.items.push(newItem);
      }

      const updatedCart = CartEngine.recalculateCart(currentCart);
      window.BoseSweets.Core.setState("cart", updatedCart);

      if (window.BoseSweets.Core.emit) {
        window.BoseSweets.Core.emit("cart.item.added", item);
      }
    },

    removeItem: function (itemId) {
      let currentCart = window.BoseSweets.Core.getState("cart");
      if (!currentCart) return;

      const itemToRemove = currentCart.items.find((item) => item.id === itemId);
      if (!itemToRemove) return;

      currentCart.items = currentCart.items.filter((item) => item.id !== itemId);

      const updatedCart = CartEngine.recalculateCart(currentCart);
      window.BoseSweets.Core.setState("cart", updatedCart);

      if (window.BoseSweets.Core.emit) {
        window.BoseSweets.Core.emit("cart.item.removed", itemToRemove);
      }
    },

    updateQuantity: function (itemId, quantity) {
      const cleanQuantity = parseInt(quantity, 10);
      if (isNaN(cleanQuantity) || cleanQuantity < 1) return;

      let currentCart = window.BoseSweets.Core.getState("cart");
      if (!currentCart) return;

      const itemIndex = currentCart.items.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return;

      currentCart.items[itemIndex].quantity = cleanQuantity;
      currentCart.items[itemIndex].totalPrice.amount =
        cleanQuantity * currentCart.items[itemIndex].unitPrice.amount;

      const updatedCart = CartEngine.recalculateCart(currentCart);
      window.BoseSweets.Core.setState("cart", updatedCart);
    },

    clearCart: function () {
      const emptyCart = {
        items: [],
        totalItems: 0,
        subtotal: { amount: 0, currency: "EGP" }
      };
      window.BoseSweets.Core.setState("cart", emptyCart);

      if (window.BoseSweets.Core.emit) {
        window.BoseSweets.Core.emit("cart.cleared", emptyCart);
      }
    },

    getCart: function () {
      return window.BoseSweets.Core.getState("cart") || { items: [], totalItems: 0, subtotal: { amount: 0, currency: "EGP" } };
    },

    getCartSummary: function (shippingZonePrice = 0) {
      const currentCart = CartEngine.getCart();
      const subtotalAmount = currentCart.subtotal.amount;
      const finalTotalAmount = subtotalAmount + shippingZonePrice;

      return {
        subtotal: { amount: subtotalAmount, currency: "EGP" },
        shipping: { amount: shippingZonePrice, currency: "EGP" },
        total: { amount: finalTotalAmount, currency: "EGP" }
      };
    },

    recalculateCart: function (cartState) {
      let totalItems = 0;
      let subtotalAmount = 0;

      cartState.items.forEach((item) => {
        totalItems += item.quantity;
        subtotalAmount += item.totalPrice.amount;
      });

      cartState.totalItems = totalItems;
      cartState.subtotal.amount = subtotalAmount;

      return cartState;
    }
  };

  window.BoseSweets.Engines.CartEngine = CartEngine;
  window.BoseSweets.Engines.addItem = CartEngine.addItem;
  window.BoseSweets.Engines.removeItem = CartEngine.removeItem;
  window.BoseSweets.Engines.updateQuantity = CartEngine.updateQuantity;
  window.BoseSweets.Engines.clearCart = CartEngine.clearCart;
  window.BoseSweets.Engines.getCart = CartEngine.getCart;
  window.BoseSweets.Engines.getCartSummary = CartEngine.getCartSummary;
})();
