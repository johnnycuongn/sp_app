import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FilledInput, FormControl, InputLabel, TextField, InputAdornment, Stack, Grid, Select as MUISelect, MenuItem, LinearProgress, Menu } from "@mui/material";
import Select from 'react-select'
import './NewBillPage.css'
import { Error as ErrorIcon } from '@mui/icons-material';

import { BankModelInterface, Bill, BillModelInterface, Outlet, OutletModelInterface, PAYMENT_STATUSES, PaymentStatus, SupplierModelInterface } from "../model";
import { isNumeric, isStringValid } from "../utils/isValid";
import { uppercaseFirst } from "../utils/string";
import { mapBankToSelectOptions } from "./helper/helper";


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
  const [banks, setBanks] = useState<BankModelInterface[]>([])
  const [outlets, setOutlets] = useState<OutletModelInterface[]>([])

  const [selectedFilesContent, setSelectedFilesContent] = useState<(string)[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { id } = useParams()

  const isBillAddable: boolean = useMemo(() => {
    const isSupplierValid = isStringValid(bill.supplier_id)
    const isBankValid = isStringValid(bill.payment_bank_id)

    if (isSupplierValid && !isNaN(bill.total_payment) && bill.total_payment !== 0) {
      if (isBankValid) return true
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
    await Bill._initialize()
    // get all suppliers
    const supplierData = Bill.suppliers
    setSuppliers(() => [...supplierData])

    // get all banks
    const banksData = await Bill.banks
    setBanks(() => [...banksData])

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
    setPageState(o => {return {...o, loading: true}})

    // Validate bill
    console.log('Submitting bill');
    console.log(JSON.stringify(bill));
    console.log('Files', selectedFilesContent);

    const uploadFiles = selectedFile ? [selectedFile] : []

    try {
      if (isUpdating) {
        await Bill.update(id!, bill, uploadFiles)
      }
      else {
        await Bill.create(bill, uploadFiles)
      }
      console.log('Going to submit', location.state);
      navigate('/', {state: location.state})
    } catch (e) {
      setPageState(o => {
        return {...o, errorText: 'Failed to submit bill'}
      })
    } finally {
      setPageState(o => {return {...o, loading: false}})
    }
  }

  const handleDeleteBill = async () => {
    setPageState(o => {
      return {...o, errorText: ''}
    })
    setPageState(o => {return {...o, loading: true}})

    try {
      await Bill.delete(id!)
      navigate(-1)
    } catch (e) {
      setPageState(o => {
        return {...o, errorText: 'Unable to delete bill'}
      })
    } finally {
      setPageState(o => {return {...o, loading: false}})
    }
  }

  return (
  <div className="p-3">
    <h2>{isUpdating ? 'Updating Bill' :'New Bill'}</h2>
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
        isDisabled={isUpdating && Boolean(suppliers.find((s => s.id === bill.supplier_id)))}
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
        isDisabled={isUpdating && Boolean(outlets.find((s => s.id === bill.outlet_id)))}
        value={mapOutletsToSelectOptions(outlets).filter(option => option.outlet_id === bill.outlet_id)[0]} 
        options={mapOutletsToSelectOptions(outlets)} 
        onChange={(option) => {
          
          if (option && outlets.find(el => el.id === option.outlet_id) ) {
            const outlet = outlets.find(el => el.id === option.outlet_id)!
            setBill(o => {return {...o, outlet_id: option.outlet_id}}) 

            if (outlet.default_bank_id) {
              setBill(o => {return {...o, payment_bank_id: outlet.default_bank_id}})
            }
            
          }
        }} 
      />
    </div>
    {
      <div className="input-box">
        <label>Bank Payment</label>
        <Select 
          // value={banks.find(b => b.id === bill.payment_bank_id)?.name ?? ''}
          value={mapBankToSelectOptions(banks).filter(b => b.bank_id === bill.payment_bank_id)[0]}
          options={mapBankToSelectOptions(banks)}
          onChange={(option) => {
            if (option && banks.find(b => b.id === option.bank_id)) {
              setBill(o => {return {
                ...o,
                payment_bank_id: option.bank_id
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
      <label>Images</label>  
      <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef}/>
      {selectedFilesContent.length !== 0 && <button className="" onClick={handleFileRemove}>Remove File</button>}
    </div>

    {selectedFilesContent.length !== 0 && 
      <img className="img-fluid p-2" src={selectedFilesContent[0]!}  alt="Attachment"/>
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
      {isUpdating ? 'Updating' : 'Add'} bill for {suppliers.find(s => s.id === bill.supplier_id)?.name}
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