import { BankModelInterface } from "../../model"


export function mapBankToSelectOptions(banks: BankModelInterface[]): {
  bank_id: string,
  value: string,
  label: string
}[] {
  return banks.map((bank) => {

    return {
      bank_id: bank.id ?? '',
      value: bank.id ?? '',
      label: bank.name
    }
  })
}