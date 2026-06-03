"use client";

import * as React from "react";
import { Review } from "@/types/review";
import { reviewService } from "@/lib/review-service";
import { Star, MessageSquare, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewsSectionProps {
  userId: string;
  role: "student" | "business";
}

const parseToDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (typeof dateVal.toDate === "function") {
    return dateVal.toDate();
  }
  return new Date(dateVal);
};

export function ReviewsSection({ userId, role }: ReviewsSectionProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    reviewService.getReviewsForUser(userId)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="h-32 rounded-xl border border-brand-hairline bg-brand-surface-soft animate-pulse" />;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-brand-hairline bg-white p-6 text-center">
        <MessageSquare className="h-8 w-8 text-brand-muted mx-auto mb-2 opacity-40" />
        <h4 className="text-sm font-semibold text-brand-ink">No Reviews Yet</h4>
        <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
          {role === "student"
            ? "Complete your first collaboration to build marketplace reputation. Verified projects and client reviews improve talent visibility."
            : "No student collaboration reviews found for this business. Workflows and fast payouts build hiring trust."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.reviewId} className="rounded-xl border border-brand-hairline bg-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-brand-ink">
                  {review.reviewerRole === "student" ? "Collaborated Freelancer" : "Verified Client"}
                </span>
                <span className="text-xs text-brand-muted">•</span>
                <span className="text-xs text-brand-muted">
                  {parseToDate(review.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-brand-muted mt-0.5">Workflow #{review.workflowId.slice(3, 10)}</p>
            </div>
            
            {/* Stars */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-brand-muted opacity-30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-ink">{review.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Review Text */}
          {review.reviewText && (
            <p className="text-xs text-brand-body leading-relaxed bg-brand-surface-soft/40 p-3 rounded-lg border border-brand-hairline/40">
              "{review.reviewText}"
            </p>
          )}

          {/* Sub ratings */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[11px] text-brand-muted">
            <div className="flex items-center gap-1">
              <span>Communication:</span>
              <span className="font-bold text-brand-ink">{review.communicationRating ?? review.rating}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{review.reviewerRole === "student" ? "Professionalism:" : "Quality:"}</span>
              <span className="font-bold text-brand-ink">{review.qualityRating ?? review.rating}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{review.reviewerRole === "student" ? "Payment Speed:" : "Timeliness:"}</span>
              <span className="font-bold text-brand-ink">{review.timelinessRating ?? review.rating}/5</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
