import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./model/Auth";
import AppNavigationBar from "./App.navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SupplierPage from "./pages/SupplierPage";
import PaymentPage from "./pages/PaymentPage";
import NewBillPage from "./pages/NewBillPage";
import OutletPage from "./pages/OutletPage";


export default function AppRoutes() {

  const { currentUser, loading } = useAuth()

  if (currentUser == null) {
    return  <LoginPage />
  }
  return (
    <>
      <AppNavigationBar />
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path='/' element={<HomePage />}/>
          <Route path="/bill">
            <Route path="new" element={<NewBillPage />} />
            <Route path=":id/edit" element={<NewBillPage />} />
          </Route>
          <Route path="/supplier" element={<SupplierPage />} />
          <Route path="/payment" element={<PaymentPage />}/>
          <Route path="/outlet" element={<OutletPage />}/>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export function AdminRoute() {
  // const { currentUser } = useAuth()
  const { isAdmin } = useAuth()

  if (isAdmin) {
    return <Outlet />
  }

  return <Navigate to="/" />
}