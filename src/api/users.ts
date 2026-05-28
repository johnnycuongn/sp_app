import {
  User as FirebaseAuthUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { getDoc, setDoc } from "firebase/firestore"
import { adminAuth } from "../services/firebase/config"
import { auth, userRef } from "../services/firebase"
import { Role, RoleType, UserDoc } from "./types"

/** A signed-in user merged with their Firestore profile. */
export type AppUser = UserDoc & FirebaseAuthUser

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  await signOut(auth)
}

/**
 * Create a new user via the admin auth instance so the currently signed-in
 * admin isn't replaced by the freshly created user.
 */
export async function createUser(
  email: string,
  password: string,
  roleType: RoleType
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(adminAuth, email, password)
  const role: Role = { type: roleType }
  await setDoc(userRef(credential.user.uid), { role })
  return credential.user.uid
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(userRef(uid))
  const firebaseUser = auth.currentUser
  if (!snap.exists() || !firebaseUser) return null
  const data = snap.data() as Partial<UserDoc>
  return {
    role: data.role ?? { type: RoleType.outlet_manager },
    ...firebaseUser,
  }
}
