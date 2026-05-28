import { ReactNode } from "react"
import { Box, useMediaQuery, useTheme } from "@mui/material"
import { useLocation } from "react-router-dom"
import AppNavigationBar from "../App.navbar"
import MobileBottomNav, { useMobileBottomPadding } from "./MobileBottomNav"

/** Paths that should hide the bottom nav on mobile (detail/edit screens). */
const HIDE_BOTTOM_NAV_PATTERNS = [/^\/bill\/.+/]

function shouldHideBottomNav(pathname: string): boolean {
  return HIDE_BOTTOM_NAV_PATTERNS.some((rx) => rx.test(pathname))
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const location = useLocation()
  const bottomPad = useMobileBottomPadding()
  const hideBottomNav = isMobile && shouldHideBottomNav(location.pathname)

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {!isMobile && <AppNavigationBar />}
      {isMobile && !hideBottomNav && <MobileAppBar />}
      <Box
        component="main"
        sx={{
          pb: hideBottomNav ? 0 : bottomPad,
        }}
      >
        {children}
      </Box>
      {!hideBottomNav && <MobileBottomNav />}
    </Box>
  )
}

function MobileAppBar() {
  return (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        height: 56,
        px: 2,
        bgcolor: "primary.main",
        color: "white",
        fontWeight: 700,
        letterSpacing: 0.5,
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        // iOS safe-area top, in case of PWA full-screen.
        pt: "env(safe-area-inset-top)",
      }}
    >
      Sinh Phu
    </Box>
  )
}
