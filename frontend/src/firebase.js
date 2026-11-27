import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "ISI_DARI_FIREBASE_CONSOLE",
  authDomain: "NAMA-PROJECT.firebaseapp.com",
  projectId: "NAMA-PROJECT",
  storageBucket: "NAMA-PROJECT.appspot.com",
  messagingSenderId: "ISI",
  appId: "ISI",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);