"use client";

import * as React from "react";
import { X, Crop, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [dimensions, setDimensions] = React.useState({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  const [crop, setCrop] = React.useState({ x: 0, y: 0, size: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0, cropX: 0, cropY: 0 });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const imageRef = React.useRef<HTMLImageElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Initialize crop coordinates once image dimensions are loaded
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const displayedWidth = img.width || img.clientWidth;
    const displayedHeight = img.height || img.clientHeight;

    setDimensions({
      width: displayedWidth,
      height: displayedHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });

    // Make crop box 80% of the smallest side
    const size = Math.min(displayedWidth, displayedHeight) * 0.8;
    const x = (displayedWidth - size) / 2;
    const y = (displayedHeight - size) / 2;
    
    setCrop({ x, y, size });
  };

  // Re-adjust crop box if window or container size changes
  React.useEffect(() => {
    if (!isOpen || !imageRef.current) return;
    
    const handleResize = () => {
      const img = imageRef.current;
      if (!img) return;
      const displayedWidth = img.width || img.clientWidth;
      const displayedHeight = img.height || img.clientHeight;

      setDimensions((prev) => {
        // Calculate new crop matching previous percentage position
        const scaleX = prev.width ? displayedWidth / prev.width : 1;
        const scaleY = prev.height ? displayedHeight / prev.height : 1;
        
        setCrop((c) => {
          const newSize = Math.min(displayedWidth, displayedHeight) * 0.8;
          return {
            x: Math.max(0, Math.min(displayedWidth - newSize, c.x * scaleX)),
            y: Math.max(0, Math.min(displayedHeight - newSize, c.y * scaleY)),
            size: newSize,
          };
        });

        return {
          ...prev,
          width: displayedWidth,
          height: displayedHeight,
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  // Handle crop box drag
  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: crop.x,
      cropY: crop.y,
    });
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragStart.x;
      const dy = clientY - dragStart.y;
      
      const newX = Math.max(0, Math.min(dimensions.width - crop.size, dragStart.cropX + dx));
      const newY = Math.max(0, Math.min(dimensions.height - crop.size, dragStart.cropY + dy));
      
      setCrop((prev) => ({ ...prev, x: newX, y: newY }));
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragStart, dimensions, crop.size]);

  // Crop & generate file
  const handleSave = async () => {
    const img = imageRef.current;
    if (!img || dimensions.width === 0 || dimensions.height === 0) return;

    setIsProcessing(true);

    try {
      // Calculate coordinates scaled to natural dimensions
      const scaleX = dimensions.naturalWidth / dimensions.width;
      const scaleY = dimensions.naturalHeight / dimensions.height;

      const sourceX = crop.x * scaleX;
      const sourceY = crop.y * scaleY;
      const sourceSize = crop.size * Math.min(scaleX, scaleY); // Keep square scaling aspect ratio

      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not initialize canvas 2D context");
      }

      // Draw cropped section onto high-quality 500x500 canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        500,
        500
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], "cropped-profile.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            onCropComplete(croppedFile);
          } else {
            console.error("Failed to generate image blob");
          }
          setIsProcessing(false);
        },
        "image/jpeg",
        0.92 // 92% JPEG quality
      );
    } catch (err) {
      console.error("Error cropping image:", err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-ink/60"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative z-10 flex w-full max-w-lg flex-col rounded-[16px] border border-brand-hairline bg-white shadow-2xl overflow-hidden text-brand-ink"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-brand-hairline px-6 bg-brand-surface-soft">
            <div className="flex items-center gap-2">
              <Crop className="h-4.5 w-4.5 text-brand-primary" />
              <h3 className="text-sm font-semibold text-brand-ink">Crop Profile Picture</h3>
            </div>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink transition-colors p-1"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Workspace */}
          <div className="flex flex-col items-center justify-center p-6 bg-brand-surface-soft/30 min-h-[320px]">
            <p className="text-xs text-brand-muted font-medium mb-4 text-center">
              Drag the square overlay to position the crop. The final image will be formatted as a 1:1 square.
            </p>

            {/* Container for cropping image */}
            <div
              ref={containerRef}
              className="relative max-h-[350px] max-w-full overflow-hidden rounded-[8px] border border-brand-hairline bg-neutral-900 flex items-center justify-center"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Source preview"
                onLoad={handleImageLoad}
                className="max-h-[350px] max-w-full block select-none pointer-events-none"
              />

              {/* Crop box overlay */}
              {dimensions.width > 0 && (
                <div
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  className="absolute border-2 border-white rounded-full cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-border flex items-center justify-center"
                  style={{
                    left: `${crop.x}px`,
                    top: `${crop.y}px`,
                    width: `${crop.size}px`,
                    height: `${crop.size}px`,
                  }}
                >
                  {/* Grid layout decoration */}
                  <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none" />
                  {/* Circular frame help indicator */}
                  <div className="h-full w-full border border-dashed border-white/40 rounded-full absolute pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex h-16 items-center justify-end gap-3 border-t border-brand-hairline px-6 bg-brand-surface-soft/50">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || dimensions.width === 0}
              className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-active transition-colors disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cropping...
                </>
              ) : (
                <>
                  <Crop className="h-4 w-4" />
                  Save Crop
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
