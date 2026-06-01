/**
 * Bose Sweets
 * Event Bus
 * Version: 1.0.0
 */

(function initializeEventBus() {
  const listeners = new Map();

  function emit(eventName, payload = null) {
    if (!listeners.has(eventName)) {
      return;
    }

    listeners.get(eventName).forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(
          `[Bose Sweets] Event Error (${eventName})`,
          error
        );
      }
    });
  }

  function listen(eventName, callback) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, []);
    }

    listeners.get(eventName).push(callback);
  }

  function removeListener(eventName, callback) {
    if (!listeners.has(eventName)) {
      return;
    }

    const filtered = listeners
      .get(eventName)
      .filter((item) => item !== callback);

    listeners.set(eventName, filtered);
  }

  function removeAllListeners(eventName) {
    listeners.delete(eventName);
  }

  function hasListener(eventName) {
    return listeners.has(eventName);
  }

  window.BoseSweets.Core.EventBus = {
    emit,
    listen,
    removeListener,
    removeAllListeners,
    hasListener
  };
})();
