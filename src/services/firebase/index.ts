import { collection, doc } from "firebase/firestore"
import { ref } from "firebase/storage"

import { auth, db, storage } from "./config"

export const suppliersColRef = collection(db, "suppliers")
export const billsColRef = collection(db, "bills")
export const paymentsColRef = collection(db, "payments")

export const supplierRef = (id: string) => doc(db, "suppliers", id)
export const billRef = (id: string) => doc(db, "bills", id)
export const paymentRef = (id: string) => doc(db, "payments", id)
export const userRef = (id: string) => doc(db, "users", id)

export const storageBillsRef = ref(storage, "bills")
/** Storage folder for a single bill's receipts: `/bills/{billId}/` */
export const storageOneBillRef = (id: string) =>
  ref(storageBillsRef, id ?? "")

export { auth, db, storage }
