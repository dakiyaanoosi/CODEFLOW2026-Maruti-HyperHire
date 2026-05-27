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
    } catch (e: any) {
      setError(e.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden z-10 border border-brand-hairline"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-hairline px-6 py-4 bg-brand-surface-soft">
          <div>
            <h3 className="text-base font-semibold text-brand-ink">Rate your Collaboration</h3>
            <p className="text-xs text-brand-muted mt-0.5">Evaluate your project with {studentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-brand-surface text-brand-muted hover:text-brand-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-brand-coral/10 border border-brand-coral/20 px-4 py-3 text-xs font-semibold text-brand-coral">
              {error}
            </div>
          )}

          {/* Rating Groups */}
          <div className="space-y-4">
            <RatingField 
              label="Overall Experience" 
              description="How would you rate the overall project collaboration?" 
              value={rating} 
              onChange={setRating} 
              isPrimary
            />
            
            <div className="border-t border-brand-hairline my-2" />

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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-ink">Written Feedback (Optional)</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="What went well? Highlight strengths such as proactive communication, speed, or clean output..."
              className="w-full rounded-lg border border-brand-hairline p-3 text-xs placeholder:text-brand-muted resize-none focus:outline-none focus:border-brand-primary bg-white text-brand-ink"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-hairline bg-brand-surface-soft">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-brand-hairline rounded-lg text-xs font-medium hover:bg-white text-brand-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-brand-ink hover:bg-brand-primary-active text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
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

  return (
    <div className={cn("space-y-1.5", isPrimary ? "w-full" : "flex flex-col items-center text-center")}>
      <div className="flex flex-col">
        <span className={cn("font-semibold text-brand-ink", isPrimary ? "text-sm" : "text-xs")}>{label}</span>
        {description && <span className="text-[11px] text-brand-muted mt-0.5">{description}</span>}
      </div>
      <div className="flex items-center gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = hoverVal !== null ? star <= hoverVal : star <= value;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverVal(star)}
              onMouseLeave={() => setHoverVal(null)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
            >
              <Star
                className={cn(
                  isPrimary ? "h-6 w-6" : "h-5 w-5",
                  isActive ? "fill-yellow-400 text-yellow-400" : "text-brand-muted opacity-40"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
