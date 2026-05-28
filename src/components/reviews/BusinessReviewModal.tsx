"use client";

import * as React from "react";
import { Star, Loader2, X } from "lucide-react";
import { reviewService } from "@/lib/review-service";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BusinessReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  studentName: string;
  businessId: string;
  onSuccess?: () => void;
}

export function BusinessReviewModal({
  isOpen,
  onClose,
  workflowId,
  studentName,
  businessId,
  onSuccess
}: BusinessReviewModalProps) {
  const [rating, setRating] = React.useState(5);
  const [communicationRating, setCommunicationRating] = React.useState(5);
  const [qualityRating, setQualityRating] = React.useState(5);
  const [timelinessRating, setTimelinessRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState("");
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewService.submitReview(businessId, workflowId, {
        rating,
        communicationRating,
        qualityRating,
        timelinessRating,
        reviewText: reviewText.trim()
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-[12px] shadow-2xl max-w-lg w-full overflow-hidden z-10 border border-brand-hairline"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-hairline px-6 py-5 bg-white">
          <div>
            <h3 className="text-base font-medium text-brand-ink tracking-tight">Rate your Collaboration</h3>
            <p className="text-[11px] text-brand-muted mt-0.5">Evaluate your project with {studentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-brand-surface-soft text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-[6px] bg-brand-coral/10 border border-brand-coral/20 px-4 py-3 text-xs font-semibold text-brand-coral animate-shake">
              {error}
            </div>
          )}

          {/* Rating Groups */}
          <div className="space-y-6">
            <RatingField 
              label="Overall Experience" 
              description="How would you rate the overall project collaboration?" 
              value={rating} 
              onChange={setRating} 
              isPrimary
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RatingField 
                label="Communication" 
                value={communicationRating} 
                onChange={setCommunicationRating} 
              />
              <RatingField 
                label="Delivery Quality" 
                value={qualityRating} 
                onChange={setQualityRating} 
              />
              <RatingField 
                label="Timeliness" 
                value={timelinessRating} 
                onChange={setTimelinessRating} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Written Feedback (Optional)</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="What went well? Highlight strengths such as proactive communication, speed, or clean output..."
              className="w-full rounded-[6px] border border-brand-hairline p-3 text-xs placeholder:text-brand-muted/70 resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 bg-white text-brand-ink transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-hairline bg-white">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4.5 py-2 border border-brand-hairline rounded-[12px] text-xs font-medium hover:bg-brand-surface-soft text-brand-ink bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-brand-ink hover:bg-brand-primary-active text-white rounded-[12px] text-xs font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit Collaboration Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface RatingFieldProps {
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  isPrimary?: boolean;
}

function RatingField({ label, description, value, onChange, isPrimary = false }: RatingFieldProps) {
  const [hoverVal, setHoverVal] = React.useState<number | null>(null);
  const displayVal = hoverVal !== null ? hoverVal : value;

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5: return "Excellent";
      case 4: return "Very Good";
      case 3: return "Good";
      case 2: return "Fair";
      case 1: return "Poor";
      default: return "";
    }
  };

  const getRatingColor = (val: number) => {
    switch (val) {
      case 5: return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case 4: return "text-teal-600 bg-teal-50 border-teal-100";
      case 3: return "text-amber-600 bg-amber-50 border-amber-100";
      case 2: return "text-orange-600 bg-orange-50 border-orange-100";
      case 1: return "text-rose-600 bg-rose-50 border-rose-100";
      default: return "text-brand-muted bg-brand-surface-soft border-brand-hairline";
    }
  };

  return (
    <div 
      className={cn(
        "space-y-3", 
        isPrimary 
          ? "w-full flex flex-col items-center text-center p-5 bg-brand-surface-soft/40 border border-brand-hairline/60 rounded-[12px]" 
          : "flex flex-col items-center text-center bg-white border border-brand-hairline/60 rounded-[10px] p-4 transition-all hover:border-brand-strong/40"
      )}
    >
      <div className="flex flex-col items-center">
        <span className={cn("font-medium text-brand-ink tracking-tight", isPrimary ? "text-sm" : "text-xs")}>{label}</span>
        {description && <span className="text-[11px] text-brand-muted mt-0.5 max-w-xs">{description}</span>}
      </div>
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayVal;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverVal(star)}
              onMouseLeave={() => setHoverVal(null)}
              className="p-1 transition-all duration-150 transform hover:scale-125 hover:rotate-6 focus:outline-none cursor-pointer"
            >
              <Star
                className={cn(
                  isPrimary ? "h-7 w-7" : "h-5 w-5",
                  isActive 
                    ? "fill-[#d9a441] text-[#d9a441]" 
                    : "text-brand-hairline fill-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      <span className={cn(
        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-200",
        getRatingColor(displayVal)
      )}>
        {getRatingLabel(displayVal)}
      </span>
    </div>
  );
}
