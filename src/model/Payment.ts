import { deleteDoc, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { paymentRef, paymentsColRef, db } from "../services/firebase"
import { isStringValid } from "../utils/isValid"
import { removeEmpty } from "../utils/object"
import { PaymentModelInterface } from "./model"

export class Payment {

  static async create(payment: PaymentModelInterface) {
    const batch = writeBatch(db)

    let new_payment_id = doc(paymentsColRef).id

    let postData = payment
    delete postData.id

    batch.set(paymentRef(new_payment_id), postData)

    await batch.commit()
  }

  static async get(id: string): Promise<PaymentModelInterface | null> {
    const docSnap = await getDoc(paymentRef(id))

    if (!docSnap.exists()) throw new Error('Unable to get the payment ' + id)
    const data = docSnap.data()
    return this.fromFirebase(docSnap.id, data)
  }

  static async getAll(): Promise<PaymentModelInterface[]> {
    const querySnapshot = await getDocs(paymentsColRef)

    let paymentsData: PaymentModelInterface[] = querySnapshot.docs.map(doc => {
      return this.fromFirebase(doc.id, doc.data())
    })

    return paymentsData
  }

  static async update(paymentId: string, payment: PaymentModelInterface) {
    if (!isStringValid(paymentId)) throw new Error('Invalid payment.')

    if (payment.id) delete payment.id

    const updatedPayment = {
      ...payment
    }

    removeEmpty(updatedPayment)
    try {
      await updateDoc(paymentRef(paymentId), updatedPayment)
    } catch (e) {
      throw new Error('Unable to update payment' + paymentId)
    }
  }

  static async delete(paymentId: string) {
    if (!isStringValid(paymentId)) throw new Error('Invalid payment.')

    let deleteOperations = []
    deleteOperations.push(deleteDoc(paymentRef(paymentId)))

    try {
      await Promise.all(deleteOperations)
    } catch (e) {
      throw new Error('Unable to delete payment ' + paymentId)
    }
  }

  private static fromFirebase(id: string, docData: any): PaymentModelInterface {
    let paymentObj: PaymentModelInterface = {
      id: id ?? '',
      name: docData.name ?? '',
      description: docData.description ?? '',
      limit_total_payment: docData.limit_total_payment ? {
        monthly: docData.limit_total_payment.monthly ?? 0,
        quarterly: docData.limit_total_payment.quarterly ?? 0,
        yearly: docData.limit_total_payment.yearly ?? 0,
      } : undefined
    }

    return paymentObj
  }
}