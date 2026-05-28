import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Flip this to switch the whole app between the dev and production
// Firebase projects. Note: `npm run deploy:production` deploys hosting to the
// prod project regardless of this flag.
const isDev = true

const devConfig = {
  apiKey: "AIzaSyCGxqn50YwTxhFl4Gat3i2XNiUpLE1gcUc",
  authDomain: "sinhphu-dev.firebaseapp.com",
  projectId: "sinhphu-dev",
  storageBucket: "sinhphu-dev.appspot.com",
  messagingSenderId: "882351792258",
  appId: "1:882351792258:web:bccb6399e4a043f5f8d49b",
}

const prodConfig = {
  apiKey: "AIzaSyDAmJiyBL-5fl7eR1Kn8ZT8RD-Dz6oLfeM",
  authDomain: "sinhphu-78dae.firebaseapp.com",
  projectId: "sinhphu-78dae",
  storageBucket: "sinhphu-78dae.appspot.com",
  messagingSenderId: "995049989516",
  appId: "1:995049989516:web:fad5d81ee7a07a046ce2a9",
}

const firebaseConfig = isDev ? devConfig : prodConfig

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Second app instance so creating a new user doesn't replace the
// currently signed-in admin in the primary auth context.
const adminApp = initializeApp(firebaseConfig, "Admin")
export const adminAuth = getAuth(adminApp)
