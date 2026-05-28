import { useLocation, useNavigate } from "react-router-dom"
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Storefront as OutletIcon,
  CreditCard as PaymentIcon,
  PeopleAlt as SupplierIcon,
} from "@mui/icons-material"
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../theme"

const TABS: { value: string; label: string; icon: JSX.Element; match: (path: string) => boolean }[] = [
  {
    value: "/",
    label: "Bills",
    icon: <DashboardIcon />,
    match: (p) => p === "/" || p.startsWith("/bill"),
  },
  {
    value: "/supplier",
    label: "Suppliers",
    icon: <SupplierIcon />,
    match: (p) => p.startsWith("/supplier"),
  },
  {
    value: "/outlet",
    label: "Outlets",
    icon: <OutletIcon />,
    match: (p) => p.startsWith("/outlet"),
  },
  {
    value: "/payment",
    label: "Payments",
    icon: <PaymentIcon />,
    match: (p) => p.startsWith("/payment"),
  },
]

export default function MobileBottomNav() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const location = useLocation()

  if (!isMobile) return null

  const activeTab = TABS.find((t) => t.match(location.pathname))?.value ?? "/"

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderRadius: 0,
        borderTop: "1px solid #e6e8ef",
        // Safe-area inset for iOS home indicator.
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(_, v) => navigate(v)}
        showLabels
        sx={{ height: MOBILE_BOTTOM_NAV_HEIGHT }}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={tab.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}

/**
 * Vertical padding to add to a page so its content isn't covered by the
 * fixed bottom nav on mobile. Plays with iOS safe-area too.
 */
export function useMobileBottomPadding(): string {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  if (!isMobile) return "0px"
  return `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`
}

/**
 * `sx` value to apply to a fixed bottom element (e.g. a FAB or sticky form
 * footer) so it sits above the bottom nav on mobile.
 */
export function bottomFixedOffsetSx() {
  return {
    bottom: {
      xs: `calc(${MOBILE_BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`,
      md: 24,
    },
  }
}
