export interface LimitTotalPaymentModelInterface {
  monthly?: number,
  quarterly?: number,
  yearly?: number
}

export interface BankModelInterface {
  description: string
  id?: string
  name: string
  limit_total_payment?: LimitTotalPaymentModelInterface
}

export interface BillModelInterface {
  id?: string
  supplier_id: string
  user_id: string
  payment_date: Date
  total_payment: number
  payment_status: PaymentStatus
  payment_type: PaymentType
  payment_bank_id?: string
  files_ref: string[]
  meta?: TimeMetaInterface
}

export interface BillViewModelInterface extends BillModelInterface {
  payment_bank_name?: string,
  supplier_name: string,
}

export type PaymentStatus = 'paid' | 'not paid'
export type PaymentType = 'bank' | 'cash'

/**
 * Time Meta Object For Document
 */
export interface TimeMetaInterface {
  created_at: Date
  updated_at: Date
}

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'not paid']
export const PAYMENT_TYPES: PaymentType[] = ['bank', 'cash']

export interface SupplierModelInterface {
  id?: string
  name: string
  description: string
}