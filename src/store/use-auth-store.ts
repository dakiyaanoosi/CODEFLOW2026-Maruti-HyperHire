import { create } from "zustand";

export interface SerializedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  role: "student" | "business";
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: SerializedUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: SerializedUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (authError) => set({ authError }),
  clearAuth: () => set({ user: null, profile: null, authError: null }),
}));
export type { AuthState };
