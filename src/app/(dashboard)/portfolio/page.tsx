import { Briefcase } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
          Portfolio
        </h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">
          Showcase your work, projects, and creative achievements.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[10px] border border-brand-hairline bg-white py-24">
        <div className="grid h-14 w-14 place-items-center rounded-[12px] bg-brand-surface-soft">
          <Briefcase className="h-6 w-6 text-brand-muted" />
        </div>
        <p className="mt-4 text-sm font-medium text-brand-ink">Portfolio Management</p>
        <p className="mt-1.5 max-w-xs text-center text-sm text-brand-muted">
          Upload images, videos, PDFs, and project links. Launching in Phase 2.
        </p>
      </div>
    </div>
  );
}
