import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { Add as AddIcon } from "@mui/icons-material"

import { Supplier, SupplierInput, createSupplier, deleteSupplier, getSupplier, listSuppliers, updateSupplier, useLookups } from "../api"

const emptySupplier: SupplierInput = { name: "", description: "", category: "" }

export default function SupplierPage() {
  const { refresh: refreshLookups } = useLookups()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SupplierInput>(emptySupplier)

  const fetchAll = async () => {
    setLoading(true)
    try {
      setSuppliers(await listSuppliers())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptySupplier)
    setModalError("")
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    setEditingId(id)
    setModalError("")
    setModalOpen(true)
    setModalLoading(true)
    try {
      const existing = await getSupplier(id)
      if (existing) {
        const { id: _drop, ...rest } = existing
        setForm(rest)
      }
    } catch (e) {
      setModalError(asMessage(e))
    } finally {
      setModalLoading(false)
    }
  }

  const close = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptySupplier)
    setModalError("")
  }

  const onSave = async () => {
    setModalLoading(true)
    setModalError("")
    try {
      if (editingId) await updateSupplier(editingId, form)
      else await createSupplier(form)
      await Promise.all([fetchAll(), refreshLookups()])
      close()
    } catch (e) {
      setModalError(asMessage(e))
    } finally {
      setModalLoading(false)
    }
  }

  const onDelete = async () => {
    if (!editingId) return
    if (!window.confirm("Delete this supplier?")) return
    setModalLoading(true)
    setModalError("")
    try {
      await deleteSupplier(editingId)
      await Promise.all([fetchAll(), refreshLookups()])
      close()
    } catch (e) {
      setModalError(asMessage(e))
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h2">Suppliers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New supplier
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        {suppliers.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card>
              <CardActionArea onClick={() => openEdit(s.id)}>
                <CardContent sx={{ minHeight: 92 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {s.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {s.description || "No description"}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={modalOpen} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Supplier information" : "Add new supplier"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              multiline
              rows={3}
              fullWidth
            />
            {modalError && <Alert severity="error">{modalError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close} disabled={modalLoading}>
            Cancel
          </Button>
          {editingId && (
            <Button color="error" onClick={onDelete} disabled={modalLoading}>
              Delete
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onSave}
            disabled={modalLoading || !form.name.trim()}
          >
            {editingId ? "Save" : "Create"}
          </Button>
        </DialogActions>
        {modalLoading && <LinearProgress />}
      </Dialog>
    </Box>
  )
}

function asMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
