(function () {
  if (window.BoseSweetsCore) return;

  const StateStore = {
    state: {
      cart: [],
      config: null,
      user: null
    },
    listeners: [],
    
    init() {
      const savedCart = localStorage.getItem('bs_cart');
      if (savedCart) {
        try {
          this.state.cart = JSON.parse(savedCart);
        } catch (e) {
          this.state.cart = [];
        }
      }
    },

    getCart() {
      return this.state.cart;
    },

    addToCart(product, quantity = 1, options = null) {
      const cartItemId = options && options.customId ? options.customId : product.id;
      const existingItem = this.state.cart.find(item => item.cartItemId === cartItemId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.state.cart.push({
          cartItemId: cartItemId,
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image || '',
          quantity: quantity,
          options: options
        });
      }
      this.saveAndNotify();
    },

    updateQuantity(cartItemId, quantity) {
      const item = this.state.cart.find(item => item.cartItemId === cartItemId);
      if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
          this.state.cart = this.state.cart.filter(item => item.cartItemId !== cartItemId);
        }
        this.saveAndNotify();
      }
    },

    removeFromCart(cartItemId) {
      this.state.cart = this.state.cart.filter(item => item.cartItemId !== cartItemId);
      this.saveAndNotify();
    },

    clearCart() {
      this.state.cart = [];
      this.saveAndNotify();
    },

    getCartTotal() {
      return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCartCount() {
      return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    },

    saveAndNotify() {
      localStorage.setItem('bs_cart', JSON.stringify(this.state.cart));
      this.notify();
      EventBus.emit('cart:updated', this.state.cart);
    },

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    },

    notify() {
      this.listeners.forEach(listener => listener(this.state));
    }
  };

  const EventBus = {
    events: {},
    
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
    },
    
    off(event, callback) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    },
    
    emit(event, data) {
      if (!this.events[event]) return;
      this.events[event].forEach(callback => callback(data));
    }
  };

  StateStore.init();

  window.BoseSweetsCore = {
    Store: StateStore,
    Bus: EventBus
  };
})();