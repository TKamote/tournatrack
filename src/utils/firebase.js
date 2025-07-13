// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCO5KdC1_qxgvamSkV2du6U76xwgL0NqhU",
  authDomain: "tournatrack-e8f88.firebaseapp.com",
  projectId: "tournatrack-e8f88",
  storageBucket: "tournatrack-e8f88.appspot.com",
  messagingSenderId: "818429911261",
  appId: "1:818429911261:web:111125fc32d395ee4cbb34",
  measurementId: "G-EEQ9V8ZBCT",
};

const app = initializeApp(firebaseConfig);

// Set up persistent auth for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
