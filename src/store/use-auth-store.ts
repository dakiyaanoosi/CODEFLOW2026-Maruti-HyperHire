import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ExperienceLevel, WorkCategory, SocialLinks } from "@/types/profile";

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
  updatedAt?: string;
  // Student Profile fields
  bio?: string;
  college?: string;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  availability?: string;
  preferredCategories?: WorkCategory[];
  hourlyRate?: number;
  portfolioLinks?: string[];
  socialLinks?: SocialLinks;
  trustScore?: number;
  verificationStatus?: "Verified" | "Unverified";
  profileStrength?: number;
  avatarInitials?: string;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      authError: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (authError) => set({ authError }),
      clearAuth: () => set({ user: null, profile: null, authError: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as any))),
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);
export type { AuthState };
