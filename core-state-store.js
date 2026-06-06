(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const STORAGE_KEY = "bose_sweets_runtime_state";

  const state = {
    application: { initialized: false, currentRoute: "/" },
    cart: { items: [], totalItems: 0, subtotal: { amount: 0, currency: "EGP" } },
    customer: { name: "", phone: "", email: "", addresses: [] },
    settings: { currency: "EGP", defaultLanguage: "ar" },
    search: { query: "", results: [] },
    builders: { cake: null, flower: null }
  };

  const subscribers = [];

  function loadPersistedState() {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEY);
      if (serializedState) {
        const parsed = JSON.parse(serializedState);
        if (parsed && parsed.cart) state.cart = parsed.cart;
        if (parsed && parsed.customer) state.customer = parsed.customer;
        console.log("Successfully restored persisted state from local storage.");
      }
    } catch (error) {
      console.error("Failed to load persisted state from storage:", error);
    }
  }

  function saveStateToStorage() {
    try {
      const stateToPersist = {
        cart: state.cart,
        customer: state.customer
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error("Failed to persist state to storage:", error);
    }
  }

  const StateStore = {
    getState: function (domain) {
      if (domain) {
        return state[domain] ? JSON.parse(JSON.stringify(state[domain])) : null;
      }
      return JSON.parse(JSON.stringify(state));
    },

    setState: function (domain, newState) {
      if (!state[domain]) {
        console.error(`State Domain Rejected: '${domain}' is not a valid state domain.`);
        return;
      }

      state[domain] = JSON.parse(JSON.stringify(newState));
      
      saveStateToStorage();

      if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
        window.BoseSweets.Core.EventBus.emit("cart.updated", state.cart);
      }

      subscribers.forEach((callback) => {
        try {
          callback(domain, state[domain]);
        } catch (error) {
          console.error("Error during state subscription notification:", error);
        }
      });
    },

    updateState: function (domain, patchState) {
      if (!state[domain]) {
        console.error(`State Patch Rejected: '${domain}' is not a valid state domain.`);
        return;
      }
      const merged = { ...state[domain], ...patchState };
      StateStore.setState(domain, merged);
    },

    resetState: function (domain) {
      if (domain && state[domain]) {
        if (domain === "cart") {
          state.cart = { items: [], totalItems: 0, subtotal: { amount: 0, currency: "EGP" } };
        } else if (domain === "builders") {
          state.builders = { cake: null, flower: null };
        }
        saveStateToStorage();
      }
    },

    subscribe: function (callback) {
      if (typeof callback === "function") {
        subscribers.push(callback);
      }
    },

    unsubscribe: function (callback) {
      const index = subscribers.indexOf(callback);
      if (index > -1) subscribers.splice(index, 1);
    }
  };

  loadPersistedState();

  window.BoseSweets.Core.StateStore = StateStore;
  window.BoseSweets.Core.getState = StateStore.getState;
  window.BoseSweets.Core.setState = StateStore.setState;
  window.BoseSweets.Core.updateState = StateStore.updateState;
})();
