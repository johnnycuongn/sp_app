import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const isDev = true

let firebaseConfig = {
  apiKey: "AIzaSyDAmJiyBL-5fl7eR1Kn8ZT8RD-Dz6oLfeM",
  authDomain: "sinhphu-78dae.firebaseapp.com",
  projectId: "sinhphu-78dae",
  storageBucket: "sinhphu-78dae.appspot.com",
  messagingSenderId: "995049989516",
  appId: "1:995049989516:web:fad5d81ee7a07a046ce2a9"
};

if (isDev) {
  firebaseConfig = {
    apiKey: "AIzaSyCGxqn50YwTxhFl4Gat3i2XNiUpLE1gcUc",
    authDomain: "sinhphu-dev.firebaseapp.com",
    projectId: "sinhphu-dev",
    storageBucket: "sinhphu-dev.appspot.com",
    messagingSenderId: "882351792258",
    appId: "1:882351792258:web:bccb6399e4a043f5f8d49b"
  };
}


export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

export const admin = initializeApp(firebaseConfig, 'Admin')
export const adminAuth = getAuth(admin)