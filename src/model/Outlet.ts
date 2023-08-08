import { QueryDocumentSnapshot, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { db, supplierRef, suppliersColRef } from "../services/firebase"
import { isStringValid } from "../utils/isValid"
import { removeEmpty } from "../utils/object"
import { OutletModelInterface  } from "./model"

export class Outlet {

  private static docRef(id: string) {
    return doc(db, 'outlets', id)
  }

  private static colRef = collection(db, 'outlets')

  static async create(outlet: OutletModelInterface) {
    if (!isStringValid(outlet.name)) throw new Error('Invalid Outlet Name!')

    const batch = writeBatch(db)

    let new_outlet_id = doc(this.colRef).id

    let postData = outlet
    delete postData.id

    batch.set(this.docRef(new_outlet_id), postData)

    await batch.commit()
  }

  static async get(outletId: string): Promise<OutletModelInterface | null> {
    const docSnap = await getDoc(this.docRef(outletId))

    if (!docSnap.exists()) throw new Error('Unable to fetch outlet ' + outletId)

    const data = docSnap.data()
    return this.fromFirebase(docSnap.id, data)
  } 

  static async getAll(): Promise<OutletModelInterface[]> {
    const querySnapshot = await getDocs(this.colRef);

    let outletsData: OutletModelInterface[] = querySnapshot.docs.map((doc) => {
      return this.fromFirebase(doc.id, doc.data())
    })

    return outletsData
  }

  static async update(outletId: string, updatedOutlet: OutletModelInterface) {
    if (!isStringValid(outletId)) throw new Error('Invalid Outlet.')

    if (updatedOutlet.id) delete updatedOutlet.id

    const postData = {
      ...updatedOutlet
    }

    console.log('Updated outlet', postData);

    removeEmpty(postData)
    try {
      await updateDoc(this.docRef(outletId), postData)
    } catch (e) {
      throw new Error('Unable to update outlet' + outletId)
    }
  }

  static async delete(outletId: string) {
    if (!isStringValid(outletId)) throw new Error('Invalid outlet.')

    let deleteOperations = []
    deleteOperations.push(deleteDoc(this.docRef(outletId)))

    try {
      await Promise.all(deleteOperations)
    } catch (e) {
      throw new Error('Unable to delete outlet ' + outletId)
    }
  }

  private static fromFirebase(id: string, data: any): OutletModelInterface {
    let OutletObj: OutletModelInterface = {
      id: id ?? '',
      name: data.name ?? '',
      description: data.description ?? '',
      default_payment_id: data.default_payment_id ?? ''
    }

    return OutletObj
  }
}