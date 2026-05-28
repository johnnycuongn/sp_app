import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { useAuth } from "./api"
import AppLayout from "./components/AppLayout"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import SupplierPage from "./pages/SupplierPage"
import PaymentPage from "./pages/PaymentPage"
import NewBillPage from "./pages/NewBillPage"
import OutletPage from "./pages/OutletPage"

export default function AppRoutes() {
  const { currentUser, loading } = useAuth()

  if (loading) return null
  if (currentUser == null) return <LoginPage />

  return (
    <AppLayout>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bill">
            <Route path="new" element={<NewBillPage />} />
            <Route path=":id/edit" element={<NewBillPage />} />
          </Route>
          <Route path="/supplier" element={<SupplierPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/outlet" element={<OutletPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

function AdminRoute() {
  const { isAdmin } = useAuth()
  if (isAdmin) return <Outlet />
  return <Navigate to="/" />
}
