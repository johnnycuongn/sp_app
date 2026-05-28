import { BrowserRouter } from "react-router-dom"
import { CssBaseline, ThemeProvider } from "@mui/material"

import { AuthProvider, LookupsProvider } from "./api"
import AppRoutes from "./App.routes"
import { theme } from "./theme"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <LookupsProvider>
            <AppRoutes />
          </LookupsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
