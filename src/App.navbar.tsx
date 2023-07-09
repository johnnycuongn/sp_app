import React, { MouseEventHandler } from 'react'
// import { toast } from 'react-toastify'

//images
// import Logo from './assets/ewb.png'
// import Logo from './assets/logo.jpg' 
import { AppBar, Toolbar, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './model/Auth'

export default function AppNavigationBar() {
  const navigate = useNavigate()
  const { logout, isAdmin } = useAuth()

  const [anchorElNav, setAnchorElNav] = React.useState<Element & EventTarget | null>(null)
  const [anchorElUser, setAnchorElUser] = React.useState<Element & EventTarget | null>(null)

  const handleOpenNavMenu: React.MouseEventHandler = (event) => {
    setAnchorElNav(event.currentTarget)
  }
  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  const handleOpenUserMenu: React.MouseEventHandler = (event) => {
    setAnchorElUser(event.currentTarget)
  }
  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  // NAVIGATION

  const handleDashboardClicked = () => {
    // Navigate to dashboard
    navigate('/')
    handleCloseNavMenu()
  }

  const handleSupplierClicked = () => {
    navigate('/supplier')
    handleCloseNavMenu()
  }
  
  const handlePaymentClicked = () => {
    navigate('/payment')
    handleCloseNavMenu()
  }

  const handleUserAccountClicked = () => {
    navigate('/user')
    handleCloseUserMenu()
  }

  const handleUserLogoutClicked = async () => {
    await logout()
    // toast.info("You've been logged out", {
    //   position: toast.POSITION.TOP_CENTER, //notify user
    // })
    handleCloseUserMenu()
  }

  return (
    <AppBar sx={{backgroundColor: '#36394c'}} position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Large View */}
          <IconButton
            aria-label="logo"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {/* <QMCDCLLogoImage /> */}
          </IconButton>
          <SmallScreenNav
            anchorElNav={anchorElNav!}
            openNavMenu={handleOpenNavMenu}
            closeNavMenu={handleCloseNavMenu}
            onDashboardClick={handleDashboardClicked}
            onSupplierClick={handleSupplierClicked}
            onPaymentClick={handlePaymentClicked}
            admin={isAdmin}
          />
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              key="Dashboad"
              onClick={handleDashboardClicked}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Dashboard
            </Button>
            <Button
              key="Supplier"
              onClick={handleSupplierClicked}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Supplier
            </Button>
            <Button
              key="Payment"
              onClick={handlePaymentClicked}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Payment
            </Button>
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="User" src="" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {/* <MenuItem onClick={handleUserAccountClicked}>
                <Typography textAlign="center">Account</Typography>
              </MenuItem> */}
              <MenuItem onClick={handleUserLogoutClicked}>
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
  openNavMenu: MouseEventHandler
  closeNavMenu: () => void
  anchorElNav: Element | (() => Element)
  onDashboardClick: () => void
  onSupplierClick: () => void
  onPaymentClick: () => void
  admin: boolean
}

function SmallScreenNav({
  openNavMenu,
  anchorElNav,
  closeNavMenu,
  onDashboardClick,
  onSupplierClick,
  onPaymentClick,
  admin,
}: SmallScreenNavProps) {
  return (
    <>
      <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={openNavMenu}
          color="inherit"
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorElNav)}
          onClose={closeNavMenu}
          sx={{
            display: { xs: 'block', md: 'none' },
          }}
        >
          <MenuItem key="dashboard" onClick={onDashboardClick}>
            <Typography textAlign="center">Dashboard</Typography>
          </MenuItem>
          <MenuItem key="supplier" onClick={onSupplierClick}>
            <Typography textAlign="center">Supplier</Typography>
          </MenuItem>
          <MenuItem key="payment" onClick={onPaymentClick}>
            <Typography textAlign="center">Payment</Typography>
          </MenuItem>
        </Menu>
      </Box>
      <IconButton
        aria-label="logo"
        sx={{
          mr: 5,
          display: { xs: 'flex', md: 'none' },
          flexGrow: 1,
        }}
      >
        {/* <QMCDCLLogoImage /> */}
      </IconButton>
    </>
  )
}

// function QMCDCLLogoImage() {
//   return (
//     <Box
//       component="img"
//       sx={{
//         width: 50,
//         maxWidth: { xs: 50, md: 70 },
//       }}
//       alt="Logo"
//       src={Logo}
//     />
//   )
// }
