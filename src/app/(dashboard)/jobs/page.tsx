"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { businessService } from "@/lib/business-service";
import { jobService } from "@/lib/job-service";
import { Job } from "@/types/job";
import { BusinessProfile } from "@/types/business";
import { JobDashboard } from "@/components/jobs/JobDashboard";
import { JobFormModal } from "@/components/jobs/JobFormModal";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import { Plus, Check, Loader2, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function StatusToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[10px] bg-brand-ink px-4 py-3 text-sm font-medium text-white shadow-lg border border-brand-hairline/20"
        >
          <Check className="h-4 w-4 shrink-0 text-brand-mint" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function JobsPage() {
  const { user, profile } = useAuthStore();
  const { setContext } = useHyperAIStore();
  const [businessProfile, setBusinessProfile] = React.useState<BusinessProfile | null>(null);

  // Gigs state
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedDetailJob, setSelectedDetailJob] = React.useState<Job | null>(null);
  const [selectedEditJob, setSelectedEditJob] = React.useState<Job | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = React.useState("");
  const [showToast, setShowToast] = React.useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load jobs based on role
  React.useEffect(() => {
    async function fetchJobs() {
      if (!user?.uid || !profile) return;
      setIsLoading(true);
      try {
        if (profile.role === "business") {
          const loadedBusinessProfile =
            (await businessService.getBusinessProfileByOwner(user.uid)) ??
            (await businessService.createDefaultBusinessProfile(
              user.uid,
              user.email || "",
              profile.name || user.displayName || "My Business Org"
            ));
          setBusinessProfile(loadedBusinessProfile);

          // Businesses see all of their own gig posts (both Drafts & Published)
          const data = await jobService.getJobs(user.uid);
          setJobs(data);
        } else {
          // Students see all Published gig posts in the marketplace
          const data = await jobService.getJobs(undefined, true);
          setJobs(data);
        }
      } catch (err) {
        console.error("Failed to load gig listings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [user, profile]);

  // ── HyperAI context injection: push first published job when list loads ──
  React.useEffect(() => {
    if (jobs.length === 0) return;
    const firstPublished = jobs.find((j) => j.status === "Published") ?? jobs[0];
    setContext({ activeJob: firstPublished });
    return () => setContext({ activeJob: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);


  if (!user || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">Resolving user session...</p>
        </div>
      </div>
    );
  }

  const isBusiness = profile.role === "business";
  const companyName =
    businessProfile?.companyName ||
    profile.name ||
    user.displayName ||
    "My Company";

  // CRUD event callbacks
  const handleAddSuccess = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    triggerToast(newJob.status === "Published" ? "Gig listing published successfully" : "Gig saved as draft");
  };

  const handleEditSuccess = (updatedJob: Job) => {
    setJobs((prev) =>
      prev.map((job) => (job.jobId === updatedJob.jobId ? updatedJob : job))
    );
    triggerToast("Gig listing updated successfully");
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setJobs((prev) => prev.filter((job) => job.jobId !== deletedId));
    triggerToast("Gig listing deleted successfully");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2.5">
              <Briefcase className="h-8 w-8 text-brand-ink shrink-0" />
              {isBusiness ? "Gig Listings" : "Gig Discoveries"}
            </h1>
            <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
              {isBusiness
                ? "Create, publish, and manage your organization's digital task and gig postings."
                : "Explore and search active digital gigs posted by local organizations."}
            </p>
          </div>

          {/* Post Gig trigger button (Business only) */}
          {isBusiness && (
            <button
              onClick={() => {
                setSelectedEditJob(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-all active:scale-98 shrink-0 self-start md:self-center shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Post New Gig
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-brand-hairline" />

        {/* Jobs Dashboard Container */}
        <JobDashboard
          jobs={jobs}
          isLoading={isLoading}
          onCardClick={(job) => {
            setSelectedDetailJob(job);
            // ── HyperAI context injection: push clicked job into assistant context
            setContext({ activeJob: job });
          }}
          onAddClick={() => {
            setSelectedEditJob(null);
            setIsFormOpen(true);
          }}
          canManage={isBusiness}
        />

        {/* Job Creation Form Modal */}
        <JobFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedEditJob(null);
          }}
          onSuccess={selectedEditJob ? handleEditSuccess : handleAddSuccess}
          editJob={selectedEditJob}
          businessId={user.uid}
          companyName={companyName}
        />

        {/* Job Details Modal */}
        <JobDetailsModal
          job={selectedDetailJob}
          isOpen={!!selectedDetailJob}
          onClose={() => setSelectedDetailJob(null)}
          onEdit={() => {
            setSelectedEditJob(selectedDetailJob);
            setIsFormOpen(true);
            setSelectedDetailJob(null);
          }}
          onDeleteSuccess={handleDeleteSuccess}
          canManage={isBusiness}
        />
      </div>

      {/* Success alert toast */}
      <StatusToast message={toastMessage} visible={showToast} />
    </>
  );
}
