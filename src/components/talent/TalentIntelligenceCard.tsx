"use client";

import * as React from "react";
import { EnrichedCandidate } from "@/types/talent";
import { BrainCircuit, Star, TrendingUp, AlertTriangle, Briefcase, MapPin, ExternalLink, ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { InviteToGigModal } from "./InviteToGigModal";

interface TalentIntelligenceCardProps {
  data: EnrichedCandidate;
}

export function TalentIntelligenceCard({ data }: TalentIntelligenceCardProps) {
  const { profile, match } = data;
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

  const isDefaultReasoning = match.matchReasoning === "Top candidate by Marketplace Trust. Enter a search query for AI semantic matching.";

  return (
    <>
      <div className="bg-white border border-brand-hairline rounded-[16px] overflow-hidden shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all p-5 flex flex-col gap-4 group">
        
        {/* Basic Profile */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-surface-strong flex items-center justify-center text-brand-muted text-xl font-semibold shrink-0 ring-2 ring-brand-hairline">
              {profile.avatarInitials || profile.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-brand-ink leading-none">{profile.name}</h3>
              <div className="flex items-center gap-2 text-xs text-brand-body">
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {profile.experienceLevel}</span>
                <span className="text-brand-hairline">•</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.college}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-brand-body leading-relaxed line-clamp-2">
            {profile.bio}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 6).map(skill => (
              <span key={skill} className="px-2.5 py-1 rounded-md bg-brand-surface-soft border border-brand-hairline text-[11px] font-medium text-brand-muted">
                {skill}
              </span>
            ))}
            {profile.skills.length > 6 && (
              <span className="px-2.5 py-1 rounded-md bg-brand-surface text-[11px] font-medium text-brand-muted">
                +{profile.skills.length - 6}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex-1 h-9 flex items-center justify-center gap-2 bg-brand-ink hover:bg-brand-ink/90 text-white text-xs font-semibold rounded-[8px] transition-colors shadow-sm"
          >
            Invite to Gig <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <Link 
            href={`/profile/${profile.uid}`}
            className="h-9 px-4 flex items-center justify-center gap-2 bg-white border border-brand-hairline hover:bg-brand-surface text-brand-ink text-xs font-semibold rounded-[8px] transition-colors whitespace-nowrap"
          >
            Portfolio <ExternalLink className="h-3.5 w-3.5 text-brand-muted" />
          </Link>
        </div>

        {/* Separator */}
        <div className="border-t border-brand-hairline/80 my-1" />

        {/* AI Intelligence & Matching UX Upgrade */}
        <div className="flex flex-col justify-between bg-brand-surface-soft/40 border border-brand-primary/5 p-4 rounded-[12px] relative overflow-hidden">
          {/* Soft decorative gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Match Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-brand-primary/10 flex items-center justify-center">
                  <BrainCircuit className="h-3.5 w-3.5 text-brand-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-ink">Intelligence Match</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "px-2.5 py-1 rounded-[6px] text-sm font-bold border",
                  isDefaultReasoning ? "bg-brand-surface-soft text-brand-muted border-brand-hairline" :
                  match.overallScore >= 80 ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                  match.overallScore >= 60 ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" :
                  "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                )}>
                  {isDefaultReasoning ? "No Active Search" : `${match.overallScore}% Match`}
                </div>
              </div>
            </div>

            {/* Extended Intelligence Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-brand-hairline rounded-[6px] p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
                  <Star className="h-3 w-3 text-brand-primary" /> Semantic
                </div>
                <span className="text-xs font-bold text-brand-ink">
                  {isDefaultReasoning ? "0%" : `${match.semanticScore}%`}
                </span>
              </div>
              <div className="bg-white border border-brand-hairline rounded-[6px] p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 text-brand-success" /> Trust
                </div>
                <span className="text-xs font-bold text-brand-ink">{profile.trustScore}%</span>
              </div>
            </div>

            {/* Reasoning (only shown if not default reasoning or if riskFactors exist) */}
            {(!isDefaultReasoning || match.riskFactors.length > 0) && (
              <div className="space-y-2 bg-white p-3 rounded-[8px] border border-brand-hairline/80">
                {!isDefaultReasoning && (
                  <p className="text-[12px] text-brand-ink font-medium leading-relaxed flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-primary shrink-0 mt-0.5" />
                    {match.matchReasoning}
                  </p>
                )}
                
                {match.riskFactors.map((risk, idx) => (
                  <p key={idx} className="text-[11px] text-brand-coral font-medium leading-relaxed flex items-start gap-1.5 pt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {risk}
                  </p>
                ))}
              </div>
            )}

            {/* Rare Badges & Momentum */}
            {(match.momentum === "rising" || (match.rarityIndicators && match.rarityIndicators.length > 0)) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {match.momentum === "rising" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-success/10 text-brand-success text-[10px] font-bold uppercase tracking-wider border border-brand-success/20">
                    <TrendingUp className="h-3 w-3" /> Rising Talent
                  </span>
                )}
                {match.rarityIndicators?.map((rare, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
                    <Zap className="h-3 w-3" /> {rare}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <InviteToGigModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        studentId={profile.uid}
        studentName={profile.name}
        aiMatchScore={match.overallScore}
        aiReasoning={match.matchReasoning}
      />
    </>
  );
}
