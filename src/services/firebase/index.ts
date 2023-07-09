import { collection, doc } from 'firebase/firestore'

import { db, auth, storage, admin, adminAuth } from './config'
import { ref } from 'firebase/storage'


export const suppliersColRef = collection(db, 'suppliers')
export const billsColRef = collection(db, 'bills')
export const banksColRef = collection(db, 'banks')

export const supplierRef = (id: string) => doc(db, 'suppliers', id)
export const billRef = (id: string) => doc(db, 'bills', id)
export const bankRef = (id: string) => doc(db, 'banks', id)
export const userRef = (id: string) => doc(db, 'users', id)

export const storageBillsRef = ref(storage, 'bills')

/**
 * /bills/:id/
 */
export const storageOneBillRef = (id: string) => {
  return ref(storageBillsRef, id ?? '')
}


export {db, auth, storage}