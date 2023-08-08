import React from "react";
import { BillViewModelInterface } from "../model";
import { Bill, Supplier } from "../model";
import { Payment } from "../model/Payment";

interface LooseObject {
  [key: string]: number
}

export async function generateReport(year: number, bills: BillViewModelInterface[], range: 'month' | 'quarter' | 'year', rangeIndex: number) {
  console.log('-----------------Generate Report', year, range, rangeIndex, 'Length: ', bills.length);
  // console.log('bills', bills);

  const suppliers = Bill.suppliers
  const payments = Bill.payments

  let report: LooseObject = {}

  report['Cash'] = 0
  report['Not paid'] = 0

  // Set ids as keys
  payments.forEach((payment) => {
    report[payment.id ?? '0'] = 0
  })

  // let bills = billsOnYear.filter((bill) => {
  //   if (range === 'month') {
  //     const date = new Date(year, rangeIndex, 1);
  //     let startDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0,0);
  //     let endDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

  //     return bill.payment_date > startDateOfMonth && bill.payment_date < endDateOfMonth
  //   } else if (range === 'quarter') {
  //     const {start: startDateOfQuarter, end: endDateOfQuarter } = getQuarterDates(year, rangeIndex)

  //     return bill.payment_date > startDateOfQuarter && bill.payment_date < endDateOfQuarter
  //   }

  //   return true
  // })


  // Caculate based on bank id or cash
  bills.forEach((bill) => {
    if (bill.payment_status === 'not paid') {
      report['Not paid'] += bill.total_payment
      return;
    }

    if (bill.payment_bank_id && Boolean(payments.find(b => b.id === bill.payment_bank_id))) {
      report[bill.payment_bank_id] += bill.total_payment
    }
    
  })

  // Get report in proper key name
  const finalReport = Object.keys(report).reduce((acc, key) => {
    if (key.toLowerCase() === 'cash') {
      acc[key] = report[key]
    }
    // if (key === 'Not paid') {
    //   acc[key] = report[key]
    // }

    const foundPayment = payments.find(b => b.id === key)
    let newKey = key
    if (foundPayment) {
      newKey = foundPayment.name;
      acc[newKey] = report[key];
    }
    
    return acc;
  }, {} as LooseObject);

  console.log('Report', finalReport);

  return finalReport
}

/**
 * 
 * @param quarterIndex in [0,1,2,3] = Q1,Q2,Q3,Q4
 * 
 * @return start and end date of quarter
 */
export function getQuarterDates(year: number, quarterIndex: number) {
  var quarterStart = new Date(year, quarterIndex * 3, 1, 0, 0, 0 ,0);
  var quarterEnd = new Date(year, quarterIndex * 3 + 3, 0, 23, 59, 59);

  return {
    start: quarterStart,
    end: quarterEnd
  };
}