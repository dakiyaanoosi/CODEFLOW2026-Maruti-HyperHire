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
            // Get user profile metadata from Firestore
            const docRef = doc(db!, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              setUser(serializeUser(firebaseUser));
              setProfile(profile);
            } else {
              // Handle edge case where Firestore doc hasn't been created yet
              setUser(serializeUser(firebaseUser));
              setProfile(null);
            }
          } catch (error) {
            console.error("Error fetching user profile from Firestore:", error);
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
