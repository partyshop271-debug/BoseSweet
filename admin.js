// === BoseSweets Admin: Cloud Control ===
async function loadAdminData() {
    try {
        const catSnap = await db.collection('catalog').get();
        catalog = [];
        catSnap.forEach(doc => catalog.push(doc.data()));

        const setSnap = await db.collection('settings').doc('main').get();
        if(setSnap.exists) siteSettings = setSnap.data();

        renderEverything(); // تشغيل التبويبات والأزرار
        document.getElementById('admin-stat-products').innerText = catalog.length;
    } catch (error) { alert("خطأ سحابي"); }
}

function toggleAdminSidebar() {
    document.getElementById('admin-sidebar').classList.toggle('translate-x-full');
}
