import React from "react"
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "./api"

const NAV_ITEMS: { label: string; path: string }[] = [
  { label: "Bills", path: "/" },
  { label: "Suppliers", path: "/supplier" },
  { label: "Outlets", path: "/outlet" },
  { label: "Payments", path: "/payment" },
]

/**
 * Desktop-only top navigation bar. On mobile we render
 * `MobileBottomNav` + a compact sticky header instead — see `AppLayout`.
 */
export default function AppNavigationBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const [anchorElUser, setAnchorElUser] = React.useState<Element | null>(null)
  const openUserMenu: React.MouseEventHandler = (e) =>
    setAnchorElUser(e.currentTarget)
  const closeUserMenu = () => setAnchorElUser(null)

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "primary.main", display: { xs: "none", md: "block" } }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            sx={{
              mr: 4,
              color: "white",
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            Sinh Phu
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex" }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  my: 1,
                  mx: 0.5,
                  color: "white",
                  opacity: isActive(item.path) ? 1 : 0.7,
                  borderBottom: isActive(item.path)
                    ? "2px solid white"
                    : "2px solid transparent",
                  borderRadius: 0,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box>
            <Tooltip title="Account">
              <IconButton onClick={openUserMenu} sx={{ p: 0 }}>
                <Avatar alt="User" src="" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={closeUserMenu}
            >
              <MenuItem
                onClick={async () => {
                  closeUserMenu()
                  await logout()
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
