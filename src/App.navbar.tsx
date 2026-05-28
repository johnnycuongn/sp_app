import React, { MouseEventHandler } from "react"
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
import MenuIcon from "@mui/icons-material/Menu"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "./api"

const NAV_ITEMS: { label: string; path: string }[] = [
  { label: "Dashboard", path: "/" },
  { label: "Supplier", path: "/supplier" },
  { label: "Payment", path: "/payment" },
  { label: "Outlet", path: "/outlet" },
]

export default function AppNavigationBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const [anchorElNav, setAnchorElNav] = React.useState<Element | null>(null)
  const [anchorElUser, setAnchorElUser] = React.useState<Element | null>(null)

  const handleOpenNavMenu: React.MouseEventHandler = (e) =>
    setAnchorElNav(e.currentTarget)
  const handleCloseNavMenu = () => setAnchorElNav(null)
  const handleOpenUserMenu: React.MouseEventHandler = (e) =>
    setAnchorElUser(e.currentTarget)
  const handleCloseUserMenu = () => setAnchorElUser(null)

  const go = (path: string) => {
    navigate(path)
    handleCloseNavMenu()
  }

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)

  return (
    <AppBar sx={{ backgroundColor: "primary.main" }} position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            sx={{
              mr: 3,
              display: { xs: "none", md: "flex" },
              color: "white",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            Sinh Phu
          </Typography>

          <SmallScreenNav
            anchorElNav={anchorElNav}
            open={handleOpenNavMenu}
            close={handleCloseNavMenu}
            onGo={go}
          />

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                onClick={() => go(item.path)}
                sx={{
                  my: 2,
                  mx: 0.5,
                  color: "white",
                  opacity: isActive(item.path) ? 1 : 0.75,
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

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
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
              onClose={handleCloseUserMenu}
            >
              <MenuItem
                onClick={async () => {
                  handleCloseUserMenu()
                  await logout()
                }}
              >
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

interface SmallScreenNavProps {
  open: MouseEventHandler
  close: () => void
  anchorElNav: Element | null
  onGo: (path: string) => void
}

function SmallScreenNav({ open, anchorElNav, close, onGo }: SmallScreenNavProps) {
  return (
    <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
      <IconButton size="large" onClick={open} color="inherit" aria-label="menu">
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={anchorElNav}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        open={Boolean(anchorElNav)}
        onClose={close}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {NAV_ITEMS.map((item) => (
          <MenuItem key={item.path} onClick={() => onGo(item.path)}>
            <Typography textAlign="center">{item.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
