"use client";

import { MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";

export function MessagesEmptyState() {
  const { profile } = useAuthStore();
  const isBusiness = profile?.role === "business";

  return (
    <div className="flex h-full flex-col items-center justify-center bg-brand-surface-soft p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm border border-brand-hairline mb-5 relative">
        <MessageSquare className="h-7 w-7 text-brand-muted" />
        <div className="absolute -bottom-1 -right-1 bg-brand-secondary text-white rounded-full p-1 border-2 border-white">
          <Sparkles className="h-3 w-3" />
        </div>
      </div>
      
      <h3 className="text-base font-semibold text-brand-ink">
        {isBusiness ? "Your collaborative inbox" : "Connect with employers"}
      </h3>
      
      <p className="mt-2 max-w-sm text-sm text-brand-muted leading-relaxed font-medium">
        {isBusiness 
          ? "Conversations will automatically appear here once you shortlist or accept an application." 
          : "When a business shortlists or accepts your application, you can chat with them here."}
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs text-left">
        <div className="flex items-center gap-3 p-3 bg-white rounded-[10px] border border-brand-hairline shadow-sm">
          <div className="bg-brand-surface-soft p-1.5 rounded-md">
            <Sparkles className="w-4 h-4 text-brand-secondary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-ink">AI Quick Replies</p>
            <p className="text-[10px] text-brand-muted">Smart suggestions based on context</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-[10px] border border-brand-hairline shadow-sm">
          <div className="bg-brand-surface-soft p-1.5 rounded-md">
            <ShieldCheck className="w-4 h-4 text-brand-success" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-ink">Secure & Persistent</p>
            <p className="text-[10px] text-brand-muted">End-to-end workflow synced</p>
          </div>
        </div>
      </div>
    </div>
  );
}
