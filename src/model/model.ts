export interface LimitTotalPaymentModelInterface {
  monthly?: number,
  quarterly?: number,
  yearly?: number
}

export interface PaymentModelInterface {
  description: string
  id?: string
  name: string
  limit_total_payment?: LimitTotalPaymentModelInterface
}

export interface BillModelInterface {
  id?: string
  supplier_id: string
  user_id: string
  outlet_id: string
  payment_date: Date
  total_payment: number
  payment_status: PaymentStatus
  payment_bank_id?: string
  files_ref: string[]
  meta?: TimeMetaInterface
}

export interface BillViewModelInterface extends BillModelInterface {
  payment_name?: string,
  supplier_name: string,
}

export type PaymentStatus = 'paid' | 'not paid'

/**
 * Time Meta Object For Document
 */
export interface TimeMetaInterface {
  created_at: Date
  updated_at: Date
}

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'not paid']

export interface SupplierModelInterface {
  id?: string
  name: string
  description: string
  category: string
}

export interface OutletModelInterface {
  id?: string
  name: string
  description: string
  default_payment_id: string
}

export interface SupplierModelMainDocInterface {
  categories: string[]
}