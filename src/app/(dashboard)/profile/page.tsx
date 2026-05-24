"use client";

import * as React from "react";
import { useAuthStore, UserProfile } from "@/store/use-auth-store";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { StudentProfile } from "@/types/profile";
import { Pencil, Eye, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { profileService, computeProfileStrength, getAvatarInitials } from "@/lib/profile-service";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { uploadFile } from "@/lib/cloudinary";
import { portfolioService } from "@/lib/portfolio-service";

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
  const { user, profile: authProfile, setProfile: setAuthProfile } = useAuthStore();
  const { setContext } = useHyperAIStore();
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [tab, setTab] = React.useState<Tab>("view");
  const [isSaving, setIsSaving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // ── HyperAI context injection ──────────────────────────────────────────────
  // Push the student profile + portfolio into HyperAI whenever they load or change.
  React.useEffect(() => {
    if (!user?.uid || !profile) return;

    let cancelled = false;
    portfolioService.getPortfolios(user.uid).then((portfolios) => {
      if (!cancelled) {
        setContext({ activeProfile: profile, activePortfolio: portfolios });
      }
    }).catch(() => {
      if (!cancelled) setContext({ activeProfile: profile });
    });

    return () => {
      cancelled = true;
      setContext({ activeProfile: null, activePortfolio: null });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name, profile?.skills?.length, profile?.trustScore, user?.uid]);


  // Avatar upload / crop state
  const [isCropping, setIsCropping] = React.useState(false);
  const [cropImageSrc, setCropImageSrc] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        setIsLoading(true);
        try {
          const fetched = await profileService.getProfile(user.uid);
          if (fetched) {
            setProfile({
              name: fetched.name || "",
              college: fetched.college || "",
              bio: fetched.bio || "",
              skills: fetched.skills || [],
              experienceLevel: fetched.experienceLevel || "Beginner",
              availability: fetched.availability || "",
              preferredCategories: (fetched.preferredCategories as any) || [],
              hourlyRate: fetched.hourlyRate || 0,
              portfolioLinks: fetched.portfolioLinks || [],
              socialLinks: fetched.socialLinks || {},
              trustScore: fetched.trustScore || 80,
              isVerified: fetched.verificationStatus === "Verified" || (fetched as any).isVerified || false,
              profileStrength: fetched.profileStrength || 10,
              avatarInitials: fetched.avatarInitials || getAvatarInitials(fetched.name),
              avatarUrl: fetched.avatarUrl || "",
            });
          } else {
            const seeded = await profileService.createDefaultStudentProfile(
              user.uid,
              user.email || "",
              user.displayName || "Student User"
            );
            setProfile({
              name: seeded.name,
              college: seeded.college || "",
              bio: seeded.bio || "",
              skills: seeded.skills || [],
              experienceLevel: seeded.experienceLevel || "Beginner",
              availability: seeded.availability || "",
              preferredCategories: (seeded.preferredCategories as any) || [],
              hourlyRate: seeded.hourlyRate || 0,
              portfolioLinks: seeded.portfolioLinks || [],
              socialLinks: seeded.socialLinks || {},
              trustScore: seeded.trustScore || 80,
              isVerified: seeded.verificationStatus === "Verified",
              profileStrength: seeded.profileStrength || 10,
              avatarInitials: seeded.avatarInitials || "ST",
              avatarUrl: seeded.avatarUrl || "",
            });
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [user]);

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
      handleChange({ avatarUrl: uploadResult.url });
    } catch (err) {
      console.error("Failed to upload avatar to Cloudinary:", err);
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  function handleChange(partial: Partial<StudentProfile>) {
    if (!profile) return;
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      const mappingForStrength: Partial<UserProfile> = {
        name: updated.name,
        college: updated.college,
        bio: updated.bio,
        skills: updated.skills,
        experienceLevel: updated.experienceLevel,
        availability: updated.availability,
        preferredCategories: updated.preferredCategories,
        hourlyRate: updated.hourlyRate,
        portfolioLinks: updated.portfolioLinks,
        socialLinks: updated.socialLinks,
        avatarUrl: updated.avatarUrl,
      };
      updated.profileStrength = computeProfileStrength(mappingForStrength);
      return updated;
    });
  }

  async function handleSave() {
    if (!user?.uid || !profile) return;
    setIsSaving(true);
    try {
      const updateData: Partial<UserProfile> = {
        name: profile.name,
        college: profile.college,
        bio: profile.bio,
        skills: profile.skills,
        experienceLevel: profile.experienceLevel,
        availability: profile.availability,
        preferredCategories: profile.preferredCategories,
        hourlyRate: profile.hourlyRate,
        portfolioLinks: profile.portfolioLinks,
        socialLinks: profile.socialLinks,
        trustScore: profile.trustScore,
        verificationStatus: profile.isVerified ? "Verified" : "Unverified",
        avatarUrl: profile.avatarUrl,
      };

      const updated = await profileService.updateProfile(user.uid, updateData);
      setAuthProfile(updated);
      
      setProfile({
        name: updated.name,
        college: updated.college || "",
        bio: updated.bio || "",
        skills: updated.skills || [],
        experienceLevel: updated.experienceLevel || "Beginner",
        availability: updated.availability || "",
        preferredCategories: (updated.preferredCategories as any) || [],
        hourlyRate: updated.hourlyRate || 0,
        portfolioLinks: updated.portfolioLinks || [],
        socialLinks: updated.socialLinks || {},
        trustScore: updated.trustScore || 80,
        isVerified: updated.verificationStatus === "Verified" || (updated as any).isVerified || false,
        profileStrength: updated.profileStrength || 10,
        avatarInitials: updated.avatarInitials || "ST",
        avatarUrl: updated.avatarUrl || "",
      });

      setTab("view");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">Loading profile workspace...</p>
        </div>
      </div>
    );
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
                : "Update your profile information. Changes will be saved to your cloud profile."}
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
            <ProfileCard
              profile={profile}
              isEditing={tab === "edit"}
              onAvatarClick={() => fileInputRef.current?.click()}
            />
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
