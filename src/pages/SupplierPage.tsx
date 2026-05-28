import { forwardRef, useEffect, useState } from "react"
import {
  Alert,
  AppBar,
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
  IconButton,
  LinearProgress,
  Slide,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { TransitionProps } from "@mui/material/transitions"
import {
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material"

import {
  Supplier,
  SupplierInput,
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
  useLookups,
} from "../api"
import MobileFab from "../components/MobileFab"

const emptySupplier: SupplierInput = { name: "", description: "", category: "" }

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function SupplierPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
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
        {!isMobile && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New supplier
          </Button>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
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

      <CrudDialog
        open={modalOpen}
        onClose={close}
        title={editingId ? "Supplier" : "New supplier"}
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

      <MobileFab onClick={openCreate} icon={<AddIcon />} label="New supplier" />
    </Box>
  )
}

interface CrudDialogProps {
  open: boolean
  onClose: () => void
  title: string
  loading: boolean
  onSave: () => void
  onDelete?: () => void
  saveDisabled?: boolean
  saveLabel: string
  children: React.ReactNode
}

/**
 * Shared dialog for the lookup-table CRUD pages. On mobile it slides up
 * full-screen with a top app bar; on desktop it's a centered modal.
 */
export function CrudDialog({
  open,
  onClose,
  title,
  loading,
  onSave,
  onDelete,
  saveDisabled,
  saveLabel,
  children,
}: CrudDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? SlideUpTransition : undefined}
    >
      {isMobile ? (
        <AppBar position="sticky" elevation={0} color="primary">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
              {title}
            </Typography>
            <Button
              color="inherit"
              onClick={onSave}
              disabled={loading || saveDisabled}
            >
              {saveLabel}
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle>{title}</DialogTitle>
      )}
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>{children}</DialogContent>
      {!isMobile && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {onDelete && (
            <Button color="error" onClick={onDelete} disabled={loading}>
              Delete
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onSave}
            disabled={loading || saveDisabled}
          >
            {saveLabel}
          </Button>
        </DialogActions>
      )}
      {isMobile && onDelete && (
        <Box sx={{ p: 2 }}>
          <Button
            color="error"
            onClick={onDelete}
            disabled={loading}
            fullWidth
            variant="outlined"
          >
            Delete
          </Button>
        </Box>
      )}
      {loading && <LinearProgress />}
    </Dialog>
  )
}

function asMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
