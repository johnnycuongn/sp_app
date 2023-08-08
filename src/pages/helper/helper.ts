import { PaymentModelInterface } from "../../model"


export function mapPaymentToSelectOptions(payments: PaymentModelInterface[]): {
  payment_id: string,
  value: string,
  label: string
}[] {
  return payments.map((payment) => {

    return {
      payment_id: payment.id ?? '',
      value: payment.id ?? '',
      label: payment.name
    }
  })
}