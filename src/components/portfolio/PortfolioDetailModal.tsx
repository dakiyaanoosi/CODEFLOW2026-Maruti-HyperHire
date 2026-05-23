"use client";

import * as React from "react";
import { X, Calendar, Folder, ExternalLink, Pencil, Trash2, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { PortfolioItem } from "@/types/portfolio";
import { portfolioService } from "@/lib/portfolio-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioDetailModalProps {
  item: PortfolioItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleteSuccess: (portfolioId: string) => void;
  canManage?: boolean;
}

export function PortfolioDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDeleteSuccess,
  canManage = true,
}: PortfolioDetailModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await portfolioService.deletePortfolioItem(item.portfolioId);
      onDeleteSuccess(item.portfolioId);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to delete project. Please try again.");
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const renderMediaViewer = () => {
    switch (item.mediaType) {
      case "image":
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden bg-brand-surface-soft flex items-center justify-center border-b border-brand-hairline">
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="max-h-[60vh] w-auto max-w-full object-contain"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative w-full bg-black flex items-center justify-center border-b border-brand-hairline">
            <video
              src={item.mediaUrl}
              poster={item.thumbnailUrl}
              controls
              playsInline
              className="w-full max-h-[60vh] object-contain"
            />
          </div>
        );
      case "pdf":
        return (
          <div className="relative w-full bg-brand-surface-soft p-4 flex flex-col items-center justify-center border-b border-brand-hairline gap-4">
            <div className="w-full h-[50vh] rounded-[10px] overflow-hidden border border-brand-hairline bg-white shadow-sm">
              <iframe
                src={`${item.mediaUrl}#toolbar=0`}
                className="w-full h-full"
                title={`${item.title} PDF Document`}
              />
            </div>
            <a
              href={item.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[8px] bg-white border border-brand-hairline px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open PDF in New Tab
            </a>
          </div>
        );
      case "link":
        return (
          <div className="w-full border-b border-brand-hairline bg-gradient-to-tr from-brand-ink to-[#41454d] p-10 flex flex-col items-center justify-center text-center text-white gap-4">
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-md">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h4 className="text-base font-semibold">External Project Link</h4>
              <p className="text-xs text-white/70 leading-relaxed truncate max-w-xs md:max-w-md">
                {item.mediaUrl}
              </p>
            </div>
            <a
              href={item.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[12px] bg-white px-5 py-2.5 text-xs font-semibold text-brand-ink hover:bg-white/90 shadow-md transition-all active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Live Project Website
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-[12px] border border-brand-hairline bg-white shadow-2xl overflow-hidden text-brand-ink"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-brand-hairline px-6 bg-brand-surface-soft shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="rounded-[6px] bg-brand-ink text-white px-2 py-0.5 text-[10px] font-semibold uppercase font-mono">
                {item.mediaType}
              </span>
              <span className="text-xs font-semibold text-brand-muted flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                {item.category}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink transition-colors p-1"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="m-6 flex items-start gap-2 rounded-[6px] bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Media Viewer */}
            {renderMediaViewer()}

            {/* Content Details */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl md:text-2xl font-semibold leading-[1.3] text-brand-ink">
                    {item.title}
                  </h1>
                  <p className="text-xs text-brand-muted flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Published on {formattedDate}
                  </p>
                </div>

                {/* Edit / Delete actions for student manager */}
                {canManage && !showDeleteConfirm && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onEdit}
                      className="flex items-center gap-1.5 rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Project
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 rounded-[8px] border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Delete confirmation panel */}
              {showDeleteConfirm && (
                <div className="rounded-[10px] border border-red-200 bg-red-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-800">Confirm Deletion</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                        Are you sure you want to delete this project? This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="rounded-[8px] border border-brand-hairline bg-white px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 rounded-[8px] bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, Delete Project"
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-brand-hairline/80" />

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Project Description
                </h3>
                <p className="text-sm text-brand-body leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>

              {/* Skills Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Skills & Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-[8px] bg-brand-surface-soft px-3 py-1.5 text-xs font-medium text-brand-muted border border-brand-hairline"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
