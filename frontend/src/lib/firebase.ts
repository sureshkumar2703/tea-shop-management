import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAnMc3Htu3oPAWok2NISrVCK-rgFpYOFoE",
  authDomain: "tea-shop-management.firebaseapp.com",
  projectId: "tea-shop-management",
  storageBucket: "tea-shop-management.firebasestorage.app",
  messagingSenderId: "798668382655",
  appId: "1:798668382655:web:96d3a324ffe5c6705d410a",
  measurementId: "G-VYB5FKL1SF",
};

// Initialize Firebase App (avoid re-initialization)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
