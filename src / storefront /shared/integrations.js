const firebaseConfig = {
  apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
  authDomain: "bosy-sweets.firebaseapp.com",
  projectId: "bosy-sweets",
  storageBucket: "bosy-sweets.firebasestorage.app",
  messagingSenderId: "473615735083",
  appId: "1:473615735083:web:f09c6001c72640b2588d6e",
  measurementId: "G-46D1CS3WLB"
};

const cloudinaryConfig = {
  cloudName: "dyx4w0dr1",
  uploadPreset: "bose_presets_unsigned"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.BoseSweets = window.BoseSweets || {};
window.BoseSweets.Integrations = {
  
  async createRecord(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.propagateError("StorageError", error.message);
      return false;
    }
  },

  async readRecord(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      this.propagateError("StorageError", error.message);
      return null;
    }
  },

  async readCollection(collectionName, fieldQuery = null, valueQuery = null, limitCount = 50) {
    try {
      const colRef = collection(db, collectionName);
      let q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount));
      if (fieldQuery && valueQuery) {
        q = query(colRef, where(fieldQuery, "==", valueQuery), orderBy("createdAt", "desc"), limit(limitCount));
      }
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      return records;
    } catch (error) {
      this.propagateError("StorageError", error.message);
      return [];
    }
  },

  async updateRecord(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.propagateError("StorageError", error.message);
      return false;
    }
  },

  async uploadMedia(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) throw new Error("Cloudinary networking failed");
      const result = await response.json();
      
      return {
        id: result.public_id,
        url: result.secure_url
      };
    } catch (error) {
      this.propagateError("StorageError", `Media upload failed: ${error.message}`);
      return null;
    }
  },

  async authenticateAdmin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      this.propagateError("AuthenticationError", error.message);
      return null;
    }
  },

  async logoutAdmin() {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      return false;
    }
  },

  onAuthTrigger(callback) {
    onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  },

  sendWhatsAppOrder(phone, messageText) {
    try {
      const cleanedPhone = phone.replace(/[^0-9]/g, "");
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank");
      return true;
    } catch (error) {
      this.propagateError("NetworkError", "WhatsApp launch failed");
      return false;
    }
  },

  propagateError(type, message) {
    if (window.BoseSweets && window.BoseSweets.Core && typeof window.BoseSweets.Core.emit === "function") {
      window.BoseSweets.Core.emit("system.error", { type, message, timestamp: new Date().toISOString() });
    }
  }
};
