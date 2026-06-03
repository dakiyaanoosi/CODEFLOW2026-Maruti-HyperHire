"use client";

import * as React from "react";
import { profileService, getAvatarInitials } from "@/lib/profile-service";
import { StudentProfile } from "@/types/profile";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { portfolioService } from "@/lib/portfolio-service";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioDetailModal } from "@/components/portfolio/PortfolioDetailModal";
import { PortfolioItem } from "@/types/portfolio";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [portfolioItems, setPortfolioItems] = React.useState<PortfolioItem[]>([]);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = React.useState(true);
  const [selectedDetailItem, setSelectedDetailItem] = React.useState<PortfolioItem | null>(null);
  
  const router = useRouter();

  React.useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      try {
        const fetched = await profileService.getProfile(id);
        if (fetched) {
          setProfile({
            name: fetched.name || "Unknown Candidate",
            college: fetched.college || "",
            bio: fetched.bio || "",
            skills: fetched.skills || [],
            experienceLevel: fetched.experienceLevel || "Beginner",
            availability: fetched.availability || "",
            preferredCategories: (fetched.preferredCategories as any) || [],
            hourlyRate: fetched.hourlyRate || 0,
            portfolioLinks: fetched.portfolioLinks || [],
            socialLinks: fetched.socialLinks || {},
            trustScore: fetched.trustScore ?? 0,
            isVerified: fetched.verificationStatus === "Verified" || (fetched as any).isVerified || false,
            profileStrength: fetched.profileStrength || 10,
            avatarInitials: fetched.avatarInitials || getAvatarInitials(fetched.name),
            avatarUrl: fetched.avatarUrl || "",
            averageRating: (fetched as any).averageRating ?? 0,
            reviewCount: (fetched as any).reviewCount ?? 0,
            repeatClientRate: (fetched as any).repeatClientRate ?? 0,
            verifiedProjectsCount: (fetched as any).verifiedProjectsCount ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch public profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  React.useEffect(() => {
    async function loadPortfolios() {
      if (!id) return;
      setIsLoadingPortfolios(true);
      try {
        const fetched = await portfolioService.getPortfolios(id);
        setPortfolioItems(fetched);
      } catch (err) {
        console.error("Failed to load public portfolio items", err);
      } finally {
        setIsLoadingPortfolios(false);
      }
    }
    loadPortfolios();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-xl font-semibold text-brand-ink">Profile Not Found</h2>
        <p className="text-brand-muted text-sm">The candidate you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.back()} className="text-brand-primary text-sm font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-brand-hairline hover:bg-brand-surface text-brand-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink">{profile.name}'s Profile</h1>
            <p className="mt-1.5 text-sm text-brand-body">
              Public workspace profile and portfolio details.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProfileCard
              profile={profile}
              isEditing={false}
            />
          </div>

          <div className="space-y-6">
            <ProfileDetails profile={profile} userId={id} />
            
            <div className="border-t border-brand-hairline pt-6">
              <h2 className="text-xl font-normal leading-[1.2] text-brand-ink mb-4">
                Portfolio Projects
              </h2>
              <PortfolioGrid
                items={portfolioItems}
                isLoading={isLoadingPortfolios}
                onCardClick={(item) => setSelectedDetailItem(item)}
                onAddClick={() => {}}
                canManage={false}
              />
            </div>
          </div>
        </div>
      </div>

      <PortfolioDetailModal
        item={selectedDetailItem}
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onEdit={() => {}}
        onDeleteSuccess={() => {}}
        canManage={false}
      />
    </>
  );
}
