import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { Add as AddIcon } from "@mui/icons-material"

import {
  Payment,
  PaymentInput,
  createPayment,
  deletePayment,
  getPayment,
  listPayments,
  updatePayment,
  useLookups,
} from "../api"
import MobileFab from "../components/MobileFab"
import { CrudDialog } from "./SupplierPage"

const emptyPayment: PaymentInput = { name: "", description: "" }

export default function PaymentPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { refresh: refreshLookups } = useLookups()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PaymentInput>(emptyPayment)

  const fetchAll = async () => {
    setLoading(true)
    try {
      setPayments(await listPayments())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyPayment)
    setModalError("")
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    setEditingId(id)
    setModalError("")
    setModalOpen(true)
    setModalLoading(true)
    try {
      const existing = await getPayment(id)
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
    setForm(emptyPayment)
    setModalError("")
  }

  const onSave = async () => {
    setModalLoading(true)
    setModalError("")
    try {
      if (editingId) await updatePayment(editingId, form)
      else await createPayment(form)
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
    if (!window.confirm("Delete this payment method?")) return
    setModalLoading(true)
    setModalError("")
    try {
      await deletePayment(editingId)
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
        <Typography variant="h2">Payment methods</Typography>
        {!isMobile && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New payment
          </Button>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {payments.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card>
              <CardActionArea onClick={() => openEdit(p.id)}>
                <CardContent sx={{ minHeight: 92 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {p.name}
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
                    {p.description || "No description"}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CrudDialog
        open={modalOpen}
        onClose={close}
        title={editingId ? "Payment method" : "New payment method"}
        loading={modalLoading}
        onSave={onSave}
        onDelete={editingId ? onDelete : undefined}
        saveDisabled={!form.name.trim()}
        saveLabel={editingId ? "Save" : "Create"}
      >
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
      </CrudDialog>

      <MobileFab onClick={openCreate} icon={<AddIcon />} label="New payment" />
    </Box>
  )
}

function asMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
