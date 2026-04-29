// firebase-config.js
// 👑 BoseSweets Cloud Central Connection

const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-46D1CS3WLB"
};

// تهيئة الاتصال بالسحابة
firebase.initializeApp(firebaseConfig);

// تعريف محرك قاعدة البيانات
const db = firebase.firestore();

// تعريف محرك المصادقة (الحماية الجديدة للإدارة)
const auth = firebase.auth();

// 🛡️ Engine Upgrade: Network Resilience Engine
const NetworkEngine = {
    async safeWrite(collectionName, docId, data, maxRetries = 4) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try { await db.collection(collectionName).doc(String(docId)).set(data); return true; } 
            catch (error) { attempt++; if (attempt === maxRetries) throw error; await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt))); }
        }
    },
    async safeDelete(collectionName, docId, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try { await db.collection(collectionName).doc(String(docId)).delete(); return true; } 
            catch (error) { attempt++; if (attempt === maxRetries) throw error; await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt))); }
        }
    }
};
