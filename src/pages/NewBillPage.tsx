import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FilledInput, FormControl, InputLabel, TextField, InputAdornment, Stack, Grid, Select as MUISelect, MenuItem, LinearProgress, Menu } from "@mui/material";
import Select from 'react-select'
import './NewBillPage.css'
import { Error as ErrorIcon } from '@mui/icons-material';

import { PaymentModelInterface, Bill, BillModelInterface, Outlet, OutletModelInterface, PAYMENT_STATUSES, PaymentStatus, SupplierModelInterface } from "../model";
import { isNumeric, isStringValid } from "../utils/isValid";
import { uppercaseFirst } from "../utils/string";
import { mapPaymentToSelectOptions } from "./helper/helper";


export default function NewBillPage() {

  const location = useLocation()

  const [pageState, setPageState] = useState({
    loading: false,
    errorText: ''
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate()

  const [bill, setBill] = useState<BillModelInterface>({
    id: '',
    supplier_id: '',
    user_id: '',
    outlet_id: '',
    payment_date: new Date(),
    total_payment: 0,
    payment_status: 'paid',
    payment_bank_id: '',
    files_ref: []
  })

  const [suppliers, setSuppliers] = useState<SupplierModelInterface[]>([])
  const [payments, setPayments] = useState<PaymentModelInterface[]>([])
  const [outlets, setOutlets] = useState<OutletModelInterface[]>([])

  const [selectedFilesContent, setSelectedFilesContent] = useState<(string)[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { id } = useParams()

  const isBillAddable: boolean = useMemo(() => {
    const isSupplierValid = isStringValid(bill.supplier_id)
    const isPaymentValid = isStringValid(bill.payment_bank_id)

    if (isSupplierValid && !isNaN(bill.total_payment) && bill.total_payment !== 0) {
      if (isPaymentValid) return true
      else return false
    }

    return false
  }, [bill.supplier_id, bill.payment_bank_id, bill.total_payment])


  const isUpdating: boolean = useMemo(() => {
    return isStringValid(id)
  }, [id])

  useEffect(() => {
    init()
    console.log('Run once new bill page');
    console.log(location.state);
  }, [])

  async function init() {
    setPageLoading(true)
    await Bill._initialize()
    // get all suppliers
    const supplierData = Bill.suppliers
    setSuppliers(() => [...supplierData])

    // get all payments
    const paymentsData = await Bill.payments
    setPayments(() => [...paymentsData])

    const outletData = await Outlet.getAll()
    setOutlets(() => [...outletData])

    if (isUpdating) {
      const updatingBill = await Bill.get(id!)

      if (updatingBill) {
        setBill(updatingBill)

        const urls = await Bill.downloadFiles(updatingBill)
        console.log('Files', urls);
        setSelectedFilesContent(urls)
      }

    }
    setPageLoading(false)
  }

  /**
   * @dateString {string} dd-mm-yyyy from date input 
   */
  const handlDateChanged = (dateString: string) => {
    const date = new Date(dateString)
    console.log(date);
    setBill(o => {return {
      ...o,
      payment_date: date
    }})
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return

    const file = event.target.files[0];

    console.log('File Changed');
    console.log(file);

    setSelectedFile(file)

    // Render on page
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target) return
      const contents = event.target.result as string;

      let array: string[] = []

      array.push(contents)

      setSelectedFilesContent(array)
    };
    reader.readAsDataURL(file);
  }

  const handleFileRemove = async () => {
    setSelectedFilesContent([])
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }


  const handleSubmitBill = async () => {
    setPageState(o => {
      return {...o, errorText: ''}
    })
    setPageLoading(true)

    // Validate bill
    console.log('Submitting bill');
    console.log(JSON.stringify(bill));
    console.log('Files', selectedFilesContent);

    const uploadFiles = selectedFile ? [selectedFile] : []

    try {
      if (isUpdating) {
        await Bill.update(id!, bill, uploadFiles, selectedFilesContent.length === 0)
      }
      else {
        await Bill.create(bill, uploadFiles)
      }
      console.log('Going to submit', location.state);
      navigate('/', {state: location.state})
    } catch (e) {
      let message = ''
      if (e instanceof Error) message = e.message
      else message = String(e)
      setPageState(o => {
        return {...o, errorText: message}
      })
    } finally {
      setPageLoading(false)
    }
  }

  const handleDeleteBill = async () => {
    setPageState(o => {
      return {...o, errorText: ''}
    })
    setPageLoading(true)

    try {
      await Bill.delete(id!)
      navigate(-1)
    } catch (e) {
      setPageState(o => {
        return {...o, errorText: 'Fail to delete bill'}
      })
    } finally {
      setPageLoading(false)
    }
  }

  const setPageLoading = (loading: boolean) => {
    setPageState(o => {return {...o, loading: loading}})
  }

  return (
  <div className="p-3">
    {<h2>{isUpdating ? 'Updating Bill' :'New Bill'}</h2>}
    <div className="input-box">
      <label className="me-2">Payment Date</label>
      <input type="date" name="" id="" 
        defaultValue={new Date().toISOString().substring(0,10)}
        value={bill.payment_date.toISOString().substring(0,10)}
        onChange={(e) => {
          handlDateChanged(e.target.value);
        }}
      />
    </div>
    <div className="input-box">
      <label>Supplier</label>
      <Select className="select"
        isDisabled={pageState.loading}
        value={mapSuppliersToSelectOptions(suppliers).filter(option => option.supplier_id === bill.supplier_id)[0]} 
        options={mapSuppliersToSelectOptions(suppliers)} onChange={(option) => {
          if (option && suppliers.find(el => el.id === option.supplier_id)) {
            setBill(o => {return {...o, supplier_id: option.supplier_id}})
          }
        }} 
      />
    </div>
    <div className="input-box">
      <label>Outlet</label>
      <Select className="select"
        isDisabled={pageState.loading}
        value={mapOutletsToSelectOptions(outlets).filter(option => option.outlet_id === bill.outlet_id)[0]} 
        options={mapOutletsToSelectOptions(outlets)} 
        onChange={(option) => {
          
          if (option && outlets.find(el => el.id === option.outlet_id) ) {
            const outlet = outlets.find(el => el.id === option.outlet_id)!
            setBill(o => {return {...o, outlet_id: option.outlet_id}}) 

            if (outlet.default_payment_id) {
              setBill(o => {return {...o, payment_bank_id: outlet.default_payment_id}})
            }
            
          }
        }} 
      />
    </div>
    {
      <div className="input-box">
        <label>Payment</label>
        <Select 
          isDisabled={pageState.loading}
          value={mapPaymentToSelectOptions(payments).filter(b => b.payment_id === bill.payment_bank_id)[0]}
          options={mapPaymentToSelectOptions(payments)}
          onChange={(option) => {
            if (option && payments.find(b => b.id === option.payment_id)) {
              setBill(o => {return {
                ...o,
                payment_bank_id: option.payment_id
              }})
            }
          }}
        />
      </div>
    }
    <div className="input-box">
      <label>Payment Amount</label>
      <TextField
        id="standard-start-adornment"
        sx={{ m: 1, width: '25ch' }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        variant="standard"
        type="number"
        value={bill.total_payment}
        onChange={(e) => {
          setBill(o => {return {...o, total_payment: parseFloat(e.target.value)}})
        }}
      />
    </div>
    <div className="input-box">
      <label>Payment Status</label>
      <MUISelect
        defaultValue={'paid'}
        label='Status'
        value={bill.payment_status}
        onChange={(e) => {
          if (e.target.value) {
            setBill(o => {return {...o, payment_status: e.target.value as PaymentStatus}})
          }
        }}
        size="small"
      >
        {PAYMENT_STATUSES.map((status) => {
          return <MenuItem value={status}>{uppercaseFirst(status.toString())}</MenuItem>
        })}
      </MUISelect>
    </div>

    <div className="input-box">
      <label>Files</label>  
      {selectedFilesContent.length === 0 && <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef}/>}
      {selectedFilesContent.length !== 0 && <button className="btn btn-secondary" onClick={handleFileRemove}>Remove File</button>}
    </div>

    {selectedFilesContent.length !== 0 && 
      <img style={{border: '1px solid gainsboro'}} className="img-fluid p-2" src={selectedFilesContent[0]!}  alt="Attachment"/>
    }
    <hr />
    {isStringValid(pageState.errorText) && 
      <div className="error">
        <ErrorIcon className="me-1" />
        {pageState.errorText}
      </div>
    }
    <button className="btn btn-submit hover w-100 mt-2"
      disabled={pageState.loading || !isBillAddable}
      hidden={pageState.loading}
      onClick={async () => {
        await handleSubmitBill()
      }}
    >
      {isUpdating ? 'Update' : 'Add'} bill for {suppliers.find(s => s.id === bill.supplier_id)?.name}
    </button>
    {isUpdating && 
      <button className="btn btn-delete mt-2"
        disabled={pageState.loading}
        hidden={pageState.loading}
        onClick={async () => {
          await handleDeleteBill()
        }}
      >
        Delete
      </button>}
    {pageState.loading && <LinearProgress className="main-color" />}
  </div>)
}

function mapOutletsToSelectOptions(outlets: OutletModelInterface[]): {
  outlet_id: string,
  value: string,
  label: string
}[] {
  return outlets.map((outlet) => {
    return {
      outlet_id: outlet.id ?? '',
      value: outlet.id ?? '',
      label: outlet.name
    }
  })
}

function mapSuppliersToSelectOptions(suppliers: SupplierModelInterface[]): {
  supplier_id: string,
  value: string,
  label: string
}[] {
  return suppliers.map((supplier) => {

    return {
      supplier_id: supplier.id ?? '',
      value: supplier.id ?? '',
      label: supplier.name
    }
  })
}