/**
 * 👑 BoseSweets Core Engine v3.0 - النواة المركزية
 * الإدارة: حلويات بوسي
 * الملف ده هو المسؤول الوحيد عن ربط الموقع بقاعدة البيانات والسحابة.
 */

const boseConfig = {
    // إعدادات فايربيز اللي سحبناها من الملفات القديمة
    firebase: {
        apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
        authDomain: "bosy-sweets.firebaseapp.com",
        projectId: "bosy-sweets",
        storageBucket: "bosy-sweets.firebasestorage.app",
        messagingSenderId: "473615735083",
        appId: "1:473615735083:web:f09c6001c72640b2588d6e",
        measurementId: "G-6S8EXY7Y4P"
    },
    // إعدادات مخزن الصور (كلاوديناري) لضمان ظهور صور المنتجات
    cloudinary: {
        cloudName: "dyx4w0dr1",
        baseDeliveryUrl: "https://res.cloudinary.com/dyx4w0dr1/image/upload/"
    },
    // الهوية البصرية الصارمة (بمبي وأبيض ورمادي داكن)
    branding: {
        colors: {
            pink: "#ff91a4",        
            dark: "#1a1a1a",   
            white: "#FFFFFF"        
        },
        typography: {
            titleWeight: "700",     
            lineHeight: "1.7"       
        }
    },
    // معلومات المقر الرسمي في الفرافرة
    location: {
        address: "الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي وعيادة د. علي",
    }
};

export default boseConfig;
