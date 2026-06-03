import { create } from "zustand";
import { BusinessProfile } from "@/types/business";

interface BusinessProfileState {
  profile: BusinessProfile | null;
  setProfile: (p: BusinessProfile) => void;
  updateProfile: (partial: Partial<BusinessProfile>) => void;
}

export const useBusinessProfileStore = create<BusinessProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : null,
    })),
}));
