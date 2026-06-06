(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const listeners = {};
  const allowedEvents = [
    "system.initialized",
    "system.error",
    "product.created",
    "product.updated",
    "product.archived",
    "category.created",
    "category.updated",
    "order.created",
    "order.status.updated",
    "order.delivered",
    "review.created",
    "review.approved",
    "review.featured",
    "cake.configuration.updated",
    "flower.configuration.updated",
    "recommendation.generated",
    "recommendation.clicked",
    "search.executed",
    "search.no-results",
    "admin.login",
    "admin.logout",
    "media.uploaded",
    "backup.completed",
    "backup.failed",
    "notification.created"
  ];

  const EventBus = {
    listen: function (event, callback) {
      if (!allowedEvents.includes(event)) {
        console.error(`Event Registration Rejected: '${event}' is not an authorized system event.`);
        return;
      }
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    },

    emit: function (event, payload) {
      if (!allowedEvents.includes(event)) {
        console.error(`Event Dispatch Rejected: '${event}' is not an authorized system event.`);
        return;
      }
      
      console.log(`[Event Emitted] ${event}`, payload || "");

      if (!listeners[event]) return;

      listeners[event].forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Listener failure for event '${event}':`, error);
          
          if (event !== "system.error") {
            EventBus.emit("system.error", {
              type: "RuntimeError",
              message: `Listener crash on event ${event}: ${error.message}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    },

    removeListener: function (event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    },

    removeAllListeners: function (event) {
      if (event) {
        delete listeners[event];
      } else {
        Object.keys(listeners).forEach((key) => delete listeners[key]);
      }
    },

    hasListener: function (event) {
      return !!(listeners[event] && listeners[event].length > 0);
    }
  };

  window.BoseSweets.Core.EventBus = EventBus;
  window.BoseSweets.Core.listen = EventBus.listen;
  window.BoseSweets.Core.emit = EventBus.emit;
})();