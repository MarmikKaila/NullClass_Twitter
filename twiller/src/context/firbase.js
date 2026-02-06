
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDGqJdVf7dCX4B1sioCE50dS3X0zqyP6Q",
  authDomain: "twitter-4c495.firebaseapp.com",
  projectId: "twitter-4c495",
  storageBucket: "twitter-4c495.firebasestorage.app",
  messagingSenderId: "770720262414",
  appId: "1:770720262414:web:03f645e61f3330a4e70f5f",
  measurementId: "G-PKNTPLQCP5"
};

const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
export default app
// const analytics = getAnalytics(app);
