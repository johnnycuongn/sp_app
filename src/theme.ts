import { createTheme } from "@mui/material/styles"

export const BRAND_PRIMARY = "#36394c"

/** Heights used to compose mobile chrome (bottom nav, safe-area). */
export const MOBILE_BOTTOM_NAV_HEIGHT = 64
export const APP_BAR_HEIGHT_MOBILE = 56

export const theme = createTheme({
  palette: {
    primary: { main: BRAND_PRIMARY },
    background: { default: "#f7f8fb" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    h2: { fontWeight: 600, fontSize: "1.5rem" },
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
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          // 44px is Apple HIG's minimum recommended tap target.
          minHeight: 44,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Account for iOS notch / Android gesture bar when wrapped via Capacitor or PWA.
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        },
      },
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
