import { useEffect, useState } from "react"
import {
  Alert,
  Autocomplete,
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
  Outlet,
  OutletInput,
  createOutlet,
  deleteOutlet,
  getOutlet,
  listOutlets,
  updateOutlet,
  useLookups,
} from "../api"
import MobileFab from "../components/MobileFab"
import { CrudDialog } from "./SupplierPage"

const emptyOutlet: OutletInput = {
  name: "",
  description: "",
  default_payment_id: "",
}

export default function OutletPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { payments, refresh: refreshLookups } = useLookups()

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OutletInput>(emptyOutlet)

  const fetchAll = async () => {
    setLoading(true)
    try {
      setOutlets(await listOutlets())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyOutlet)
    setModalError("")
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    setEditingId(id)
    setModalError("")
    setModalOpen(true)
    setModalLoading(true)
    try {
      const existing = await getOutlet(id)
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
    setForm(emptyOutlet)
    setModalError("")
  }

  const onSave = async () => {
    setModalLoading(true)
    setModalError("")
    try {
      if (editingId) await updateOutlet(editingId, form)
      else await createOutlet(form)
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
    if (!window.confirm("Delete this outlet?")) return
    setModalLoading(true)
    setModalError("")
    try {
      await deleteOutlet(editingId)
      await Promise.all([fetchAll(), refreshLookups()])
      close()
    } catch (e) {
      setModalError(asMessage(e))
    } finally {
      setModalLoading(false)
    }
  }

  const defaultPaymentOption =
    payments.find((p) => p.id === form.default_payment_id) ?? null

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h2">Outlets</Typography>
        {!isMobile && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New outlet
          </Button>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {outlets.map((o) => (
          <Grid item xs={12} sm={6} md={4} key={o.id}>
            <Card>
              <CardActionArea onClick={() => openEdit(o.id)}>
                <CardContent sx={{ minHeight: 92 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {o.name}
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
                    {o.description || "No description"}
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
        title={editingId ? "Outlet" : "New outlet"}
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
          <Autocomplete
            options={payments}
            value={defaultPaymentOption}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, v) =>
              setForm((f) => ({ ...f, default_payment_id: v?.id ?? "" }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Default payment method" />
            )}
          />
          {modalError && <Alert severity="error">{modalError}</Alert>}
        </Stack>
      </CrudDialog>

      <MobileFab onClick={openCreate} icon={<AddIcon />} label="New outlet" />
    </Box>
  )
}

function asMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
