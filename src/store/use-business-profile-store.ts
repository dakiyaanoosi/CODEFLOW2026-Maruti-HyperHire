import { create } from "zustand";
import { BusinessProfile, MOCK_BUSINESS_PROFILE } from "@/types/business";

interface BusinessProfileState {
  profile: BusinessProfile;
  setProfile: (p: BusinessProfile) => void;
  updateProfile: (partial: Partial<BusinessProfile>) => void;
}

export const useBusinessProfileStore = create<BusinessProfileState>((set) => ({
  profile: MOCK_BUSINESS_PROFILE,
  setProfile: (profile) => set({ profile }),
  updateProfile: (partial) =>
    set((state) => ({ profile: { ...state.profile, ...partial } })),
}));
