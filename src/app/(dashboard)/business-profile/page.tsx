"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { businessService } from "@/lib/business-service";
import { BusinessProfile, MOCK_BUSINESS_PROFILE } from "@/types/business";
import { BusinessProfileCard } from "@/components/business/BusinessProfileCard";
import { BusinessProfileDetails } from "@/components/business/BusinessProfileDetails";
import { BusinessProfileEditForm } from "@/components/business/BusinessProfileEditForm";
import { Pencil, Eye, Check, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { uploadFile } from "@/lib/cloudinary";

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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[10px] bg-brand-ink px-4 py-3 text-sm font-medium text-white shadow-lg border border-brand-hairline/25"
        >
          <Check className="h-4 w-4 shrink-0 text-brand-mint" />
          <span>Company profile saved successfully</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function BusinessProfilePage() {
  const { user, profile: authProfile } = useAuthStore();
  
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [draft, setDraft] = React.useState<BusinessProfile | null>(null);
  const [tab, setTab] = React.useState<Tab>("view");
  const [isSaving, setIsSaving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Logo upload / crop state
  const [isCropping, setIsCropping] = React.useState(false);
  const [cropImageSrc, setCropImageSrc] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        if (authProfile?.role === "business") {
          // Fetch profile or auto-create if missing
          let busProfile = await businessService.getBusinessProfileByOwner(user.uid);
          if (!busProfile) {
            busProfile = await businessService.createDefaultBusinessProfile(
              user.uid,
              user.email || "",
              user.displayName || "My Business Org"
            );
          }
          setProfile(busProfile);
          setDraft(busProfile);
        } else {
          // If student user, show mock company profile in preview mode
          setProfile(MOCK_BUSINESS_PROFILE);
          setDraft(MOCK_BUSINESS_PROFILE);
        }
      } catch (error) {
        console.error("Failed to load business profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, authProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsCropping(false);
    setIsSaving(true);
    try {
      const uploadResult = await uploadFile(croppedFile);
      handleChange({ logoUrl: uploadResult.url });
    } catch (err) {
      console.error("Failed to upload business logo to Cloudinary:", err);
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  function handleChange(partial: Partial<BusinessProfile>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }

  async function handleSave() {
    if (!profile?.businessId || !draft) return;
    setIsSaving(true);
    try {
      const updateData = {
        companyName: draft.companyName,
        industry: draft.industry,
        description: draft.description,
        location: draft.location,
        website: draft.website,
        companySize: draft.companySize,
        hiringPreferences: draft.hiringPreferences,
        budgetRange: draft.budgetRange,
        logoUrl: draft.logoUrl,
      };

      const updated = await businessService.updateBusinessProfile(profile.businessId, updateData);
      setProfile(updated);
      setDraft(updated);
      setTab("view");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleTabChange(t: Tab) {
    if (t === "edit" && profile) setDraft(profile);
    setTab(t);
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">Loading organization workspace...</p>
        </div>
      </div>
    );
  }

  const isBusinessUser = authProfile?.role === "business";
  const displayProfile = tab === "edit" && draft ? draft : profile;

  return (
    <>
      <div className="space-y-6">
        {/* Role Warning Banner for students */}
        {!isBusinessUser && (
          <div className="flex items-start gap-3 rounded-[10px] border border-[#d9a441]/30 bg-[#f5e9d4]/30 p-4 text-sm text-[#aa2d00]">
            <Info className="h-5 w-5 shrink-0 text-[#d9a441]" />
            <div className="space-y-1">
              <p className="font-semibold leading-none">Preview Mode (Logged in as Student)</p>
              <p className="text-xs text-brand-body leading-relaxed mt-1">
                You are viewing the business organization portal. Students see this section as a read-only preview. Business accounts use this workspace to customize their corporate profile, logo, and hiring preferences.
              </p>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink">
              Company Profile
            </h1>
            <p className="mt-1.5 text-sm text-brand-body">
              {tab === "view"
                ? "Your company profile as visible to students and the talent pool."
                : "Update your organization identity, location, size, and branding details."}
            </p>
          </div>

          {/* Tab switcher (Only visible to business owners) */}
          {isBusinessUser && (
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
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left Side: Business profile card */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <BusinessProfileCard
              profile={displayProfile}
              isEditing={tab === "edit" && isBusinessUser}
              onLogoClick={() => fileInputRef.current?.click()}
            />
          </div>

          {/* Right Side: details or edit form */}
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
              isBusinessUser && draft && (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <BusinessProfileEditForm profile={draft} onChange={handleChange} />

                  {/* Save action bar */}
                  <div className="flex items-center justify-end gap-3 rounded-[10px] border border-brand-hairline bg-white px-4 py-3 shadow-sm">
                    <button
                      onClick={() => setTab("view")}
                      disabled={isSaving}
                      className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-all active:scale-98 disabled:opacity-60"
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
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <ImageCropperModal
        isOpen={isCropping}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropping(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onCropComplete={handleCropComplete}
      />

      <SaveToast visible={showToast} />
    </>
  );
}
