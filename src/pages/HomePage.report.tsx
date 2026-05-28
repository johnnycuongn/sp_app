import { Bill, Payment } from "../api"

export type RangeKind = "month" | "quarter" | "year"

export interface RangeWindow {
  start: Date
  end: Date
  label: string
}

/** Returns the quarter index (0–3) for a 0–11 month index. */
export function quarterIndexFor(monthIndex: number): number {
  return Math.floor(monthIndex / 3)
}

/** Inclusive start/end dates for the given quarter (quarterIndex 0–3). */
export function quarterDates(year: number, quarterIndex: number): RangeWindow {
  const start = new Date(year, quarterIndex * 3, 1, 0, 0, 0, 0)
  const end = new Date(year, quarterIndex * 3 + 3, 0, 23, 59, 59, 999)
  return { start, end, label: `${year} Q${quarterIndex + 1}` }
}

/** Inclusive start/end dates for the given month. */
export function monthDates(year: number, monthIndex: number): RangeWindow {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  const label = start.toLocaleString("default", { month: "long" })
  return { start, end, label }
}

export function yearDates(year: number): RangeWindow {
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
    label: `${year}`,
  }
}

/**
 * Range options to show for a given year + kind, capped at the current period
 * if the selected year is the current year (so we don't show future months/quarters).
 */
export function rangeOptionsFor(year: number, kind: RangeKind): RangeWindow[] {
  const now = new Date()
  const isCurrentYear = year === now.getFullYear()

  if (kind === "year") return [yearDates(year)]
  if (kind === "month") {
    const lastMonth = isCurrentYear ? now.getMonth() : 11
    return Array.from({ length: lastMonth + 1 }, (_, i) => monthDates(year, i))
  }
  // quarter
  const lastQuarter = isCurrentYear ? quarterIndexFor(now.getMonth()) : 3
  return Array.from({ length: lastQuarter + 1 }, (_, i) => quarterDates(year, i))
}

export function filterBillsInRange(bills: Bill[], window: RangeWindow): Bill[] {
  return bills.filter(
    (b) => b.payment_date >= window.start && b.payment_date <= window.end
  )
}

export interface PaymentBreakdownRow {
  /** Display label (payment method name, or "Cash" / "Not paid"). */
  label: string
  total: number
}

/**
 * Sum of bill totals grouped by payment method. Unpaid bills land in "Not paid";
 * paid bills with no matching payment method are dropped.
 */
export function paymentBreakdown(
  bills: Bill[],
  payments: Payment[]
): PaymentBreakdownRow[] {
  const byPaymentId = new Map<string, number>()
  let notPaid = 0

  for (const bill of bills) {
    if (bill.payment_status === "not paid") {
      notPaid += bill.total_payment
      continue
    }
    if (!bill.payment_bank_id) continue
    byPaymentId.set(
      bill.payment_bank_id,
      (byPaymentId.get(bill.payment_bank_id) ?? 0) + bill.total_payment
    )
  }

  const rows: PaymentBreakdownRow[] = []
  Array.from(byPaymentId.entries()).forEach(([id, total]) => {
    const payment = payments.find((p) => p.id === id)
    if (!payment) return
    rows.push({ label: payment.name, total })
  })
  if (notPaid > 0) rows.push({ label: "Not paid", total: notPaid })

  return rows.sort((a, b) => b.total - a.total)
}

/** Sum of all bills in the given list. */
export function totalSum(bills: Bill[]): number {
  return bills.reduce((acc, b) => acc + b.total_payment, 0)
}
