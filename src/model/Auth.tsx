/* eslint-disable react/prop-types */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { auth } from '../services/firebase'
import { User as UserModel, AppUserInterface, loginUser, logoutUser } from './User'



interface AuthContextInterface {
  currentUser: AppUserInterface | null
  /**
   * @summary Signs in a user via their email and password.
   * @param {string} email The user's email address.
   * @param {string} password The user's password.
   * @returns Promise
   */
  login: (email: string, password: string) => void
  /**
   * @summary Signs out the currently authenticated user.
   * @returns Promise
   */
  logout: () => void

  isAdmin: boolean

  /**
   * @summary Loading state when fetching user
   * @description This often appears when user reload the pages
   *
   */
  loading: boolean
}

const AuthContext = createContext<AuthContextInterface>({
  currentUser: null,
  login(email, password) {
      console.log('nothing login');
  },
  logout() {
      console.log('nothin logout');
  },
  isAdmin: false,
  loading: false
})

/**
 * @returns currentUser => The currently logged in user.
 * @returns register(name, phone, email, password) => Function for creating a new member.
 * @returns login(email, password) => Funtion for signing a user into the application.
 * @returns logout() => Funtion for signing a user out.
 */
export const useAuth = () => useContext(AuthContext)

/**
 *
 * @summary Wrapper which provides access to the auth context.
 *
 * @description
 * Using this context as a wrapper around the app's router
 * allows routes to access currentUser and authentication methods.
 */
export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [currentUser, setcurrentUser] = useState<AppUserInterface | null>(null)
  const [loading, setLoading] = useState(false)

  const isAdmin =
    (currentUser && currentUser.role && currentUser.role.type == 'admin')!

  const login = async (email: string, password: string) =>
    loginUser(email, password)

  const logout = async () => logoutUser()

  /**
   * When a user signs in, their details are set in the { currentUser } object.
   * When a user signs out, { currentUser } is set to null.
   */
  useEffect(() => {
    setLoading(true)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await UserModel.getUserDetails(user.uid)
        setcurrentUser({ ...userDoc! })
      } else {
        setcurrentUser(null)
      }

      setLoading(false)
    })
    return unsubscribe
  }, [])

  const contextValues = useMemo<AuthContextInterface>(
    () => ({
      currentUser,
      login,
      logout,
      isAdmin,
      loading,
    }),
    [currentUser, loading]
  )

  return (
    <AuthContext.Provider value={contextValues}>
      {children}
    </AuthContext.Provider>
  )
}