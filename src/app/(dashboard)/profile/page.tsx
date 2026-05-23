"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { StudentProfile, MOCK_PROFILE } from "@/types/profile";
import { Pencil, Eye, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const LOCAL_KEY = "hyperhire_student_profile";

function loadProfile(name: string, email: string): StudentProfile {
  if (typeof window === "undefined") return { ...MOCK_PROFILE, name, avatarInitials: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() };
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StudentProfile;
    } catch {/* fall through */}
  }
  // Seed from auth user
  return {
    ...MOCK_PROFILE,
    name,
    avatarInitials: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
  };
}

function saveProfile(p: StudentProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  }
}

function computeStrength(p: StudentProfile): number {
  let score = 0;
  if (p.name) score += 10;
  if (p.college) score += 10;
  if (p.bio && p.bio.length > 30) score += 15;
  if (p.skills.length >= 3) score += 15;
  if (p.skills.length >= 6) score += 5;
  if (p.preferredCategories.length >= 1) score += 10;
  if (p.hourlyRate > 0) score += 10;
  if (p.availability) score += 5;
  if (p.portfolioLinks.length >= 1) score += 10;
  if (p.socialLinks.github || p.socialLinks.linkedin) score += 10;
  return Math.min(score, 100);
}

type Tab = "view" | "edit";

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[10px] bg-brand-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <Check className="h-4 w-4 shrink-0 text-brand-mint" />
          Profile saved successfully
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProfilePage() {
  const { profile: authProfile } = useAuthStore();
  const authName = authProfile?.name || "Student User";
  const authEmail = authProfile?.email || "";

  const [profile, setProfile] = React.useState<StudentProfile>(() =>
    loadProfile(authName, authEmail)
  );
  const [tab, setTab] = React.useState<Tab>("view");
  const [isSaving, setIsSaving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  // Keep profile name in sync with auth name if not manually changed
  React.useEffect(() => {
    if (!localStorage.getItem(LOCAL_KEY) && authName) {
      setProfile(prev => ({
        ...prev,
        name: authName,
        avatarInitials: authName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      }));
    }
  }, [authName]);

  function handleChange(partial: Partial<StudentProfile>) {
    setProfile(prev => {
      const updated = { ...prev, ...partial };
      updated.profileStrength = computeStrength(updated);
      return updated;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    // Simulate async save (swap with Firestore call when ready)
    await new Promise(r => setTimeout(r, 600));
    saveProfile(profile);
    setIsSaving(false);
    setTab("view");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink">My Profile</h1>
            <p className="mt-1.5 text-sm text-brand-body">
              {tab === "view"
                ? "Your public profile visible to businesses and the talent pool."
                : "Update your profile information. Changes are saved locally."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-1">
            {([
              { key: "view" as Tab, label: "View", icon: Eye },
              { key: "edit" as Tab, label: "Edit", icon: Pencil },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-xs font-semibold transition-colors",
                  tab === key
                    ? "bg-white text-brand-ink shadow-sm"
                    : "text-brand-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left: Profile Card (always visible) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProfileCard profile={profile} />
          </div>

          {/* Right: view or edit */}
          <AnimatePresence mode="wait">
            {tab === "view" ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileDetails profile={profile} />
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <ProfileEditForm profile={profile} onChange={handleChange} />

                {/* Save bar */}
                <div className="flex items-center justify-end gap-3 rounded-[10px] border border-brand-hairline bg-white px-4 py-3">
                  <button
                    onClick={() => setTab("view")}
                    className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface-soft"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-active disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SaveToast visible={showToast} />
    </>
  );
}
