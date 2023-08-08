import React, { useState, useEffect } from "react";
import './general.css'

import { Grid, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Menu, CircularProgress, LinearProgress } from "@mui/material";
import { Error as ErrorIcon } from '@mui/icons-material';

import { BankModelInterface } from "../model";
import { isStringValid } from "../utils/isValid";
import { Bank } from "../model/Bank";
import { color } from "../style";

export default function PaymentPage() {


  const [modalBank, setModalBank] = useState<BankModelInterface>({
    name: "",
    description: ""
  })
  const [banks, setBanks] = useState<BankModelInterface[]>([])

  const [pageState, setPageState] = React.useState({
    bankModalOpen: false,
    modalLoading: false,
    modalErrorText: '',
  });

  useEffect(() => {
    init()
  }, [])


  async function init() {
    await fetchAllBanks()
  }

  const fetchAllBanks = async () => {
    const data = await Bank.getAll()

    setBanks(() => [...data])
  }

  const handleCreateBank = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})
      console.log('Creating Bank' + JSON.stringify(modalBank));
      await Bank.create(modalBank)

      await fetchAllBanks()
      handleCreatedBankModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }

  const handleDeleteBank = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      await Bank.delete(modalBank.id ?? '')

      await fetchAllBanks()
      handleCreatedBankModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleUpdateBank = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      if (!isStringValid(modalBank.id)) throw new Error('Invalid Bank')
      await Bank.update(modalBank.id!, modalBank)

      await fetchAllBanks()
      await handleCreatedBankModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleCreatedBankModal = async (state: 'open' | 'close', bankId?: string) => {
    if (state === 'close') {
      setPageState((state) => { return {...state, bankModalOpen: false, modalLoading: false, modalErrorText: '' }})
      setModalBank({ name: '', description: ''})
    }
    else {
      setPageState((state) => { return {...state, bankModalOpen: true }})

      if (isStringValid(bankId)) {
        const updatedBank = await Bank.get(bankId ?? '')

        if (updatedBank) setModalBank(updatedBank)
      }
    }
  }

  const handleModalError = (error: any) => {

    let message = isStringValid(modalBank.id) ? 'Fail to update bank' : 'Fail to create bank'
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
      <div id="bank_page_bar" className="d-flex flex-row justify-content-between mb-3">
        <div className="d-flex flex-row">
          <h2 className="me-2">Bank</h2> 
          <button className="clear-hover" onClick={() => handleCreatedBankModal('open')}>
            + new bank
          </button>
        </div>
      </div>
      <div id="banks_layout" className="">
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }}>
          {banks.map((bank, index) => (
            <Grid item xs={2} sm={4} md={4} key={bank.id}>
              <div className="grid-item d-flex flex-row"
                onClick={() => {
                  handleCreatedBankModal('open', bank.id)
                }}
              >
                <Stack className="flex-grow-1">
                  <h6 style={{borderBottom: '0.1px solid gainsboro'}}>{bank.name}</h6>
                  <p>{bank.description ?? ''}</p>
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
        open={pageState.bankModalOpen}
        onClose={() => handleCreatedBankModal('close')}
        maxWidth='lg'
      >
        <DialogTitle>
          { modalBank.id ? 'Bank Information' : 'Add new bank'}
        </DialogTitle>
        <DialogContent>
          <TextField className="mb-3" id="bank_name" label="Name" variant="standard" fullWidth
            value={modalBank.name}
            onChange={(e) => {
              setModalBank((o) => {
                return {
                  ...o,
                  name: e.target.value
                }
              })
            }}
          />
          <TextField className="mb-3" id="outlined-multiline-flexible" label="Description" variant="standard" multiline rows={4} fullWidth
            value={modalBank.description}
            onChange={(e) => {
              setModalBank((o) => {
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
          
        </DialogContent>
        <DialogActions>
          <Button sx={{color: 'grey'}} onClick={() => handleCreatedBankModal('close')}
            hidden={pageState.modalLoading}
            disabled={pageState.modalLoading}
          >
            Cancel
            </Button>
          {modalBank.id ? 
            (<>
            {/* Delete bank require moving to other bank */}
              <Button
                sx={{
                  color: 'red'
                }}
                onClick={async (e) => {
                  await handleDeleteBank()
                }}
                disabled={pageState.modalLoading}
                hidden={pageState.modalLoading}
              >
                Delete
              </Button>
              
              <button
                className="btn btn-submit hover"
                onClick={async (e) => {
                  await handleUpdateBank()
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
              await handleCreateBank()
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