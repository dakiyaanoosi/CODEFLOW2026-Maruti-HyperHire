"use client";

import * as React from "react";
import { Pencil, Eye, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BusinessProfileCard } from "@/components/business/BusinessProfileCard";
import { BusinessProfileDetails } from "@/components/business/BusinessProfileDetails";
import { BusinessProfileEditForm } from "@/components/business/BusinessProfileEditForm";
import { BusinessProfile, MOCK_BUSINESS_PROFILE } from "@/types/business";

const LOCAL_KEY = "hyperhire_business_profile";

function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") return MOCK_BUSINESS_PROFILE;
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as BusinessProfile;
    } catch {/* fall through */}
  }
  return MOCK_BUSINESS_PROFILE;
}

function saveProfile(p: BusinessProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  }
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
          Company profile saved
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = React.useState<BusinessProfile>(loadProfile);
  const [draft, setDraft] = React.useState<BusinessProfile>(profile);
  const [tab, setTab] = React.useState<Tab>("view");
  const [isSaving, setIsSaving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  function handleChange(partial: Partial<BusinessProfile>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveProfile(draft);
    setProfile(draft);
    setIsSaving(false);
    setTab("view");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  function handleTabChange(t: Tab) {
    if (t === "edit") setDraft(profile);
    setTab(t);
  }

  const displayProfile = tab === "edit" ? draft : profile;

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink">
              Company Profile
            </h1>
            <p className="mt-1.5 text-sm text-brand-body">
              {tab === "view"
                ? "Your public company profile visible to students and the talent pool."
                : "Update your company profile. Changes are saved locally."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-1">
            {(
              [
                { key: "view" as Tab, label: "View", icon: Eye },
                { key: "edit" as Tab, label: "Edit", icon: Pencil },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
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
          {/* Left: always shows live/draft data */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <BusinessProfileCard profile={displayProfile} />
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
                <BusinessProfileDetails profile={profile} />
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
                <BusinessProfileEditForm profile={draft} onChange={handleChange} />

                {/* Save bar */}
                <div className="flex items-center justify-end gap-3 rounded-[10px] border border-brand-hairline bg-white px-4 py-3">
                  <button
                    onClick={() => setTab("view")}
                    className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
