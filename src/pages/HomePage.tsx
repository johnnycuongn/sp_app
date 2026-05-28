import { useEffect, useMemo, useReducer, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material"
import {
  Add as AddIcon,
  ReceiptLong as ReceiptIcon,
} from "@mui/icons-material"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Bill, listBillsForYear, useLookups } from "../api"
import { formatMoney, BRAND_PRIMARY } from "../theme"
import {
  RangeKind,
  filterBillsInRange,
  paymentBreakdown,
  rangeOptionsFor,
  totalSum,
} from "./HomePage.report"
import "./HomePage.css"

interface PageState {
  year: number
  kind: RangeKind
  rangeIndex: number
}

type Action =
  | { type: "setYear"; year: number }
  | { type: "setKind"; kind: RangeKind }
  | { type: "setRangeIndex"; index: number }

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "setYear":
      return { year: action.year, kind: "quarter", rangeIndex: -1 }
    case "setKind":
      return { ...state, kind: action.kind, rangeIndex: -1 }
    case "setRangeIndex":
      return { ...state, rangeIndex: action.index }
  }
}

export default function HomePage() {
  const navigate = useNavigate()
  const { payments, earliestBillYear, supplierName, outletName, paymentName } =
    useLookups()

  const [{ year, kind, rangeIndex }, dispatch] = useReducer(reducer, {
    year: new Date().getFullYear(),
    kind: "quarter",
    rangeIndex: -1,
  })

  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Refetch bills whenever the year changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    listBillsForYear(year)
      .then((data) => {
        if (!cancelled) setBills(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  const rangeOptions = useMemo(() => rangeOptionsFor(year, kind), [year, kind])
  // Default the selected range item to the last (most recent) entry.
  const effectiveRangeIndex =
    rangeIndex === -1 ? rangeOptions.length - 1 : rangeIndex
  const selectedRange = rangeOptions[effectiveRangeIndex] ?? rangeOptions[0]

  const billsInRange = useMemo(
    () => (selectedRange ? filterBillsInRange(bills, selectedRange) : []),
    [bills, selectedRange]
  )

  const breakdown = useMemo(
    () => paymentBreakdown(billsInRange, payments),
    [billsInRange, payments]
  )
  const total = useMemo(() => totalSum(billsInRange), [billsInRange])

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    const start = Math.min(earliestBillYear, current)
    return Array.from({ length: current - start + 1 }, (_, i) => current - i)
  }, [earliestBillYear])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h2">Bill Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/bill/new")}
        >
          New bill
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            select
            label="Year"
            value={year}
            size="small"
            sx={{ minWidth: 120 }}
            onChange={(e) =>
              dispatch({ type: "setYear", year: Number(e.target.value) })
            }
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={kind}
            onChange={(_, v: RangeKind | null) =>
              v && dispatch({ type: "setKind", kind: v })
            }
          >
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="quarter">Quarter</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
          </ToggleButtonGroup>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              flex: 1,
              overflowX: "auto",
            }}
          >
            {rangeOptions.map((opt, i) => (
              <Chip
                key={opt.label}
                label={opt.label}
                color={i === effectiveRangeIndex ? "primary" : "default"}
                onClick={() => dispatch({ type: "setRangeIndex", index: i })}
                sx={{ borderRadius: 1.5 }}
              />
            ))}
          </Box>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {selectedRange?.label ?? ""} total
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {formatMoney(total)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {billsInRange.length} bill{billsInRange.length === 1 ? "" : "s"}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 2, minWidth: 0 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Payment breakdown
            </Typography>
            {breakdown.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 3, textAlign: "center" }}
              >
                No bills in this range yet.
              </Typography>
            ) : (
              <Box sx={{ width: "100%", height: 220, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breakdown}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                    />
                    <RechartsTooltip
                      formatter={((v: number) => formatMoney(v)) as any}
                      cursor={{ fill: "rgba(54, 57, 76, 0.05)" }}
                    />
                    <Bar dataKey="total" fill={BRAND_PRIMARY} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Paper sx={{ overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e6e8ef" }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptIcon color="action" />
            <Typography variant="h6">Bills</Typography>
          </Stack>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Outlet</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billsInRange.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No bills in this range.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {billsInRange.map((bill) => (
                <TableRow
                  key={bill.id}
                  hover
                  onClick={() => navigate(`/bill/${bill.id}/edit`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    {bill.payment_date.toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>{supplierName(bill.supplier_id)}</TableCell>
                  <TableCell>{outletName(bill.outlet_id)}</TableCell>
                  <TableCell>{paymentName(bill.payment_bank_id)}</TableCell>
                  <TableCell align="right">
                    {formatMoney(bill.total_payment)}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={bill.payment_status}
                      size="small"
                      color={
                        bill.payment_status === "paid" ? "success" : "warning"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
