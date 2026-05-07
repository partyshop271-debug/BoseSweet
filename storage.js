export const ClientStorageEngine = {
    dbName: 'BoseSweetsClientDB',
    cartStore: 'CartStore',
    queueStore: 'PendingOrdersQueue',
    version: 2,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.cartStore)) db.createObjectStore(this.cartStore);
                if (!db.objectStoreNames.contains(this.queueStore)) db.createObjectStore(this.queueStore, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async set(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
    },
    async get(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readonly');
                const store = tx.objectStore(this.cartStore);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    },
    async remove(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    },
    async queueOrder(orderData) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.put(orderData);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    },
    async getQueuedOrders() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readonly');
                const store = tx.objectStore(this.queueStore);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch(e) { return []; }
    },
    async removeQueuedOrder(id) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    }
};
