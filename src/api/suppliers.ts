import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import {
  db,
  supplierRef,
  suppliersColRef,
} from "../services/firebase"
import { stripEmpty } from "./converter"
import {
  Supplier,
  SupplierInput,
  SupplierMainDoc,
} from "./types"

function fromFirestore(id: string, data: any): Supplier {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    category: data.category ?? "",
  }
}

export async function createSupplier(input: SupplierInput): Promise<string> {
  if (!input.name?.trim()) throw new Error("Supplier name is required.")

  const newId = doc(suppliersColRef).id
  await setDoc(supplierRef(newId), stripEmpty(input))
  return newId
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const snap = await getDoc(supplierRef(id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data())
}

export async function listSuppliers(): Promise<Supplier[]> {
  const snap = await getDocs(suppliersColRef)
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function updateSupplier(
  id: string,
  input: SupplierInput
): Promise<void> {
  if (!id) throw new Error("Invalid supplier id.")
  const body = stripEmpty(input)
  delete (body as any).id
  await updateDoc(supplierRef(id), body)
}

export async function deleteSupplier(id: string): Promise<void> {
  if (!id) throw new Error("Invalid supplier id.")
  await deleteDoc(supplierRef(id))
}

// --- Shared "categories" doc ---
const SUPPLIER_MAIN_ID = "_MAIN_SUPPLIER"
const supplierMainRef = doc(db, "suppliers_data", SUPPLIER_MAIN_ID)

export async function getSupplierMain(): Promise<SupplierMainDoc> {
  const snap = await getDoc(supplierMainRef)
  if (!snap.exists()) {
    const empty: SupplierMainDoc = { categories: [] }
    await setDoc(supplierMainRef, empty)
    return empty
  }
  return { categories: snap.data().categories ?? [] }
}

export async function listSupplierCategories(): Promise<string[]> {
  return (await getSupplierMain()).categories
}

export async function updateSupplierCategories(
  categories: string[]
): Promise<void> {
  await updateDoc(supplierMainRef, { categories })
}
