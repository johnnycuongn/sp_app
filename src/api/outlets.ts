import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "../services/firebase"
import { stripEmpty } from "./converter"
import { Outlet, OutletInput } from "./types"

const outletsColRef = collection(db, "outlets")
const outletRef = (id: string) => doc(db, "outlets", id)

function fromFirestore(id: string, data: any): Outlet {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    default_payment_id: data.default_payment_id ?? "",
  }
}

export async function createOutlet(input: OutletInput): Promise<string> {
  if (!input.name?.trim()) throw new Error("Outlet name is required.")
  const newId = doc(outletsColRef).id
  await setDoc(outletRef(newId), stripEmpty(input))
  return newId
}

export async function getOutlet(id: string): Promise<Outlet | null> {
  const snap = await getDoc(outletRef(id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data())
}

export async function listOutlets(): Promise<Outlet[]> {
  const snap = await getDocs(outletsColRef)
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function updateOutlet(
  id: string,
  input: OutletInput
): Promise<void> {
  if (!id) throw new Error("Invalid outlet id.")
  const body = stripEmpty(input)
  delete (body as any).id
  await updateDoc(outletRef(id), body)
}

export async function deleteOutlet(id: string): Promise<void> {
  if (!id) throw new Error("Invalid outlet id.")
  await deleteDoc(outletRef(id))
}
