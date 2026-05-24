"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { applicationService } from "@/lib/application-service";
import { Application } from "@/types/application";
import { ApplicationDashboard } from "@/components/applications/ApplicationDashboard";
import { ApplicationDetailModal } from "@/components/applications/ApplicationDetailModal";
import { FileText, Check, Loader2 } from "lucide-react";
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

export default function ApplicationsPage() {
  const { user, profile } = useAuthStore();
  const { setContext } = useHyperAIStore();
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedApp, setSelectedApp] = React.useState<Application | null>(null);
  const [toastMessage, setToastMessage] = React.useState("");
  const [showToast, setShowToast] = React.useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isBusiness = profile?.role === "business";

  React.useEffect(() => {
    async function fetchApplications() {
      if (!user?.uid || !profile) return;
      setIsLoading(true);
      try {
        if (isBusiness) {
          const data = await applicationService.getApplicationsByBusiness(user.uid);
          setApplications(data);
        } else {
          const data = await applicationService.getApplicationsByStudent(user.uid);
          setApplications(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, [user, profile, isBusiness]);

  // ── HyperAI context injection ──────────────────────────────────────────────
  // Push the first pending application into assistant context on load.
  React.useEffect(() => {
    if (applications.length === 0) return;
    const active = applications.find((a) => a.status === "Pending") ?? applications[0];
    setContext({ activeApplication: active });
    return () => setContext({ activeApplication: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications.length]);


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

  const handleStatusChange = (updated: Application) => {
    setApplications((prev) =>
      prev.map((a) => (a.applicationId === updated.applicationId ? updated : a))
    );
    triggerToast(`Application ${updated.status.toLowerCase()} successfully`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2.5">
              <FileText className="h-8 w-8 text-brand-ink shrink-0" />
              {isBusiness ? "Applications Received" : "My Applications"}
            </h1>
            <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
              {isBusiness
                ? "Review, shortlist, accept, or reject applications submitted by students for your gig listings."
                : "Track the status of all your submitted job applications in one place."}
            </p>
          </div>
        </div>

        <div className="border-t border-brand-hairline" />

        <ApplicationDashboard
          applications={applications}
          isLoading={isLoading}
          onCardClick={(app) => setSelectedApp(app)}
          isBusiness={isBusiness}
        />

        <ApplicationDetailModal
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          isBusiness={isBusiness}
          onStatusChange={handleStatusChange}
        />
      </div>

      <StatusToast message={toastMessage} visible={showToast} />
    </>
  );
}
