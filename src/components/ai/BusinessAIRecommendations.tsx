"use client";

import * as React from "react";
import { Job } from "@/types/job";
import { aiService } from "@/services/ai/service";
import { ScoreResponse } from "@/services/ai/types";
import { AISkeletonLoader } from "./AISkeletonLoader";
import { AIExplanationCard } from "./AIExplanationCard";
import { AIMatchVisualization } from "./AIMatchVisualization";
import { Sparkles, User, ChevronDown, ChevronUp, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { InviteToGigModal } from "../talent/InviteToGigModal";

interface BusinessAIRecommendationsProps {
  job: Job;
}

export function BusinessAIRecommendations({ job }: BusinessAIRecommendationsProps) {
  const [matches, setMatches] = React.useState<ScoreResponse[]>([]);
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [inviteCandidate, setInviteCandidate] = React.useState<{
    id: string;
    name: string;
    score: number;
    reasoning: string;
  } | null>(null);

  React.useEffect(() => {
    async function loadCandidateMatches() {
      setLoading(true);
      setError(null);
      try {
        const allCandidates = await aiService.getAllCandidates();
        setCandidates(allCandidates);

        if (allCandidates.length === 0) {
          setMatches([]);
          return;
        }

        const res = await aiService.matchCandidatesForJob(job, allCandidates);
        setMatches(res.ranked_candidates);
      } catch (err: any) {
        console.error("Business matching error:", err);
        setError("Could not connect to the AI matching server. Make sure the backend AI service is online.");
      } finally {
        setLoading(false);
      }
    }

    loadCandidateMatches();
  }, [job]);

  if (loading) {
    return <AISkeletonLoader message="Analyzing database and ranking student talent..." />;
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-brand-coral/25 bg-brand-coral/5 p-4 text-xs text-brand-coral flex gap-2.5 items-start">
        <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">AI Candidate Matching Offline</p>
          <p className="mt-1 text-[11px] text-brand-body leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-[12px] border border-brand-hairline bg-white p-5 text-center text-brand-muted space-y-1">
        <User className="h-7 w-7 mx-auto text-brand-hairline" />
        <p className="text-xs font-semibold text-brand-ink">No candidates registered</p>
        <p className="text-[11px]">As soon as students join the platform, recommendations will populate here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-brand-hairline pb-2">
        <Sparkles className="h-4 w-4 text-brand-mustard" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
          AI Candidate Matches
        </h3>
        <span className="ml-auto rounded-full bg-brand-mint/20 px-2 py-0.5 text-[9px] font-bold text-brand-success">
          Ranked Candidates
        </span>
      </div>

      <div className="space-y-3">
        {matches.slice(0, 3).map((match, idx) => {
          const isExpanded = expandedIndex === idx;
          const candidateData = candidates.find((c) => c.id === match.candidate_id);
          const candidateName = candidateData?.profile?.name || "Student Talent";
          const candidateCollege = candidateData?.profile?.college || "Local College";
          const matchedSkillsList = candidateData?.profile?.skills?.filter((s: string) => 
            job.requiredSkills.map(rs => rs.toLowerCase()).includes(s.toLowerCase())
          ) || [];

          return (
            <div
              key={match.candidate_id}
              className="rounded-[10px] border border-brand-hairline bg-white p-4 shadow-sm space-y-3 transition-colors hover:border-brand-border-strong"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-surface-strong/70 flex items-center justify-center font-bold text-brand-ink text-xs">
                    {candidateName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-ink">{candidateName}</h4>
                    <p className="text-[10px] text-brand-muted mt-0.5">{candidateCollege}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-ink px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {match.match_percentage}% Match
                  </span>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-1 text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {!isExpanded && (
                <div className="flex items-center justify-between text-[11px] text-brand-muted">
                  <p className="truncate pr-4 max-w-[70%]">{match.reasoning}</p>
                  <button
                    onClick={() => setExpandedIndex(idx)}
                    className="text-brand-link font-semibold hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                  >
                    Inspect Fit
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-4 pt-2 border-t border-brand-hairline/60">
                  <AIMatchVisualization
                    matchPercentage={match.match_percentage}
                    confidenceScore={match.confidence_score}
                    breakdown={match.breakdown}
                  />
                  <AIExplanationCard
                    reasoning={match.reasoning}
                    breakdown={match.breakdown}
                    skillsMatched={matchedSkillsList}
                    experienceLevel={candidateData?.profile?.experienceLevel}
                  />

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => setInviteCandidate({
                        id: match.candidate_id,
                        name: candidateName,
                        score: match.match_percentage,
                        reasoning: match.reasoning
                      })}
                      className="flex-1 h-9 flex items-center justify-center gap-2 bg-brand-ink hover:bg-brand-ink/90 text-white text-xs font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
                    >
                      Invite to Gig <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <Link 
                      href={`/profile/${match.candidate_id}`}
                      className="h-9 px-4 flex items-center justify-center gap-2 bg-white border border-brand-hairline hover:bg-brand-surface text-brand-ink text-xs font-semibold rounded-[8px] transition-colors whitespace-nowrap"
                    >
                      Portfolio <ExternalLink className="h-3.5 w-3.5 text-brand-muted" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {inviteCandidate && (
        <InviteToGigModal
          isOpen={!!inviteCandidate}
          onClose={() => setInviteCandidate(null)}
          studentId={inviteCandidate.id}
          studentName={inviteCandidate.name}
          aiMatchScore={inviteCandidate.score}
          aiReasoning={inviteCandidate.reasoning}
        />
      )}
    </div>
  );
}
