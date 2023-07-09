import { deleteDoc, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { bankRef, banksColRef, db } from "../services/firebase"
import { isStringValid } from "../utils/isValid"
import { removeEmpty } from "../utils/object"
import { BankModelInterface } from "./model"

export class Bank {

  static async create(bank: BankModelInterface) {
    const batch = writeBatch(db)

    let new_bank_id = doc(banksColRef).id

    let postData = bank
    delete postData.id

    batch.set(bankRef(new_bank_id), postData)

    await batch.commit()
  }

  static async get(id: string): Promise<BankModelInterface | null> {
    const docSnap = await getDoc(bankRef(id))

    if (!docSnap.exists()) throw new Error('Unable to fetch Bank ' + id)
    const data = docSnap.data()
    return this.fromFirebase(docSnap.id, data)
  }

  static async getAll(): Promise<BankModelInterface[]> {
    const querySnapshot = await getDocs(banksColRef)

    let banksData: BankModelInterface[] = querySnapshot.docs.map(doc => {
      return this.fromFirebase(doc.id, doc.data())
    })

    return banksData
  }

  static async update(bankId: string, bank: BankModelInterface) {
    if (!isStringValid(bankId)) throw new Error('Invalid bank.')

    if (bank.id) delete bank.id

    const updatedBank = {
      ...bank
    }

    removeEmpty(updatedBank)
    try {
      await updateDoc(bankRef(bankId), updatedBank)
    } catch (e) {
      throw new Error('Unable to update bank' + bankId)
    }
  }

  static async delete(bankId: string) {
    if (!isStringValid(bankId)) throw new Error('Invalid bank.')

    let deleteOperations = []
    deleteOperations.push(deleteDoc(bankRef(bankId)))

    try {
      await Promise.all(deleteOperations)
    } catch (e) {
      throw new Error('Unable to delete bank ' + bankId)
    }
  }

  private static fromFirebase(id: string, docData: any): BankModelInterface {
    let bankObj: BankModelInterface = {
      id: id ?? '',
      name: docData.name ?? '',
      description: docData.description ?? '',
      limit_total_payment: docData.limit_total_payment ? {
        monthly: docData.limit_total_payment.monthly ?? 0,
        quarterly: docData.limit_total_payment.quarterly ?? 0,
        yearly: docData.limit_total_payment.yearly ?? 0,
      } : undefined
    }

    return bankObj
  }
}