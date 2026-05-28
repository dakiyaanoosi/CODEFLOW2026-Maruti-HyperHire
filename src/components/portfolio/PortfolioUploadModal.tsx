"use client";

import * as React from "react";
import { X, Upload, Link2, Plus, AlertCircle, FileText, CheckCircle2, Film, Loader2 } from "lucide-react";
import { ALL_CATEGORIES, WorkCategory } from "@/types/profile";
import { PortfolioItem, PortfolioMediaType } from "@/types/portfolio";
import { uploadFile } from "@/lib/cloudinary";
import { portfolioService } from "@/lib/portfolio-service";
import { aiService } from "@/services/ai/service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: PortfolioItem) => void;
  editItem?: PortfolioItem | null;
  userId: string;
}

export function PortfolioUploadModal({
  isOpen,
  onClose,
  onSuccess,
  editItem = null,
  userId,
}: PortfolioUploadModalProps) {
  const isEditMode = !!editItem;

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [mediaType, setMediaType] = React.useState<PortfolioMediaType>("image");
  const [mediaUrl, setMediaUrl] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [aiSummary, setAiSummary] = React.useState("");

  // Uploading / Status States
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load editing item details if present
  React.useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setTitle(editItem.title);
        setDescription(editItem.description);
        setCategory(editItem.category);
        setMediaType(editItem.mediaType);
        setMediaUrl(editItem.mediaUrl);
        setThumbnailUrl(editItem.thumbnailUrl || "");
        setTags(editItem.tags || []);
        setAiSummary(editItem.aiSummary || "");
        setUploadSuccess(true);
      } else {
        // Reset state for new item
        setTitle("");
        setDescription("");
        setCategory(ALL_CATEGORIES[0] || "");
        setMediaType("image");
        setMediaUrl("");
        setThumbnailUrl("");
        setTags([]);
        setAiSummary("");
        setSelectedFile(null);
        setUploadProgress(null);
        setIsUploading(false);
        setUploadSuccess(false);
      }
      setError(null);
    }
  }, [isOpen, editItem]);

  // Adjust category if it's empty
  React.useEffect(() => {
    if (!category && ALL_CATEGORIES.length > 0) {
      setCategory(ALL_CATEGORIES[0]);
    }
  }, [category]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Validate file type based on chosen mediaType
    setError(null);
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, GIF).");
      return;
    }
    if (mediaType === "video" && !file.type.startsWith("video/")) {
      setError("Please select a valid video file (MP4, WebM, OGG).");
      return;
    }
    if (mediaType === "pdf" && file.type !== "application/pdf") {
      setError("Please select a valid PDF document.");
      return;
    }

    setSelectedFile(file);
    startUpload(file);
  };

  // Perform upload
  const startUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadSuccess(false);

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      setMediaUrl(result.url);
      if (result.thumbnailUrl) {
        setThumbnailUrl(result.thumbnailUrl);
      }
      setUploadSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Tags Tagger Logic
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const formatted = tagInput.trim().replace(/,/g, "");
    if (formatted && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
      setTagInput("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };



  // Save Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      setError("Please fill out all required fields.");
      return;
    }

    if (mediaType !== "link" && !mediaUrl) {
      setError("Please upload a file or wait for the upload to complete.");
      return;
    }

    if (mediaType === "link" && !mediaUrl.trim()) {
      setError("Please enter a project link.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Package item metadata
      const itemData = {
        userId,
        title: title.trim(),
        description: description.trim(),
        category,
        mediaType,
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        tags,
        aiSummary: aiSummary.trim() || undefined,
      };

      let savedItem: PortfolioItem;

      if (isEditMode && editItem) {
        savedItem = await portfolioService.updatePortfolioItem(editItem.portfolioId, itemData);
      } else {
        savedItem = await portfolioService.createPortfolioItem(itemData);
      }

      onSuccess(savedItem);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save portfolio item. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-ink/40"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-[12px] border border-brand-hairline bg-white shadow-2xl overflow-hidden text-brand-ink"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-brand-hairline px-6 bg-brand-surface-soft">
            <h2 className="text-base font-semibold leading-none text-brand-ink">
              {isEditMode ? "Edit Portfolio Project" : "Add Portfolio Project"}
            </h2>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink transition-colors p-1"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-[6px] bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Media Type Selector */}
            {!isEditMode && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Project Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { type: "image", label: "Image" },
                    { type: "video", label: "Video" },
                    { type: "pdf", label: "PDF" },
                    { type: "link", label: "External Link" },
                  ] as const).map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setMediaType(type);
                        setMediaUrl("");
                        setThumbnailUrl("");
                        setSelectedFile(null);
                        setUploadProgress(null);
                        setUploadSuccess(false);
                      }}
                      className={cn(
                        "rounded-[10px] border py-2.5 text-xs font-semibold transition-all text-center",
                        mediaType === type
                          ? "border-brand-ink bg-brand-ink text-white"
                          : "border-brand-hairline bg-white text-brand-muted hover:border-brand-ink hover:text-brand-ink"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area / Link Input */}
            {mediaType === "link" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  Project URL <span className="text-brand-coral">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://behance.net/gallery/... or github.com/..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  required={mediaType === "link"}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Project File <span className="text-brand-coral">*</span>
                </label>

                {/* Drag zone */}
                {!uploadSuccess && !isUploading && (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed py-10 px-4 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-brand-info bg-brand-surface-soft"
                        : "border-brand-hairline bg-brand-surface-soft/40 hover:bg-brand-surface-soft"
                    )}
                  >
                    <Upload className="h-8 w-8 text-brand-muted mb-3" />
                    <p className="text-sm font-medium text-brand-ink">
                      Drag & drop your {mediaType} file here, or{" "}
                      <span className="text-brand-link">browse</span>
                    </p>
                    <p className="text-xs text-brand-muted mt-1.5 font-medium">
                      {mediaType === "image"
                        ? "Supports PNG, JPG, GIF, WebP (Max 10MB)"
                        : mediaType === "video"
                        ? "Supports MP4, WebM (Max 50MB)"
                        : "Supports PDF (Max 20MB)"}
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={
                        mediaType === "image"
                          ? "image/*"
                          : mediaType === "video"
                          ? "video/*"
                          : "application/pdf"
                      }
                      className="hidden"
                    />
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && uploadProgress !== null && (
                  <div className="rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-brand-ink">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-link" />
                        Uploading {selectedFile?.name || "file"}...
                      </span>
                      <span className="text-brand-muted font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-brand-hairline/60">
                      <div
                        className="bg-brand-ink h-full rounded-full transition-all duration-100"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Success Feedback */}
                {uploadSuccess && (
                  <div className="rounded-[10px] border border-brand-hairline p-4 bg-brand-surface-soft flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="h-5 w-5 text-brand-success shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-ink truncate">
                          {selectedFile ? selectedFile.name : "Uploaded Asset"}
                        </p>
                        <p className="text-[11px] text-brand-muted flex items-center gap-1.5 capitalize font-medium">
                          {mediaType === "video" ? <Film className="h-3 w-3" /> : mediaType === "pdf" ? <FileText className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          Ready to sync with profile
                        </p>
                      </div>
                    </div>
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadSuccess(false);
                          setMediaUrl("");
                          setThumbnailUrl("");
                          setSelectedFile(null);
                          setUploadProgress(null);
                        }}
                        className="rounded-[8px] border border-brand-hairline bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
                      >
                        Replace
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Project Title <span className="text-brand-coral">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="E.g., Hyperlocal Delivery App Redesign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Description <span className="text-brand-coral">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Explain the background, key deliverables, and your exact contribution..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border resize-none leading-relaxed"
                required
              />
            </div>



            {/* Category & Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Category <span className="text-brand-coral">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  required
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Tagger */}
              <div className="space-y-2">
                <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Skills & Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    type="text"
                    placeholder="E.g., Next.js, UI Design"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 h-11 px-4 text-sm bg-white rounded-[6px] border border-brand-hairline outline-none focus:border-brand-info-border"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="h-11 px-4 rounded-[6px] bg-brand-surface-soft border border-brand-hairline text-brand-ink text-sm font-semibold hover:bg-brand-surface-strong transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    onClick={() => removeTag(idx)}
                    className="group rounded-[8px] bg-brand-surface-soft px-2.5 py-1 text-xs font-medium text-brand-muted border border-brand-hairline/80 flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    title="Click to remove"
                  >
                    {tag}
                    <X className="h-3 w-3 text-brand-muted group-hover:text-red-500" />
                  </span>
                ))}
              </div>
            )}
          </form>

          {/* Footer Bar */}
          <div className="flex h-16 items-center justify-end gap-3 border-t border-brand-hairline px-6 bg-brand-surface-soft/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isUploading || (mediaType !== "link" && !mediaUrl)}
              className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Publish Project"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
