import React, { useState, useEffect } from "react";
import './general.css'

import { Grid, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Menu, CircularProgress, LinearProgress } from "@mui/material";
import { Error as ErrorIcon } from '@mui/icons-material';

import { Supplier, SupplierModelInterface } from "../model";
import { isStringValid } from "../utils/isValid";

export default function SupplierPage() {


  const [supplier, setSupplier] = useState<SupplierModelInterface>({name: '', description: ''})
  const [suppliers, setSuppliers] = useState<SupplierModelInterface[]>([])

  const [pageState, setPageState] = React.useState({
    supplierModalOpen: false,
    modalLoading: false,
    modalErrorText: '',
  });

  useEffect(() => {
    init()
  }, [])


  async function init() {
    await getAllSuppliers()
  }

  const getAllSuppliers = async () => {
    const data = await Supplier.getAll()

    setSuppliers(() => [...data])
  }

  const handleCreateSupplier = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})
      console.log('Creating Supplier' + JSON.stringify(supplier));
      await Supplier.create(supplier)

      await getAllSuppliers()
      handleCreatedSupplierModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }

  const handleDeleteSupplier = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      await Supplier.delete(supplier.id ?? '')

      await getAllSuppliers()
      handleCreatedSupplierModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleUpdateSupplier = async () => {
    try {
      setPageState(o => {return {...o, modalLoading: true }})

      if (!isStringValid(supplier.id)) throw new Error('Invalid Supplier')
      await Supplier.update(supplier.id!, supplier)

      await getAllSuppliers()
      await handleCreatedSupplierModal('close')
    } catch (e) {
      handleModalError(e)
    } finally {
      setPageState(o => {return {...o, modalLoading: false }})
    }
  }


  const handleCreatedSupplierModal = async (state: 'open' | 'close', supplierId?: string) => {
    if (state === 'close') {
      setPageState((state) => { return {...state, supplierModalOpen: false, modalLoading: false, modalErrorText: '' }})
      setSupplier({ name: '', description: ''})
    }
    else {
      setPageState((state) => { return {...state, supplierModalOpen: true }})

      if (isStringValid(supplierId)) {
        const updatedSupplier = await Supplier.get(supplierId ?? '')

        if (updatedSupplier) setSupplier(updatedSupplier)
      }
    }
  }

  const handleModalError = (error: any) => {

    let message = isStringValid(supplier.id) ? 'Fail to update supplier' : 'Fail to create supplier'
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
      <div id="supplier_bar" className="d-flex flex-row justify-content-between mb-3">
        <div className="d-flex flex-row">
          <h2 className="me-2">Supplier</h2> 
          <button className="clear-hover" onClick={() => handleCreatedSupplierModal('open')}>
            + new supplier
          </button>
        </div>
      </div>
      <div id="suppliers_layout" className="">
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }}>
          {suppliers.map((supplierItem, index) => (
            <Grid item xs={2} sm={4} md={4} key={supplierItem.id}>
              <div className="grid-item d-flex flex-row"
                onClick={() => {
                  handleCreatedSupplierModal('open', supplierItem.id)
                }}
              >
                <Stack className="flex-grow-1">
                  <span>{supplierItem.name}</span>
                  <p>{supplierItem.description}</p>
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
        open={pageState.supplierModalOpen}
        onClose={() => handleCreatedSupplierModal('close')}
        maxWidth='lg'
      >
        <DialogTitle>
          { supplier.id ? 'Supplier Information' : 'Add new supplier'}
        </DialogTitle>
        <DialogContent>
          <TextField className="mb-3" id="supplier_name" label="Name" variant="standard" fullWidth
            value={supplier.name}
            onChange={(e) => {
              setSupplier((o) => {
                return {
                  ...o,
                  name: e.target.value
                }
              })
            }}
          />
          <TextField className="mb-3" id="outlined-multiline-flexible" label="Description" variant="standard" multiline rows={4} fullWidth
            value={supplier.description}
            onChange={(e) => {
              setSupplier((o) => {
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
          <Button sx={{color: 'grey'}} onClick={() => handleCreatedSupplierModal('close')}
            hidden={pageState.modalLoading}
            disabled={pageState.modalLoading}
          >
            Cancel
            </Button>
          {supplier.id ? 
            (<>
              <Button
                sx={{
                  color: 'red'
                }}
                onClick={async (e) => {
                  await handleDeleteSupplier()
                }}
                disabled={pageState.modalLoading}
                hidden={pageState.modalLoading}
              >
                Delete
              </Button>
              
              <button
                className="btn btn-submit hover"
                onClick={async (e) => {
                  await handleUpdateSupplier()
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
              await handleCreateSupplier()
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