import { QueryDocumentSnapshot, deleteDoc, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { db, supplierRef, suppliersColRef } from "../services/firebase"
import { isStringValid } from "../utils/isValid"
import { removeEmpty } from "../utils/object"
import { SupplierModelInterface } from "./model"

export class Supplier {

  static async create(supplier: SupplierModelInterface) {
    if (!isStringValid(supplier.name)) throw new Error('Invalid Supplier Name!')

    const batch = writeBatch(db)

    let new_supplier_id = doc(suppliersColRef).id

    let postData = supplier
    delete postData.id

    batch.set(supplierRef(new_supplier_id), postData)

    await batch.commit()
  }

  static async get(supplierId: string): Promise<SupplierModelInterface | null> {
    const docSnap = await getDoc(supplierRef(supplierId))

    if (!docSnap.exists()) throw new Error('Unable to fetch supplier ' + supplierId)

    const data = docSnap.data()
    return this.fromFirebase(docSnap.id, data)
  } 

  static async getAll(): Promise<SupplierModelInterface[]> {
    const querySnapshot = await getDocs(suppliersColRef);

    let suppliersData: SupplierModelInterface[] = querySnapshot.docs.map((doc) => {
      return this.fromFirebase(doc.id, doc.data())
    })

    return suppliersData
  }

  static async update(supplierId: string, supplier: SupplierModelInterface) {
    if (!isStringValid(supplierId)) throw new Error('Invalid Supplier.')

    if (supplier.id) delete supplier.id

    const updatedSupplier = {
      ...supplier
    }

    removeEmpty(updatedSupplier)
    try {
      await updateDoc(supplierRef(supplierId), updatedSupplier)
    } catch (e) {
      throw new Error('Unable to update supplier' + supplierId)
    }
  }

  static async delete(supplierId: string) {
    if (!isStringValid(supplierId)) throw new Error('Invalid supplier.')

    let deleteOperations = []
    deleteOperations.push(deleteDoc(supplierRef(supplierId)))

    try {
      await Promise.all(deleteOperations)
    } catch (e) {
      throw new Error('Unable to delete supplier ' + supplierId)
    }
  }

  private static fromFirebase(id: string, data: any): SupplierModelInterface {
    let supplierObj: SupplierModelInterface = {
      id: id ?? '',
      name: data.name ?? '',
      description: data.description ?? ''
    }

    return supplierObj
  }
}