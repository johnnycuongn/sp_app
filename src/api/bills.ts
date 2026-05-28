import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import {
  StorageReference,
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage"
import {
  auth,
  billRef,
  billsColRef,
  storage,
  storageOneBillRef,
} from "../services/firebase"
import { sanitizeFilename, stripEmpty, toDate } from "./converter"
import { Bill, BillInput } from "./types"

function fromFirestore(id: string, data: any): Bill {
  return {
    id,
    supplier_id: data.supplier_id ?? "",
    outlet_id: data.outlet_id ?? "",
    user_id: data.user_id ?? "",
    payment_date: toDate(data.payment_date),
    payment_status: data.payment_status ?? "paid",
    payment_bank_id: data.payment_bank_id || undefined,
    total_payment: data.total_payment ?? 0,
    files_ref: (data.files_ref as string[]) ?? [],
    meta: data.meta && {
      created_at: toDate(data.meta.created_at),
      // Bug fix: previously this read created_at twice, so updated_at was wrong.
      updated_at: toDate(data.meta.updated_at ?? data.meta.created_at),
    },
  }
}

function validateBillInput(input: BillInput, opts: { requireSupplier?: boolean } = {}) {
  if (opts.requireSupplier !== false && !input.supplier_id?.trim()) {
    throw new Error("Supplier is required.")
  }
  if (!input.outlet_id?.trim()) {
    throw new Error("Outlet is required.")
  }
  if (!input.payment_bank_id?.trim()) {
    throw new Error("Payment method is required.")
  }
  if (!(input.payment_date instanceof Date) || isNaN(input.payment_date.getTime())) {
    throw new Error("Payment date is invalid.")
  }
}

async function uploadFilesForBill(
  billId: string,
  files: File[]
): Promise<{ paths: string[]; refs: StorageReference[] }> {
  const billStorage = storageOneBillRef(billId)
  const stamp = Date.now()

  // Parallel upload. If any fail, we clean up the ones that succeeded.
  const settled = await Promise.allSettled(
    files.map(async (file, i) => {
      const fileRef = ref(billStorage, `${stamp}_${i}_${sanitizeFilename(file.name)}`)
      await uploadBytes(fileRef, file)
      return fileRef
    })
  )

  const fulfilled = settled
    .filter((s): s is PromiseFulfilledResult<StorageReference> => s.status === "fulfilled")
    .map((s) => s.value)
  const failures = settled.filter((s) => s.status === "rejected")

  if (failures.length > 0) {
    await Promise.allSettled(fulfilled.map((r) => deleteObject(r)))
    const first = (failures[0] as PromiseRejectedResult).reason
    throw new Error(
      `Failed to upload ${failures.length} receipt file(s): ${
        first instanceof Error ? first.message : String(first)
      }`
    )
  }

  return { refs: fulfilled, paths: fulfilled.map((r) => r.fullPath) }
}

export async function createBill(input: BillInput, files: File[]): Promise<string> {
  validateBillInput(input)

  const userId = input.user_id?.trim() || auth.currentUser?.uid
  if (!userId) throw new Error("You must be signed in to create a bill.")

  const newId = doc(billsColRef).id

  // 1. Upload files first. If commit fails, we'll roll these back.
  const { refs: uploadedRefs, paths: filesRefPaths } = await uploadFilesForBill(
    newId,
    files
  )

  // 2. Commit doc.
  const now = new Date()
  const body = stripEmpty({
    ...input,
    user_id: userId,
    files_ref: filesRefPaths,
    meta: { created_at: now, updated_at: now },
  })
  delete (body as any).id

  try {
    await setDoc(billRef(newId), body)
  } catch (e) {
    await Promise.allSettled(uploadedRefs.map((r) => deleteObject(r)))
    throw e
  }

  return newId
}

export interface UpdateBillFiles {
  newFiles: File[]
  removedPaths: string[]
}

export async function updateBill(
  billId: string,
  input: BillInput,
  files: UpdateBillFiles
): Promise<void> {
  if (!billId) throw new Error("Invalid bill id.")
  validateBillInput(input)

  // Delete removed files first (best-effort — missing files shouldn't fail the update).
  if (files.removedPaths.length > 0) {
    await Promise.allSettled(
      files.removedPaths.map((p) => deleteObject(ref(storage, p)))
    )
  }

  // Upload any new files.
  let newPaths: string[] = []
  let newRefs: StorageReference[] = []
  if (files.newFiles.length > 0) {
    const result = await uploadFilesForBill(billId, files.newFiles)
    newPaths = result.paths
    newRefs = result.refs
  }

  const existing = (input.files_ref ?? []).filter(
    (p) => !files.removedPaths.includes(p)
  )
  const nextFilesRef = [...existing, ...newPaths]

  const now = new Date()
  const body = stripEmpty({
    ...input,
    files_ref: nextFilesRef,
    meta: {
      created_at: input.meta?.created_at ?? now,
      updated_at: now,
    },
  })
  delete (body as any).id

  try {
    await updateDoc(billRef(billId), body)
  } catch (e) {
    // Roll back newly uploaded files if the doc write failed.
    await Promise.allSettled(newRefs.map((r) => deleteObject(r)))
    throw e
  }
}

export async function getBill(id: string): Promise<Bill | null> {
  const snap = await getDoc(billRef(id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data())
}

export async function listBills(): Promise<Bill[]> {
  const snap = await getDocs(
    query(billsColRef, orderBy("payment_date", "desc"))
  )
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function listBillsForYear(year: number): Promise<Bill[]> {
  const start = new Date(year, 0, 1, 0, 0, 0, 0)
  const end = new Date(year, 11, 31, 23, 59, 59, 999)
  const snap = await getDocs(
    query(
      billsColRef,
      where("payment_date", ">=", start),
      where("payment_date", "<=", end),
      orderBy("payment_date", "desc")
    )
  )
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function listBillsForSupplier(supplierId: string): Promise<Bill[]> {
  if (!supplierId) throw new Error("Invalid supplier id.")
  const snap = await getDocs(
    query(billsColRef, where("supplier_id", "==", supplierId))
  )
  return snap.docs.map((d) => fromFirestore(d.id, d.data()))
}

export async function deleteBill(id: string): Promise<void> {
  if (!id) throw new Error("Invalid bill id.")

  // Try to delete attached files first (best-effort).
  try {
    const list = await listAll(storageOneBillRef(id))
    await Promise.allSettled(list.items.map((f) => deleteObject(f)))
  } catch {
    // Ignore — storage may be empty or rules may not let us list.
  }

  await deleteDoc(billRef(id))
}

/** Returns download URLs for every file attached to the bill (in stored order). */
export async function getBillFileUrls(bill: Pick<Bill, "files_ref">): Promise<string[]> {
  if (!bill.files_ref?.length) return []
  return Promise.all(bill.files_ref.map((p) => getDownloadURL(ref(storage, p))))
}

/** Year of the earliest bill in the system, or current year if none exist. */
export async function getEarliestBillYear(): Promise<number> {
  const snap = await getDocs(
    query(
      billsColRef,
      where("payment_date", "<=", new Date()),
      orderBy("payment_date", "asc"),
      limit(1)
    )
  )
  if (snap.empty) return new Date().getFullYear()
  return toDate(snap.docs[0].data().payment_date).getFullYear()
}
