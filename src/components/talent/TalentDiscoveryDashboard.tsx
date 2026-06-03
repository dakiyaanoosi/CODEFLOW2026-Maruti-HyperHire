"use client";

import * as React from "react";
import { Search, Loader2, Sparkles, Filter, AlertCircle } from "lucide-react";
import { talentService } from "@/lib/talent/talent-service";
import { StudentProfile } from "@/types/profile";
import { TalentSearchResponse, EnrichedCandidate } from "@/types/talent";
import { aiFetch } from "@/services/ai/client";
import { TalentIntelligenceCard } from "./TalentIntelligenceCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TalentDiscoveryDashboard() {
  const [query, setQuery] = React.useState("");
  const [activeStudents, setActiveStudents] = React.useState<(StudentProfile & { uid: string })[]>([]);
  
  const [results, setResults] = React.useState<EnrichedCandidate[]>([]);
  const [guidance, setGuidance] = React.useState<TalentSearchResponse["recruiterGuidance"]>([]);
  const [extractedTags, setExtractedTags] = React.useState<string[]>([]);
  
  const [isSearching, setIsSearching] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // 1. Boot up the real-time scalable aggregation
  React.useEffect(() => {
    talentService.boot();
    const unsub = talentService.subscribe((students) => {
      setActiveStudents(students);
      // If we don't have results yet and there's no query, just show the top trusted students
      if (query.trim() === "" && students.length > 0) {
        const topStudents = [...students].sort((a, b) => b.trustScore - a.trustScore).slice(0, 10);
        const mapped: EnrichedCandidate[] = topStudents.map((s) => ({
          profile: s,
          match: {
            userId: s.uid,
            semanticScore: s.trustScore,
            diversityBonus: 0,
            freshnessWeight: 0,
            overallScore: s.trustScore,
            matchReasoning: "Top candidate by Marketplace Trust. Enter a search query for AI semantic matching.",
            riskFactors: [],
            rarityIndicators: [],
            momentum: "stable"
          }
        }));
        setResults(mapped);
      }
    });

    return () => {
      unsub();
      // Not shutting down talent service globally so it stays warm if they navigate away briefly
    };
  }, []);

  // 2. Heavy Debounce Search
  React.useEffect(() => {
    if (!query.trim()) {
      setGuidance([]);
      setExtractedTags([]);
      // Restore default list
      const topStudents = [...activeStudents].sort((a, b) => b.trustScore - a.trustScore).slice(0, 10);
      setResults(topStudents.map((s) => ({
        profile: s,
        match: {
          userId: s.uid,
          semanticScore: s.trustScore,
          diversityBonus: 0,
          freshnessWeight: 0,
          overallScore: s.trustScore,
          matchReasoning: "Top candidate by Marketplace Trust. Enter a search query for AI semantic matching.",
          riskFactors: [],
          rarityIndicators: [],
          momentum: "stable"
        }
      })));
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const payload = {
          query,
          candidates: talentService.getMinimalPayload()
        };

        const res = await aiFetch<TalentSearchResponse>("/talent/search", {
          method: "POST",
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal
        });

        // Map back to full profiles
        const enriched: EnrichedCandidate[] = [];
        for (const match of res.matches) {
          const profile = activeStudents.find(s => s.uid === match.userId);
          if (profile) {
            enriched.push({ profile, match });
          }
        }

        setResults(enriched);
        setGuidance(res.recruiterGuidance);
        setExtractedTags(res.searchIntentExtracted);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("[Talent] Search aborted for new typing.");
        } else {
          console.error("[Talent] Search error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, activeStudents]);

  return (
    <div className="space-y-6">
      
      {/* Cinematic Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-6 w-6 text-brand-primary animate-spin" />
          ) : (
            <Search className="h-6 w-6 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g. 'React Native developer with strong UI design experience'"
          className="w-full h-16 pl-14 pr-16 bg-white border border-brand-hairline rounded-[16px] text-lg text-brand-ink outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 shadow-sm transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button className="h-10 px-4 bg-brand-surface-soft border border-brand-hairline rounded-[10px] text-sm font-semibold text-brand-ink flex items-center gap-2 hover:bg-brand-surface transition-colors">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Extracted Intent Tags */}
      {extractedTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Intent:
          </span>
          {extractedTags.map((tag) => (
            <span key={tag} className="bg-brand-primary/5 border border-brand-primary/20 text-brand-primary px-2.5 py-1 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Recruiter Guidance Banners */}
      <AnimatePresence>
        {guidance.map((g, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-[12px] border",
              g.type === "warning" ? "bg-brand-coral/5 border-brand-coral/20 text-brand-coral" :
              g.type === "opportunity" ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary" :
              "bg-brand-success/5 border-brand-success/20 text-brand-success"
            )}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                {g.type === "warning" ? "Market Alert" : g.type === "opportunity" ? "Recruiter Opportunity" : "Market Trend"}
              </p>
              <p className="text-sm font-medium leading-relaxed">{g.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result) => (
            <TalentIntelligenceCard key={result.profile.uid} data={result} />
          ))}
        </div>
      ) : (
        !isSearching && query && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-brand-surface-soft border border-brand-hairline rounded-[16px]">
            <Search className="h-8 w-8 text-brand-muted" />
            <div>
              <h3 className="text-base font-semibold text-brand-ink">No candidates matched perfectly</h3>
              <p className="text-sm text-brand-body mt-1">Try broadening your search intent or removing specific technology constraints.</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
