import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "./firebase";
import { SerializedUser, UserProfile } from "@/store/use-auth-store";
import { profileService } from "./profile-service";
import type { User as FirebaseUserType } from "firebase/auth";

// Result type for Google login — may require role selection for new users
export type GoogleLoginResult =
  | { status: "existing"; user: SerializedUser; profile: UserProfile }
  | { status: "needs_role"; user: SerializedUser; firebaseUser: FirebaseUserType };

// Helper to serialize Firebase user
export function serializeUser(user: FirebaseUser): SerializedUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// Simulated Local Database Types
interface SimulatedUserDb {
  [uid: string]: UserProfile;
}

const SIMULATED_USERS_KEY = "hyperhire_simulated_users";
const SIMULATED_SESSION_KEY = "hyperhire_simulated_session";

function getSimulatedUsers(): SimulatedUserDb {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_USERS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveSimulatedUsers(users: SimulatedUserDb) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
  }
}

export const authService = {
  /**
   * Register with Email and Password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: "student" | "business"
  ): Promise<{ user: SerializedUser; profile: UserProfile }> {
    if (isFirebaseConfigured && auth && db) {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credentials.user, { displayName: name });
      
      let profile: UserProfile;
      if (role === "student") {
        profile = await profileService.createDefaultStudentProfile(credentials.user.uid, email, name);
      } else {
        profile = {
          uid: credentials.user.uid,
          role,
          name,
          email,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", credentials.user.uid), profile);
      }
      
      return { user: serializeUser(credentials.user), profile };
    } else {
      // Simulation mode
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getSimulatedUsers();
          const emailExists = Object.values(users).some((u) => u.email === email);

          if (emailExists) {
            reject(new Error("auth/email-already-in-use: The email address is already in use by another account."));
            return;
          }

          const uid = "sim_user_" + Math.random().toString(36).substring(2, 9);
          
          if (role === "student") {
            profileService.createDefaultStudentProfile(uid, email, name).then((profile) => {
              const user: SerializedUser = {
                uid,
                email,
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
              };
              localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify({ user, profile }));
              resolve({ user, profile });
            }).catch(reject);
          } else {
            const profile: UserProfile = {
              uid,
              role,
              name,
              email,
              createdAt: new Date().toISOString(),
            };
            users[uid] = profile;
            saveSimulatedUsers(users);
            const user: SerializedUser = {
              uid,
              email,
              displayName: name,
              photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
            };
            localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify({ user, profile }));
            resolve({ user, profile });
          }
        }, 800);
      });
    }
  },

  /**
   * Login with Email and Password
   */
  async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ user: SerializedUser; profile: UserProfile }> {
    if (isFirebaseConfigured && auth && db) {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const profile = await profileService.ensureProfileExists(
        credentials.user.uid,
        credentials.user.email || email,
        credentials.user.displayName || "Student User"
      );
      return { user: serializeUser(credentials.user), profile };
    } else {
      // Simulation mode
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getSimulatedUsers();
          const matchedUserProfile = Object.values(users).find((u) => u.email === email);

          if (!matchedUserProfile) {
            reject(new Error("auth/user-not-found: There is no user record corresponding to this identifier."));
            return;
          }

          const user: SerializedUser = {
            uid: matchedUserProfile.uid,
            email: matchedUserProfile.email,
            displayName: matchedUserProfile.name,
            photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${matchedUserProfile.name}`,
          };

          localStorage.setItem(
            SIMULATED_SESSION_KEY,
            JSON.stringify({ user, profile: matchedUserProfile })
          );
          resolve({ user, profile: matchedUserProfile });
        }, 800);
      });
    }
  },

  /**
   * Google Sign-In Flow
   * For the signup page (role already selected), pass selectedRole.
   * For the login page (no role), omit selectedRole.
   * Returns either an existing profile or a signal that role selection is needed.
   */
  async loginWithGoogle(
    selectedRole?: "student" | "business"
  ): Promise<GoogleLoginResult> {
    if (isFirebaseConfigured && auth && db) {
      const credentials = await signInWithPopup(auth, googleProvider);
      const docRef = doc(db, "users", credentials.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Existing user — return their profile
        const profile = docSnap.data() as UserProfile;
        return { status: "existing", user: serializeUser(credentials.user), profile };
      }

      // New user
      if (selectedRole) {
        // Role already chosen (from signup page) — create profile immediately
        let profile: UserProfile;
        if (selectedRole === "student") {
          profile = await profileService.createDefaultStudentProfile(
            credentials.user.uid,
            credentials.user.email || "",
            credentials.user.displayName || "Google User"
          );
        } else {
          profile = {
            uid: credentials.user.uid,
            role: "business",
            name: credentials.user.displayName || "Google User",
            email: credentials.user.email || "",
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, profile);
        }
        return { status: "existing", user: serializeUser(credentials.user), profile };
      }

      // No role selected (login page) — signal that role selection is needed
      return {
        status: "needs_role",
        user: serializeUser(credentials.user),
        firebaseUser: credentials.user,
      };
    } else {
      // Simulation mode
      return new Promise((resolve) => {
        setTimeout(() => {
          const users = getSimulatedUsers();

          if (!selectedRole) {
            const existingUser = Object.values(users).find(
              (u) => u.email === "kunal.das@gmail.com" || u.email === "anil.sen@gmail.com"
            );

            if (existingUser) {
              const user: SerializedUser = {
                uid: existingUser.uid,
                email: existingUser.email,
                displayName: existingUser.name,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${existingUser.name}`,
              };
              localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify({ user, profile: existingUser }));
              resolve({ status: "existing", user, profile: existingUser });
            } else {
              // Simulate needs_role for new simulated google user
              const mockName = "Kunal Das";
              const mockEmail = "kunal.das@gmail.com";
              const uid = "sim_google_kunal";
              const user: SerializedUser = {
                uid,
                email: mockEmail,
                displayName: mockName,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${mockName}`,
              };
              resolve({ status: "needs_role", user, firebaseUser: null as any });
            }
            return;
          }

          // Signup flow: create simulated profile
          const mockName = selectedRole === "business" ? "Anil Sen (Business)" : "Kunal Das (Student)";
          const mockEmail = selectedRole === "business" ? "anil.sen@gmail.com" : "kunal.das@gmail.com";
          const uid = "sim_google_" + Math.random().toString(36).substring(2, 9);
          
          const profile: UserProfile = {
            uid,
            role: selectedRole,
            name: mockName,
            email: mockEmail,
            createdAt: new Date().toISOString(),
          };

          users[uid] = profile;
          saveSimulatedUsers(users);

          const user: SerializedUser = {
            uid,
            email: mockEmail,
            displayName: mockName,
            photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${mockName}`,
          };

          localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify({ user, profile }));
          resolve({ status: "existing", user, profile });
        }, 1000);
      });
    }
  },

  /**
   * Complete Google Signup — called after the user selects a role for their new account.
   */
  async completeGoogleSignup(
    uid: string,
    email: string,
    displayName: string,
    role: "student" | "business"
  ): Promise<UserProfile> {
    if (isFirebaseConfigured && db) {
      if (role === "student") {
        return profileService.createDefaultStudentProfile(uid, email, displayName);
      } else {
        const profile: UserProfile = {
          uid,
          role: "business",
          name: displayName,
          email,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", uid), profile);
        return profile;
      }
    } else {
      // Simulation
      const profile: UserProfile = {
        uid,
        role,
        name: displayName,
        email,
        createdAt: new Date().toISOString(),
      };
      const users = getSimulatedUsers();
      users[uid] = profile;
      saveSimulatedUsers(users);
      localStorage.setItem(
        SIMULATED_SESSION_KEY,
        JSON.stringify({
          user: { uid, email, displayName, photoURL: null },
          profile,
        })
      );
      return profile;
    }
  },

  /**
   * Sign Out / Logout
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(SIMULATED_SESSION_KEY);
    }
  },

  /**
   * Synchronize Simulated Sessions
   */
  getSimulatedSession(): { user: SerializedUser; profile: UserProfile } | null {
    if (typeof window === "undefined") return null;
    const session = localStorage.getItem(SIMULATED_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },
};
