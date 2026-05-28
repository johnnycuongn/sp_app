import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { auth } from "../services/firebase"
import { AppUser, getAppUser, login, logout } from "./users"
import { RoleType } from "./types"

interface AuthContextValue {
  currentUser: AppUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  loading: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const appUser = await getAppUser(user.uid)
        setCurrentUser(appUser)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const isAdmin = currentUser?.role?.type === RoleType.admin

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAdmin,
      loading,
      login,
      logout,
    }),
    [currentUser, isAdmin, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
