import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from "@mui/material"
import { Bill } from "../api"
import { formatMoney } from "../theme"

interface BillCardProps {
  bill: Bill
  supplierName: string
  outletName: string
  paymentName: string
  onClick: () => void
}

/**
 * Mobile-friendly card representation of a bill. Replaces table rows on
 * small screens where horizontal real estate is tight.
 */
export default function BillCard({
  bill,
  supplierName,
  outletName,
  paymentName,
  onClick,
}: BillCardProps) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardActionArea onClick={onClick} sx={{ p: 1.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {supplierName}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {outletName} · {paymentName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {bill.payment_date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {formatMoney(bill.total_payment)}
            </Typography>
            <Chip
              label={bill.payment_status}
              size="small"
              color={bill.payment_status === "paid" ? "success" : "warning"}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  )
}
