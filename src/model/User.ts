import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, userRef } from "../services/firebase/index"
import { getDoc, writeBatch } from "firebase/firestore"
import { adminAuth, db } from "../services/firebase/config"

import { User as FirebaseAuthUser } from 'firebase/auth'

export enum RoleType {
  outlet_manager = 'outlet_manager',
  admin = 'admin',
}

export interface UserModelInterface  {
  role: Role
}

/**
 * Combine User in Firestore and Authentication
 */
export type AppUserInterface = UserModelInterface & FirebaseAuthUser

export interface Role {
  type: RoleType
  // function_accessed: string[]
}

export const loginUser = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password)
}

/**
 * @summary Signs out the currently authenticated user.
 * @returns Promise
 */
export const logoutUser = async () => {
  return signOut(auth)
}

export class User {

  static async create(name: string,
    email: string,
    password: string,
    roleType: RoleType) {
      // admin auth

      const userCredential = await createUserWithEmailAndPassword(
        adminAuth,
        email,
        password
      )
    
      const batch = writeBatch(db)
    
      batch.set(userRef(userCredential.user.uid), {
        role: {
          type: roleType,
        },
      })
    
      await batch.commit()
  }

  static async getUserDetails(userId: string): Promise<AppUserInterface | null> {
    const docRef = userRef(userId)
    const docSnap = await getDoc(docRef)

    const auth = getAuth()

    const user = auth.currentUser
  
    if (docSnap.exists() && user) {
      return {
        role: docSnap.data().role ?? RoleType,
        ...user
      }
    }

    return null
  }

  static async getAllUsers(): Promise<UserModelInterface[]> {
    return []
  }

}