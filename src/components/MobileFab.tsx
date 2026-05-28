import { ReactNode } from "react"
import { Fab, useMediaQuery, useTheme } from "@mui/material"
import { bottomFixedOffsetSx } from "./MobileBottomNav"

interface MobileFabProps {
  onClick: () => void
  icon: ReactNode
  label?: string
  /** If true, render on all screen sizes; otherwise only mobile. */
  alwaysVisible?: boolean
}

/**
 * Floating action button for the primary action of a top-level page.
 * Sits above the bottom nav on mobile via `bottomFixedOffsetSx`. By default
 * we don't render it on desktop because the page header has a normal button.
 */
export default function MobileFab({
  onClick,
  icon,
  label = "Add",
  alwaysVisible,
}: MobileFabProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  if (!isMobile && !alwaysVisible) return null

  return (
    <Fab
      color="primary"
      aria-label={label}
      onClick={onClick}
      sx={{
        position: "fixed",
        right: 16,
        ...bottomFixedOffsetSx(),
        zIndex: (t) => t.zIndex.appBar + 1,
      }}
    >
      {icon}
    </Fab>
  )
}
