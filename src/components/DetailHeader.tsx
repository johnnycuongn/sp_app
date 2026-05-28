import { ReactNode } from "react"
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"

interface DetailHeaderProps {
  title: string
  rightAction?: ReactNode
  onBack?: () => void
}

/**
 * Sticky top header for detail/sub pages (e.g. NewBillPage). On mobile this
 * provides a full-width primary-color bar with back arrow; on desktop the
 * standard top nav remains and we render a quieter inline header instead.
 */
export default function DetailHeader({
  title,
  rightAction,
  onBack,
}: DetailHeaderProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const back = onBack ?? (() => navigate(-1))

  if (isMobile) {
    return (
      <AppBar
        position="sticky"
        color="primary"
        elevation={0}
        sx={{ pt: "env(safe-area-inset-top)" }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={back} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
            {title}
          </Typography>
          {rightAction}
        </Toolbar>
      </AppBar>
    )
  }

  return (
    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={back} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {rightAction}
      </Stack>
    </Box>
  )
}
