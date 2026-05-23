"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { authService, serializeUser } from "@/lib/auth-service";
import { useAuthStore, UserProfile } from "@/store/use-auth-store";
import { profileService } from "@/lib/profile-service";

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
            // Get user profile metadata from Firestore, auto-create if missing
            const profile = await profileService.ensureProfileExists(
              firebaseUser.uid,
              firebaseUser.email || "",
              firebaseUser.displayName || "Student User"
            );
            setUser(serializeUser(firebaseUser));
            setProfile(profile);
          } catch (error) {
            console.error("Error fetching or creating user profile in AuthProvider:", error);
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
