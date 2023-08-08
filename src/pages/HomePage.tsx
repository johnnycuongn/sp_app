import React, { useEffect, useMemo, useState } from "react";
import './HomePage.css'
import './general.css'
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress } from "@mui/material";
import { Bill, BillModelInterface, BillViewModelInterface } from "../model";
import { getMonthsOfYear, getQuarterFor } from "../utils/date";
import { uppercaseFirst } from "../utils/string";
import { useLocation, useNavigate } from "react-router-dom";
import { isStringValid } from "../utils/isValid";
import { generateReport, getQuarterDates } from "./HomePage.report";
import { numberWithCommas } from "../utils/number";



export default function HomePage() {

  const currentDate = new Date()
  const location = useLocation()

  const [pageState, setPageState] = useState({
    reportLoading: false
  })

  /** 
   * Get: Get bills for year, do not use this on UI
   * Set: Set only when year is changed
   */
  const [billsForAYear, setBillsForAYear] = useState<BillViewModelInterface[]>([])
  const [billsForReport, setBillsForReport] = useState<BillViewModelInterface[]>([])

  const [yearSelection, setYearSelection] = useState(new Date().getFullYear())
  const [rangeSelection, setRangeSelection] = useState<RangeOption>('quarter')

  const [rangeItems, setRangeItems] = useState<string[]>(getQuarterOptions(yearSelection))
  const [selectedRangeItemIndex, setSelectedRangeItemIndex] = useState<number>(rangeItems.length-1)

  const [paymentReport, setPaymentReport] = useState<{[k: string]: number}>({})

  const navigate = useNavigate()

  useEffect(() => {
    setRangeItems(getQuarterOptions(yearSelection))
    console.log('init');
    console.log(location.state);
    init()
  }, [])

  const init = async () => {
    setPageState((s) => {return {...s, reportLoading: true}})
    await Bill._initialize()
    const data = await Bill.getBillsForYear(yearSelection)

    setBillsForAYear(data)
    console.log('Init data', data);
    await updateReport2(yearSelection, rangeSelection, selectedRangeItemIndex, data)
    setPageState((s) => {return {...s, reportLoading: false}})
  }

  /**
   * @param bills bills for current year. Usually `billsAtYear` or new updated bills
   * 
   * @Note `All @param` Don't pass in state value, unless it is not changed within same function
   */
  const updateReport2 = async (year: number, range: RangeOption, rangeItemIndex: number, bills: BillViewModelInterface[]) => {
    console.log('UpdateReport2', bills);
    setPageState((s) => {return {...s, reportLoading: true}})
    let billsUpdated = bills.filter((bill) => {
      if (range === 'month') {
        const date = new Date(year, rangeItemIndex, 1);
        let startDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0,0);
        let endDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        return bill.payment_date > startDateOfMonth && bill.payment_date < endDateOfMonth
      } else if (range === 'quarter') {
        const {start: startDateOfQuarter, end: endDateOfQuarter } = getQuarterDates(year, rangeItemIndex)
        return bill.payment_date > startDateOfQuarter && bill.payment_date < endDateOfQuarter
      }

      return true
    })

    setBillsForReport(() => [...billsUpdated])
    console.log('updateReport2 - billsUpdate', billsUpdated);
    const report = await generateReport(year, billsUpdated, range, rangeItemIndex)
    setPaymentReport(report)
    setPageState((s) => {return {...s, reportLoading: false}})
  }

  const handleYearSelectionChanged = async (selection: number) => {
    console.log('Handle year selection changed', selection);
    if (selection === yearSelection) return

    console.log('set year');

    setYearSelection(selection)

    // Default set to range to quarter
    setRangeSelection('quarter')
    const options = getQuarterOptions(selection)
    console.log('Quarter options', options);
    setRangeItems(options)
    setSelectedRangeItemIndex(options.length - 1)

    // Process
    const data = await Bill.getBillsForYear(selection)

    // setBills(data)
    setBillsForAYear([...data])
    await updateReport2(selection, 'quarter', options.length - 1, data)
  }

  const handleRangeSelectionChanged = async (selection: RangeOption) => {
    if (selection === rangeSelection) return
    setRangeSelection(selection)
    let rangeItemIndex = 0

    if (selection === 'month') {
      const options = getMonthRangeOptions(yearSelection)
      setRangeItems(options)
      rangeItemIndex = options.length - 1
    } else if (selection === 'quarter') {
      const options = getQuarterOptions(yearSelection)
      setRangeItems(options)
      rangeItemIndex = options.length - 1
    } else if (selection === 'year') {
      setRangeItems([`${yearSelection}`])
      rangeItemIndex = 0
    }

    setSelectedRangeItemIndex(rangeItemIndex)

    await updateReport2(yearSelection, selection, rangeItemIndex, billsForAYear)

  }


  const handleRangeItemSelected = async (selection: string, index: number) => {
    console.log('Handle range item selected');
    console.log(index);
    if (index === selectedRangeItemIndex) return 
    setSelectedRangeItemIndex(index)

    await updateReport2(yearSelection, rangeSelection, index, billsForAYear)
  }

  return (
    <div className="p-3">
      <h2>Bill Dashboard</h2>
      <div id="timeline-bar" className="d-flex flex-column flex-sm-row w-100">
        <div className="d-flex flex-shrink-1 me-2 mb-2">
          <div className="dropdown d-flex flex-column w-xs-50">
            <label className="dropdown">Year</label>
            <button className="btn clear-hover dropdown-toggle me-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              {yearSelection}
            </button>
            <div className="dropdown-menu">
              {getYearOptions(Bill.YEAR_INITAL).map((year) => {
                return <button className="dropdown-item" type="button" onClick={() => handleYearSelectionChanged(year)}>{year}</button>
              })}
            </div>
          </div>
          <div className="dropdown d-flex flex-column">
            <label className="dropdown">Range</label>
            <button className="btn clear-hover dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              {uppercaseFirst(rangeSelection)}
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" type="button" onClick={() => handleRangeSelectionChanged('month')}>Month</button>
              <button className="dropdown-item" type="button" onClick={() => handleRangeSelectionChanged('quarter')}>Quarter</button>
              <button className="dropdown-item" type="button" onClick={() => handleRangeSelectionChanged('year')}>Year</button>
            </div>
          </div>
        </div>
        <div className="horizontal-scrollable-container mb-2 justify-content-start align-items-end">
            {rangeItems.map((item, i) => {
              let className = "range-item"
              if (i === selectedRangeItemIndex)
                className = "range-item highlight"
              return <button className={className} onClick={() => handleRangeItemSelected(item, i)}>{item}</button>
            })}
        </div>
      </div>
      <hr />
      {pageState.reportLoading && <LinearProgress className="main-color"/>}
      <div id="information_report_container">
        <h4>{rangeItems[selectedRangeItemIndex]}</h4>
        <Stack spacing={1}>
          {Object.keys(paymentReport).map((key) => {
            return <span><b>{key}</b>: ${(paymentReport[key].toLocaleString())}</span>
          })}
        </Stack>
      </div>
      <hr />
      <div id="bills_container">
        <div id="bills_bar" className="d-flex flex-row justify-content-between ">
          <Stack direction={'row'} spacing={1} justifyContent={'center'} alignItems={'center'}>
            <h4 className="mt-2">Bills</h4>
            <button className="clear-hover" onClick={() => navigate('/bill/new')}>
              + New Bill
            </button>
          </Stack>
          <div className="d-flex flex-row">
            {/* <div className="dropdown">
              <button className="btn clear-hover dropdown-toggle me-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Payment
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
              </ul>
            </div>  
            <div className="dropdown">
              <button className="btn clear-hover dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Supplier
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
                <li><button className="dropdown-item" type="button">Dropdown item</button></li>
              </ul>
            </div> */}
          </div>
        </div>
        <div>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650, tableLayout: 'auto' }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="left">Supplier</TableCell>
                  <TableCell align="left">Payment</TableCell>
                  <TableCell align="right">Total&nbsp;($)</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billsForReport.map((bill) => (
                  <TableRow
                    key={bill.id}
                    onClick={() => {navigate(`/bill/${bill.id}/edit`)}}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" width={20}>
                      {bill.payment_date.toLocaleDateString()}
                    </TableCell>
                    <TableCell component="th" scope="row" align="left" width={200}>{bill.supplier_name}</TableCell>
                    <TableCell component="th" scope="row" align="left" width={300}>
                      {`${bill.payment_name}`}
                    </TableCell>
                    <TableCell align="right">${bill.total_payment}</TableCell>
                    <TableCell align="right">{bill.payment_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  )
}

const getMonthRangeOptions = (year: number) => getMonthsOfYear(year)
const getYearOptions = (yearInitial: number) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = [];
  
  for (let i = currentYear; i >= yearInitial; i--) {
    years.push(i);
  }

  return years
}

const getQuarterOptions = (year: number) => {
  const currentDate = new Date();
  let currentQuarter = getQuarterFor(11)

  const currentYear = currentDate.getFullYear();
  if (currentYear === year) {
    const currentMonth = currentDate.getMonth();
    currentQuarter = getQuarterFor(currentMonth)
  } else {
    currentQuarter = getQuarterFor(11)
  }
  
  const quarters = [];

  for (let i = 0; i <= currentQuarter; i++) {
    quarters.push(`${year} Q${i + 1}`);
  }

  return quarters

  console.log(quarters);
}

type RangeOption = 'month' | 'quarter' | 'year'