import React, { useState, useEffect } from "react";
import './general.css'

import { Grid, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Menu, CircularProgress, LinearProgress } from "@mui/material";
import { Error as ErrorIcon } from '@mui/icons-material';

import { PaymentModelInterface } from "../model";
import { isStringValid } from "../utils/isValid";
import { Payment } from "../model/Payment";
import { color } from "../style";

export default function PaymentPage() {


  const [modalPayment, setModalPayment] = useState<PaymentModelInterface>({
    name: "",
    description: ""
  })
  const [payments, setPayments] = useState<PaymentModelInterface[]>([])

  const [pageState, setPageState] = React.useState({
    paymentModalOpen: false,
    modalLoading: false,
    modalErrorText: '',
  });

  useEffect(() => {
    init()
  }, [])


  async function init() {
    await fetchAllPayments()
  }

  const fetchAllPayments = async () => {
    const data = await Payment.getAll()

    setPayments(() => [...data])
  }

  const handleCreatePayment = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})
      console.log('Creating Payment' + JSON.stringify(modalPayment));
      await Payment.create(modalPayment)

      await fetchAllPayments()
      handleCreatedPaymentModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }

  const handleDeletePayment = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      await Payment.delete(modalPayment.id ?? '')

      await fetchAllPayments()
      handleCreatedPaymentModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleUpdatePayment = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      if (!isStringValid(modalPayment.id)) throw new Error('Invalid Payment')
      await Payment.update(modalPayment.id!, modalPayment)

      await fetchAllPayments()
      await handleCreatedPaymentModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleCreatedPaymentModal = async (state: 'open' | 'close', paymentId?: string) => {
    if (state === 'close') {
      setPageState((state) => { return {...state, paymentModalOpen: false, modalLoading: false, modalErrorText: '' }})
      setModalPayment({ name: '', description: ''})
    }
    else {
      setPageState((state) => { return {...state, paymentModalOpen: true }})

      if (isStringValid(paymentId)) {
        const updatedPayment = await Payment.get(paymentId ?? '')

        if (updatedPayment) setModalPayment(updatedPayment)
      }
    }
  }

  const handleModalError = (error: any) => {

    let message = isStringValid(modalPayment.id) ? 'Fail to update payment. Please try again.' : 'Fail to create payment. Please try again.'
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
      <div id="payment_page_bar" className="d-flex flex-row justify-content-between mb-3">
        <div className="d-flex flex-row">
          <h2 className="me-2">Payment</h2> 
          <button className="clear-hover" onClick={() => handleCreatedPaymentModal('open')}>
            + new payment
          </button>
        </div>
      </div>
      <div id="payments_layout" className="">
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }}>
          {payments.map((payment, index) => (
            <Grid item xs={2} sm={4} md={4} key={payment.id}>
              <div className="grid-item d-flex flex-row"
                onClick={() => {
                  handleCreatedPaymentModal('open', payment.id)
                }}
              >
                <Stack className="flex-grow-1">
                  <h6 style={{borderBottom: '0.1px solid gainsboro'}}>{payment.name}</h6>
                  <p>{payment.description ?? ''}</p>
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
        open={pageState.paymentModalOpen}
        onClose={() => handleCreatedPaymentModal('close')}
        maxWidth='lg'
      >
        <DialogTitle>
          { modalPayment.id ? 'Payment Information' : 'Add new payment'}
        </DialogTitle>
        <DialogContent>
          <TextField className="mb-3" id="payment_name" label="Name" variant="standard" fullWidth
            value={modalPayment.name}
            onChange={(e) => {
              setModalPayment((o) => {
                return {
                  ...o,
                  name: e.target.value
                }
              })
            }}
          />
          <TextField className="mb-3" id="outlined-multiline-flexible" label="Description" variant="standard" multiline rows={4} fullWidth
            value={modalPayment.description}
            onChange={(e) => {
              setModalPayment((o) => {
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
          <Button sx={{color: 'grey'}} onClick={() => handleCreatedPaymentModal('close')}
            hidden={pageState.modalLoading}
            disabled={pageState.modalLoading}
          >
            Cancel
            </Button>
          {modalPayment.id ? 
            (<>
            {/* Delete payment require moving to other payment */}
              <Button
                sx={{
                  color: 'red'
                }}
                onClick={async (e) => {
                  await handleDeletePayment()
                }}
                disabled={pageState.modalLoading}
                hidden={pageState.modalLoading}
              >
                Delete
              </Button>
              
              <button
                className="btn btn-submit hover"
                onClick={async (e) => {
                  await handleUpdatePayment()
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
              await handleCreatePayment()
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