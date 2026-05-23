"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { portfolioService } from "@/lib/portfolio-service";
import { PortfolioItem } from "@/types/portfolio";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioUploadModal } from "@/components/portfolio/PortfolioUploadModal";
import { PortfolioDetailModal } from "@/components/portfolio/PortfolioDetailModal";
import { Plus, Check, Loader2, FolderKanban } from "lucide-react";
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

export default function PortfolioPage() {
  const { user, profile } = useAuthStore();
  
  // Portfolios state
  const [items, setItems] = React.useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = React.useState<PortfolioItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = React.useState<PortfolioItem | null>(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = React.useState("");
  const [showToast, setShowToast] = React.useState(false);

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load portfolios
  React.useEffect(() => {
    async function loadPortfolios() {
      if (!user?.uid || !profile) return;
      setIsLoading(true);
      try {
        // If user is a student, fetch their own portfolio
        // If user is a business, fetch all student portfolios for discovery!
        const filterUid = profile.role === "student" ? user.uid : undefined;
        const fetched = await portfolioService.getPortfolios(filterUid);
        setItems(fetched);
      } catch (err) {
        console.error("Failed to load portfolio items", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolios();
  }, [user, profile]);

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

  const isStudent = profile.role === "student";

  // CRUD event callbacks
  const handleAddSuccess = (newItem: PortfolioItem) => {
    setItems((prev) => [newItem, ...prev]);
    showSuccessToast("Project published successfully");
  };

  const handleEditSuccess = (updatedItem: PortfolioItem) => {
    setItems((prev) =>
      prev.map((item) =>
        item.portfolioId === updatedItem.portfolioId ? updatedItem : item
      )
    );
    showSuccessToast("Project updated successfully");
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setItems((prev) => prev.filter((item) => item.portfolioId !== deletedId));
    showSuccessToast("Project deleted successfully");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2">
              <FolderKanban className="h-8 w-8 text-brand-ink shrink-0" />
              {isStudent ? "Portfolio Workspace" : "Student Discoveries"}
            </h1>
            <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
              {isStudent
                ? "Showcase your capabilities. Upload images, videos, PDFs, and project links for local businesses to review."
                : "Explore outstanding portfolios, case studies, and code repositories uploaded by students in the local marketplace."}
            </p>
          </div>

          {/* Upload project trigger (students only) */}
          {isStudent && (
            <button
              onClick={() => {
                setSelectedEditItem(null);
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-all active:scale-98 shrink-0 self-start md:self-center shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Upload Project
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-brand-hairline" />

        {/* Portfolios Grid Workspace */}
        <PortfolioGrid
          items={items}
          isLoading={isLoading}
          onCardClick={(item) => setSelectedDetailItem(item)}
          onAddClick={() => {
            setSelectedEditItem(null);
            setIsUploadOpen(true);
          }}
          canManage={isStudent}
        />

        {/* Upload & Edit Modal */}
        <PortfolioUploadModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setSelectedEditItem(null);
          }}
          onSuccess={selectedEditItem ? handleEditSuccess : handleAddSuccess}
          editItem={selectedEditItem}
          userId={user.uid}
        />

        {/* Detail Modal */}
        <PortfolioDetailModal
          item={selectedDetailItem}
          isOpen={!!selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          onEdit={() => {
            setSelectedEditItem(selectedDetailItem);
            setIsUploadOpen(true);
            setSelectedDetailItem(null);
          }}
          onDeleteSuccess={handleDeleteSuccess}
          canManage={isStudent}
        />
      </div>

      {/* Success alert toast */}
      <StatusToast message={toastMessage} visible={showToast} />
    </>
  );
}
