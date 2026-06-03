"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { authService, serializeUser } from "@/lib/auth-service";
import { useAuthStore, UserProfile } from "@/store/use-auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setProfile, setLoading } = useAuthStore();

  React.useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth && db) {
      // Firebase auth state listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            // Fetch existing profile from Firestore — do NOT auto-create
            const docRef = doc(db!, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              setUser(serializeUser(firebaseUser));
              setProfile(profile);
            } else {
              // User is authenticated but has no profile yet (mid-registration)
              // Set user but leave profile null — the login form handles role selection
              setUser(serializeUser(firebaseUser));
              setProfile(null);
            }
          } catch (error) {
            console.error("Error fetching user profile in AuthProvider:", error);
            setUser(serializeUser(firebaseUser));
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    } else {
      // Simulated session synchronization
      setLoading(true);
      const session = authService.getSimulatedSession();
      if (session) {
        setUser(session.user);
        setProfile(session.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  return <>{children}</>;
}
export default AuthProvider;
