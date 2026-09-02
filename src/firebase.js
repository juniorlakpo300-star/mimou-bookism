import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1NXFvJdiJPak3FF3LnAMvDJi2vu9J7IU",
  authDomain: "mimou-boook.firebaseapp.com",
  projectId: "mimou-boook",
  storageBucket: "mimou-boook.firebasestorage.app",
  messagingSenderId: "979825746227",
  appId: "1:979825746227:web:58d99fcc18abfa47d7de46",
  measurementId: "G-77RR5P2ZLG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);