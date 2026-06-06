(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  let db = null;

  const FirebaseService = {
    initialize: function (config) {
      if (db) return;

      try {
        console.log("Connecting to Firebase Services...");
        
        if (typeof firebase === "undefined") {
          throw new Error("Firebase SDK missing. Ensure scripts are properly loaded.");
        }

        firebase.initializeApp(config);
        db = firebase.firestore();
        
        db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_BYTES_UNLIMITED });
        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          console.warn("Firestore persistence warning:", err.code);
        });

        console.log("Firebase & Firestore Services Successfully Initialized.");
        
        if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
          window.BoseSweets.Core.EventBus.emit("system.initialized", { provider: "firestore" });
        }
      } catch (error) {
        console.error("Critical Firebase Initialization Failure:", error);
        if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
          window.BoseSweets.Core.EventBus.emit("system.error", {
            type: "NetworkError",
            message: `Firebase connection failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    },

    getFirestore: function () {
      return db;
    },

    createDocument: async function (collectionName, data, customId = null) {
      try {
        if (!db) throw new Error("Firestore is not initialized.");
        const docRef = customId ? db.collection(collectionName).doc(customId) : db.collection(collectionName).doc();
        const finalData = {
          ...data,
          id: customId || docRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        };
        await docRef.set(finalData);
        return finalData;
      } catch (error) {
        console.error(`Firestore Create Error [${collectionName}]:`, error);
        throw error;
      }
    },

    getDocument: async function (collectionName, docId) {
      try {
        if (!db) throw new Error("Firestore is not initialized.");
        const doc = await db.collection(collectionName).doc(docId).get();
        if (!doc.exists) throw new Error(`Document with ID ${docId} not found in ${collectionName}`);
        return doc.data();
      } catch (error) {
        console.error(`Firestore Read Error [${collectionName}]:`, error);
        throw error;
      }
    },

    updateDocument: async function (collectionName, docId, data) {
      try {
        if (!db) throw new Error("Firestore is not initialized.");
        const docRef = db.collection(collectionName).doc(docId);
        const updateData = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        await docRef.update(updateData);
        return true;
      } catch (error) {
        console.error(`Firestore Update Error [${collectionName}]:`, error);
        throw error;
      }
    },

    queryDocuments: async function (collectionName, constraints = []) {
      try {
        if (!db) throw new Error("Firestore is not initialized.");
        let query = db.collection(collectionName);

        constraints.forEach(constraint => {
          if (constraint.type === "where") {
            query = query.where(constraint.field, constraint.operator, constraint.value);
          } else if (constraint.type === "orderBy") {
            query = query.orderBy(constraint.field, constraint.direction || "asc");
          } else if (constraint.type === "limit") {
            query = query.limit(constraint.value);
          }
        });

        const snapshot = await query.get({ source: "default" });
        const results = [];
        snapshot.forEach(doc => results.push(doc.data()));
        return results;
      } catch (error) {
        console.error(`Firestore Query Error [${collectionName}]:`, error);
        throw error;
      }
    }
  };

  window.BoseSweets.Integrations.FirebaseService = FirebaseService;
  window.BoseSweets.Integrations.createDocument = FirebaseService.createDocument;
  window.BoseSweets.Integrations.getDocument = FirebaseService.getDocument;
  window.BoseSweets.Integrations.updateDocument = FirebaseService.updateDocument;
  window.BoseSweets.Integrations.queryDocuments = FirebaseService.queryDocuments;
})();