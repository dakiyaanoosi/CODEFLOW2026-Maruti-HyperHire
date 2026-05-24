"use client";

import * as React from "react";
import { Folder, Film, FileText, Link2, ExternalLink, Calendar } from "lucide-react";
import { PortfolioItem } from "@/types/portfolio";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  item: PortfolioItem;
  onClick: () => void;
}

export function PortfolioCard({ item, onClick }: PortfolioCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Parse hostname for link types
  const getDisplayLink = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace("www.", "");
    } catch (e) {
      return "external link";
    }
  };

  // Render media thumbnail/preview
  const renderThumbnail = () => {
    const defaultPlaceholder = (icon: React.ReactNode, bgClass: string) => (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center", bgClass)}>
        <div className="rounded-full bg-white/20 p-3 text-white">
          {icon}
        </div>
        <span className="text-xs font-semibold text-white/90 tracking-wide uppercase font-mono">
          {item.mediaType} Project
        </span>
      </div>
    );

    if (item.mediaType === "image" && item.mediaUrl && !imageError) {
      return (
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={item.mediaUrl}
            alt={item.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-xs text-white font-medium bg-brand-ink px-2.5 py-1 rounded-[6px]">
              View Project
            </span>
          </div>
        </div>
      );
    }

    if (item.mediaType === "video") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-black">
          {isHovered ? (
            <video
              src={item.mediaUrl}
              poster={item.thumbnailUrl}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              {item.thumbnailUrl && !imageError ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                defaultPlaceholder(<Film className="h-6 w-6" />, "bg-brand-coral")
              )}
              {/* Play Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/90 p-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-5 w-5 text-brand-ink fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (item.mediaType === "pdf") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          {isHovered ? (
            <iframe
              src={`${item.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="h-full w-full border-none pointer-events-none scale-[1.05]"
              title={item.title}
            />
          ) : (
            defaultPlaceholder(
              <FileText className="h-6 w-6" />,
              "bg-brand-forest"
            )
          )}
        </div>
      );
    }

    if (item.mediaType === "link") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-brand-ink p-4 text-center">
          <div className="rounded-full bg-white/20 p-3 text-white">
            <Link2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/95 tracking-wide uppercase font-mono">
              External Link
            </span>
            <p className="text-[11px] text-white/70 max-w-[200px] truncate flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {getDisplayLink(item.mediaUrl)}
            </p>
          </div>
        </div>
      );
    }

    // Default image placeholder
    return defaultPlaceholder(
      <Folder className="h-6 w-6" />,
      "bg-brand-surface-dark"
    );
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col overflow-hidden rounded-[12px] border border-brand-hairline bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-brand-hairline bg-brand-surface-soft">
        {renderThumbnail()}
        
        {/* Category Badge */}
        <span className="absolute left-3 top-3 rounded-[6px] bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-ink shadow-sm border border-brand-hairline/40">
          {item.category}
        </span>
      </div>

      {/* Details section */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-medium leading-[1.3] text-brand-ink line-clamp-1 group-hover:text-brand-link transition-colors">
          {item.title}
        </h3>
        
        <p className="mt-1.5 text-xs text-brand-body line-clamp-2 min-h-[32px] leading-relaxed">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-[6px] bg-brand-surface-soft px-2 py-0.5 text-[10px] font-medium text-brand-muted border border-brand-hairline/50"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="rounded-[6px] bg-brand-surface-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-muted">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-auto pt-3 border-t border-brand-hairline/60 flex items-center justify-between text-[11px] text-brand-muted font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="capitalize">{item.mediaType}</span>
        </div>
      </div>
    </motion.div>
  );
}
