import { createTheme } from "@mui/material/styles"

export const BRAND_PRIMARY = "#36394c"

export const theme = createTheme({
  palette: {
    primary: { main: BRAND_PRIMARY },
    background: { default: "#f7f8fb" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    h2: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #e6e8ef" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
})

export const color = { main: BRAND_PRIMARY }

export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  })
}
