import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { paymentRef, paymentsColRef } from "../services/firebase"
import { stripEmpty } from "./converter"
import { Payment, PaymentInput } from "./types"

function fromFirestore(id: string, data: any): Payment {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    limit_total_payment: data.limit_total_payment
      ? {
          monthly: data.limit_total_payment.monthly ?? 0,
          quarterly: data.limit_total_payment.quarterly ?? 0,
          yearly: data.limit_total_payment.yearly ?? 0,
        }
      : undefined,
  }
}

export async function createPayment(input: PaymentInput): Promise<string> {
  if (!input.name?.trim()) throw new Error("Payment name is required.")
  const newId = doc(paymentsColRef).id
  await setDoc(paymentRef(newId), stripEmpty(input))
  return newId
}

export async function getPayment(id: string): Promise<Payment | null> {
  const snap = await getDoc(paymentRef(id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data())
}

export async function listPayments(): Promise<Payment[]> {
  const snap = await getDocs(paymentsColRef)
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function updatePayment(
  id: string,
  input: PaymentInput
): Promise<void> {
  if (!id) throw new Error("Invalid payment id.")
  const body = stripEmpty(input)
  delete (body as any).id
  await updateDoc(paymentRef(id), body)
}

export async function deletePayment(id: string): Promise<void> {
  if (!id) throw new Error("Invalid payment id.")
  await deleteDoc(paymentRef(id))
}
