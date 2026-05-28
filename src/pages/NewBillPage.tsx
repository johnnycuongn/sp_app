import React, { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"

import {
  BillInput,
  PAYMENT_STATUSES,
  PaymentStatus,
  createBill,
  deleteBill,
  getBill,
  getBillFileUrls,
  updateBill,
  useLookups,
} from "../api"
import DetailHeader from "../components/DetailHeader"
import { uppercaseFirst } from "../utils/string"

interface ReceiptSlot {
  key: string
  url: string
  existingPath?: string
  newFile?: File
  name: string
}

const emptyBill = (): BillInput => ({
  supplier_id: "",
  user_id: "",
  outlet_id: "",
  payment_date: new Date(),
  total_payment: 0,
  payment_status: "paid",
  payment_bank_id: "",
  files_ref: [],
})

export default function NewBillPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isUpdating = Boolean(id)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { suppliers, outlets, payments, refresh } = useLookups()

  const [bill, setBill] = useState<BillInput>(emptyBill())
  const [slots, setSlots] = useState<ReceiptSlot[]>([])
  const [removedPaths, setRemovedPaths] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fieldErrors = useMemo(() => {
    const e: Partial<Record<keyof BillInput, string>> = {}
    if (!bill.supplier_id) e.supplier_id = "Select a supplier"
    if (!bill.outlet_id) e.outlet_id = "Select an outlet"
    if (!bill.payment_bank_id) e.payment_bank_id = "Select a payment method"
    if (isNaN(bill.total_payment)) e.total_payment = "Enter a valid amount"
    return e
  }, [bill])
  const isSubmittable = Object.keys(fieldErrors).length === 0

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const existing = await getBill(id)
        if (cancelled || !existing) return
        const { id: _drop, ...rest } = existing
        setBill(rest)
        const urls = await getBillFileUrls(existing)
        if (cancelled) return
        setSlots(
          urls.map((url, i) => ({
            key: `existing-${i}`,
            url,
            existingPath: existing.files_ref[i],
            name: existing.files_ref[i]?.split("/").pop() ?? "Receipt",
          }))
        )
      } catch (e) {
        if (!cancelled) setErrorText(asMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const supplierOption = useMemo(
    () => suppliers.find((s) => s.id === bill.supplier_id) ?? null,
    [suppliers, bill.supplier_id]
  )
  const outletOption = useMemo(
    () => outlets.find((o) => o.id === bill.outlet_id) ?? null,
    [outlets, bill.outlet_id]
  )
  const paymentOption = useMemo(
    () => payments.find((p) => p.id === bill.payment_bank_id) ?? null,
    [payments, bill.payment_bank_id]
  )

  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    Promise.all(files.map(readAsDataUrl)).then((dataUrls) => {
      setSlots((prev) => [
        ...prev,
        ...files.map((f, i) => ({
          key: `new-${Date.now()}-${i}`,
          url: dataUrls[i],
          newFile: f,
          name: f.name,
        })),
      ])
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeSlot = (slot: ReceiptSlot) => {
    setSlots((prev) => prev.filter((s) => s.key !== slot.key))
    if (slot.existingPath) {
      setRemovedPaths((prev) => [...prev, slot.existingPath!])
    }
  }

  const onSubmit = async () => {
    setErrorText("")
    setLoading(true)
    try {
      const newFiles = slots
        .map((s) => s.newFile)
        .filter((f): f is File => Boolean(f))
      if (isUpdating) {
        await updateBill(id!, bill, { newFiles, removedPaths })
      } else {
        await createBill(bill, newFiles)
      }
      await refresh()
      navigate("/", { state: location.state })
    } catch (e) {
      setErrorText(asMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    if (!id) return
    if (!window.confirm("Delete this bill and its attached receipts?")) return
    setErrorText("")
    setLoading(true)
    try {
      await deleteBill(id)
      navigate(-1)
    } catch (e) {
      setErrorText(asMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const headerTitle = isUpdating ? "Edit Bill" : "New Bill"
  const formContent = (
    <Stack spacing={2.5}>
      <TextField
        label="Payment date"
        type="date"
        value={toDateInputValue(bill.payment_date)}
        onChange={(e) =>
          setBill((b) => ({
            ...b,
            payment_date: e.target.value
              ? new Date(e.target.value)
              : b.payment_date,
          }))
        }
        InputLabelProps={{ shrink: true }}
        fullWidth
        disabled={loading}
      />

      <Autocomplete
        options={suppliers}
        value={supplierOption}
        disabled={loading}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, v) =>
          setBill((b) => ({ ...b, supplier_id: v?.id ?? "" }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Supplier"
            required
            error={Boolean(fieldErrors.supplier_id)}
            helperText={fieldErrors.supplier_id}
          />
        )}
      />

      <Autocomplete
        options={outlets}
        value={outletOption}
        disabled={loading}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, v) =>
          setBill((b) => ({
            ...b,
            outlet_id: v?.id ?? "",
            payment_bank_id:
              v?.default_payment_id && !b.payment_bank_id
                ? v.default_payment_id
                : b.payment_bank_id,
          }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Outlet"
            required
            error={Boolean(fieldErrors.outlet_id)}
            helperText={fieldErrors.outlet_id}
          />
        )}
      />

      <Autocomplete
        options={payments}
        value={paymentOption}
        disabled={loading}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, v) =>
          setBill((b) => ({ ...b, payment_bank_id: v?.id ?? "" }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Payment method"
            required
            error={Boolean(fieldErrors.payment_bank_id)}
            helperText={fieldErrors.payment_bank_id}
          />
        )}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Total amount"
          type="number"
          value={isNaN(bill.total_payment) ? "" : bill.total_payment}
          onChange={(e) =>
            setBill((b) => ({
              ...b,
              total_payment:
                e.target.value === "" ? NaN : parseFloat(e.target.value),
            }))
          }
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { min: 0, step: "0.01", inputMode: "decimal" },
          }}
          error={Boolean(fieldErrors.total_payment)}
          helperText={fieldErrors.total_payment}
          fullWidth
          disabled={loading}
        />
        <TextField
          select
          label="Status"
          value={bill.payment_status}
          onChange={(e) =>
            setBill((b) => ({
              ...b,
              payment_status: e.target.value as PaymentStatus,
            }))
          }
          fullWidth
          disabled={loading}
        >
          {PAYMENT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {uppercaseFirst(status)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <ReceiptDropZone
        slots={slots}
        disabled={loading}
        onPick={() => fileInputRef.current?.click()}
        onRemove={removeSlot}
        onPreview={(url) => setPreviewUrl(url)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPickFiles}
      />

      {errorText && <Alert severity="error">{errorText}</Alert>}

      {isUpdating && !isMobile && (
        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={onDelete}
          disabled={loading}
          startIcon={<DeleteIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Delete bill
        </Button>
      )}
    </Stack>
  )

  return (
    <Box sx={{ pb: { xs: 12, md: 4 } /* room for sticky footer on mobile */ }}>
      <DetailHeader
        title={headerTitle}
        rightAction={
          isUpdating && isMobile ? (
            <IconButton
              onClick={onDelete}
              disabled={loading}
              sx={{ color: "white" }}
              aria-label="Delete bill"
            >
              <DeleteIcon />
            </IconButton>
          ) : undefined
        }
      />

      {loading && <LinearProgress />}

      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
        {isMobile ? (
          <Box sx={{ pt: 1 }}>{formContent}</Box>
        ) : (
          <Paper sx={{ p: 3 }}>{formContent}</Paper>
        )}
      </Box>

      <StickyFooter>
        <Button
          variant="contained"
          size="large"
          onClick={onSubmit}
          disabled={loading || !isSubmittable}
          fullWidth
        >
          {isUpdating ? "Save changes" : "Add bill"}
        </Button>
      </StickyFooter>

      <Dialog
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setPreviewUrl(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(255,255,255,0.7)",
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Receipt preview"
              sx={{ display: "block", width: "100%", height: "auto" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  )
}

function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        p: 2,
        pb: `calc(16px + env(safe-area-inset-bottom))`,
        borderRadius: 0,
        borderTop: "1px solid #e6e8ef",
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>{children}</Box>
    </Paper>
  )
}

interface ReceiptDropZoneProps {
  slots: ReceiptSlot[]
  disabled: boolean
  onPick: () => void
  onRemove: (slot: ReceiptSlot) => void
  onPreview: (url: string) => void
}

function ReceiptDropZone({
  slots,
  disabled,
  onPick,
  onRemove,
  onPreview,
}: ReceiptDropZoneProps) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Receipts
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ alignItems: "flex-start" }}
      >
        {slots.map((slot) => (
          <Box
            key={slot.key}
            sx={{
              position: "relative",
              width: 110,
              height: 110,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #e6e8ef",
              cursor: "pointer",
              "&:hover .receipt-remove": { opacity: 1 },
            }}
            onClick={() => onPreview(slot.url)}
          >
            <Box
              component="img"
              src={slot.url}
              alt={slot.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <IconButton
              className="receipt-remove"
              size="small"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(slot)
              }}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                bgcolor: "rgba(255,255,255,0.85)",
                opacity: { xs: 1, sm: 0 },
                transition: "opacity 0.15s",
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="outlined"
          onClick={onPick}
          disabled={disabled}
          startIcon={<CloudUploadIcon />}
          sx={{
            width: 110,
            height: 110,
            borderStyle: "dashed",
            display: "flex",
            flexDirection: "column",
          }}
        >
          Add
        </Button>
      </Stack>
    </Box>
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function asMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
