export type PaymentStatus = "paid" | "not paid"
export const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "not paid"]

export interface TimeMeta {
  created_at: Date
  updated_at: Date
}

export interface Bill {
  id: string
  supplier_id: string
  outlet_id: string
  user_id: string
  payment_date: Date
  payment_status: PaymentStatus
  payment_bank_id?: string
  total_payment: number
  files_ref: string[]
  meta?: TimeMeta
}

export type BillInput = Omit<Bill, "id">

export interface Supplier {
  id: string
  name: string
  description: string
  category: string
}
export type SupplierInput = Omit<Supplier, "id">

export interface LimitTotalPayment {
  monthly?: number
  quarterly?: number
  yearly?: number
}

export interface Payment {
  id: string
  name: string
  description: string
  limit_total_payment?: LimitTotalPayment
}
export type PaymentInput = Omit<Payment, "id">

export interface Outlet {
  id: string
  name: string
  description: string
  default_payment_id: string
}
export type OutletInput = Omit<Outlet, "id">

export interface SupplierMainDoc {
  categories: string[]
}

export enum RoleType {
  outlet_manager = "outlet_manager",
  admin = "admin",
}

export interface Role {
  type: RoleType
}

export interface UserDoc {
  role: Role
}
