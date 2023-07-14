import React, { useState, useEffect, useMemo } from "react";
import './general.css'

import { Grid, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Menu, CircularProgress, LinearProgress } from "@mui/material";
import { Error as ErrorIcon } from '@mui/icons-material';
import Select from 'react-select';

import { Bank, BankModelInterface, Outlet, OutletModelInterface } from "../model";
import { isStringValid } from "../utils/isValid";
import { mapBankToSelectOptions } from "./helper/helper";

export default function OutletPage() {


  const [outlet, setOutlet] = useState<OutletModelInterface>({name: '', description: '', default_bank_id: ''})
  const [outlets, setOutlets] = useState<OutletModelInterface[]>([])

  const [banks, setBanks] = useState<BankModelInterface[]>([])

  const [pageState, setPageState] = React.useState({
    outletModalOpen: false,
    modalLoading: false,
    modalErrorText: '',
  });

  useEffect(() => {
    init()
  }, [])


  async function init() {
    await fetchAllOutlets()
    
    const banksData = await Bank.getAll()
    setBanks(() => [...banksData])
  }

  const fetchAllOutlets = async () => {
    const data = await Outlet.getAll()

    setOutlets(() => [...data])
  }

  const handleCreateOutlet = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})
      console.log('Creating Outlet' + JSON.stringify(outlet));
      await Outlet.create(outlet)

      await fetchAllOutlets()
      handleCreatedOutletModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }

  const handleDeleteOutlet = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      await Outlet.delete(outlet.id ?? '')

      await fetchAllOutlets()
      handleCreatedOutletModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleUpdateOutlet = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      if (!isStringValid(outlet.id)) throw new Error('Invalid Outlet')
      await Outlet.update(outlet.id!, outlet)

      await fetchAllOutlets()
      await handleCreatedOutletModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleCreatedOutletModal = async (state: 'open' | 'close', outletId?: string) => {
    if (state === 'close') {
      setPageState((state) => { return {...state, outletModalOpen: false, modalLoading: false, modalErrorText: '' }})
      setOutlet({ name: '', description: '', default_bank_id: ''})
    }
    else {
      setPageState((state) => { return {...state, outletModalOpen: true }})

      if (isStringValid(outletId)) {
        const updatedOutlet = await Outlet.get(outletId ?? '')

        if (updatedOutlet) setOutlet(updatedOutlet)
      }
    }
  }

  const handleModalError = (error: any) => {

    let message = isStringValid(outlet.id) ? 'Fail to update outlet' : 'Fail to create outlet'
    console.log(error);
    setPageState((o) => {

      return {
        ...o,
        modalErrorText: message
      }
    })
  }


  return (
    <div className="p-3">
      <div id="outlet_bar" className="d-flex flex-row justify-content-between mb-3">
        <div className="d-flex flex-row">
          <h2 className="me-2">Outlet</h2> 
          <button className="clear-hover" onClick={() => handleCreatedOutletModal('open')}>
            + new outlet
          </button>
        </div>
      </div>
      <div id="outlets_layout" className="">
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }}>
          {outlets.map((outletItem, index) => (
            <Grid item xs={2} sm={4} md={4} key={outletItem.id}>
              <div className="grid-item d-flex flex-row"
                onClick={() => {
                  handleCreatedOutletModal('open', outletItem.id)
                }}
              >
                <Stack className="flex-grow-1">
                  <span>{outletItem.name}</span>
                  <p>{outletItem.description}</p>
                </Stack>
                {/* <div className="flex-shrink-1">
                  <IconButton>
                    <MoreHoriz />
                  </IconButton>
                </div> */}
              </div>
            </Grid>
          ))}
        </Grid>
      </div>
      <Dialog
        open={pageState.outletModalOpen}
        onClose={() => handleCreatedOutletModal('close')}
        maxWidth='lg'
        PaperProps={{
          sx: {
            // width: "50%",
            // minHeight: "60vh"
          }
        }}
      >
        <DialogTitle>
          { outlet.id ? 'Outlet Information' : 'Add new outlet'}
        </DialogTitle>
        <DialogContent>
          <TextField className="mb-3" id="outlet_name" label="Name" variant="standard" fullWidth
            value={outlet.name}
            onChange={(e) => {
              setOutlet((o) => {
                return {
                  ...o,
                  name: e.target.value
                }
              })
            }}
          />
          <TextField className="mb-3" id="outlined-multiline-flexible" label="Description" variant="standard" multiline rows={4} fullWidth
            value={outlet.description}
            onChange={(e) => {
              setOutlet((o) => {
                return {
                  ...o,
                  description: e.target.value
                }
              })
            }}
          />
          {isStringValid(pageState.modalErrorText) && 
            <div className="error">
              <ErrorIcon className="me-1" />
              {pageState.modalErrorText}
            </div>
          }
          <div className="input-box">
          <label>Bank Payment</label>
          <Select 
            // value={banks.find(b => b.id === bill.payment_bank_id)?.name ?? ''}
            value={mapBankToSelectOptions(banks).filter(b => b.bank_id === outlet.default_bank_id)[0]}
            options={mapBankToSelectOptions(banks)}
            onChange={(option) => {
              if (option && banks.find(b => b.id === option.bank_id)) {
                setOutlet(o => {return {
                  ...o,
                  default_bank_id: option.bank_id
                }})
              }
            }}
          />
          </div>
          
        </DialogContent>
        <DialogActions>
          <Button sx={{color: 'grey'}} onClick={() => handleCreatedOutletModal('close')}
            hidden={pageState.modalLoading}
            disabled={pageState.modalLoading}
          >
            Cancel
            </Button>
          {outlet.id ? 
            (<>
              <Button
                sx={{
                  color: 'red'
                }}
                onClick={async (e) => {
                  await handleDeleteOutlet()
                }}
                disabled={pageState.modalLoading}
                hidden={pageState.modalLoading}
              >
                Delete
              </Button>
              
              <button
                className="btn btn-submit hover"
                onClick={async (e) => {
                  await handleUpdateOutlet()
                }}
                disabled={pageState.modalLoading}
                hidden={pageState.modalLoading}
              >
                Update
              </button>
            </>)
          :
          <button
            className="btn btn-submit hover"
            onClick={async (e) => {
              await handleCreateOutlet()
            }}
            disabled={pageState.modalLoading}
            hidden={pageState.modalLoading}
          >
            Create
          </button>
          }
        </DialogActions>
        {pageState.modalLoading && <LinearProgress />}
      </Dialog>

    </div>
  )
}