import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "./auth"
import { getEarliestBillYear } from "./bills"
import { listOutlets } from "./outlets"
import { listPayments } from "./payments"
import { listSuppliers } from "./suppliers"
import { Outlet, Payment, Supplier } from "./types"

interface LookupsContextValue {
  suppliers: Supplier[]
  outlets: Outlet[]
  payments: Payment[]
  earliestBillYear: number
  loading: boolean
  /** Refresh all lookups from Firestore. Call after a successful create/update. */
  refresh: () => Promise<void>
  /** Look up a name by id, falling back to the given placeholder. */
  supplierName: (id?: string, fallback?: string) => string
  outletName: (id?: string, fallback?: string) => string
  paymentName: (id?: string, fallback?: string) => string
}

const LookupsContext = createContext<LookupsContextValue>({
  suppliers: [],
  outlets: [],
  payments: [],
  earliestBillYear: new Date().getFullYear(),
  loading: false,
  refresh: async () => {},
  supplierName: () => "",
  outletName: () => "",
  paymentName: () => "",
})

export const useLookups = () => useContext(LookupsContext)

/**
 * Loads the shared supplier/outlet/payment lookups once the user is signed in.
 * Replaces the prior `Bill.suppliers / Bill.payments / Bill.outlets` static
 * caches and the page-by-page `Bill._initialize()` requirement.
 */
export function LookupsProvider({ children }: { children?: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [earliestBillYear, setEarliestBillYear] = useState<number>(
    new Date().getFullYear()
  )
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, o, p, y] = await Promise.all([
        listSuppliers(),
        listOutlets(),
        listPayments(),
        getEarliestBillYear(),
      ])
      setSuppliers(s)
      setOutlets(o)
      setPayments(p)
      setEarliestBillYear(y)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) load()
  }, [currentUser, load])

  const value = useMemo<LookupsContextValue>(() => {
    const nameOf =
      <T extends { id: string; name: string }>(rows: T[]) =>
      (id?: string, fallback = "—") =>
        (id && rows.find((r) => r.id === id)?.name) || fallback

    return {
      suppliers,
      outlets,
      payments,
      earliestBillYear,
      loading,
      refresh: load,
      supplierName: nameOf(suppliers),
      outletName: nameOf(outlets),
      paymentName: nameOf(payments),
    }
  }, [suppliers, outlets, payments, earliestBillYear, loading, load])

  return (
    <LookupsContext.Provider value={value}>{children}</LookupsContext.Provider>
  )
}
