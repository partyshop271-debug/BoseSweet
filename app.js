// === BoseSweets Engine: Cloud Only ===
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let catalog = []; let siteSettings = {};

async function igniteEngine() {
    try {
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) siteSettings = settingsSnap.data();

        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push(doc.data()));

        if (window.initApp) initApp(); // استدعاء دالة رسم الموقع
        document.getElementById('global-loader')?.classList.add('opacity-0');
    } catch (error) { console.error("Cloud Error"); }
}
window.onload = igniteEngine;
