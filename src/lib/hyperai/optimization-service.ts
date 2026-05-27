"use client";

import { useState, useEffect, useRef } from "react";
import { 
  OptimizationAnalysis, 
  ProposalOptimizationPayload, 
  GigOptimizationPayload 
} from "@/types/optimization";
import { aiFetch } from "@/services/ai/client";

// Core generic hook for optimization
function useOptimization<TPayload>(
  endpoint: string, 
  payload: TPayload, 
  triggerContent: string | number, // Usually the raw text being typed
  debounceMs: number = 1500,
  manual: boolean = false
) {
  const [analysis, setAnalysis] = useState<OptimizationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousScoreRef = useRef<number | null>(null);

  const runAnalysis = async () => {
    if (typeof triggerContent === "string" && triggerContent.trim().length < 5) {
      return;
    }
    setIsAnalyzing(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const fullPayload = {
        ...payload,
        previousScore: previousScoreRef.current
      };

      const res = await aiFetch<OptimizationAnalysis>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(fullPayload),
          signal: abortControllerRef.current.signal
        }
      );

      previousScoreRef.current = res.scores.overall;
      setAnalysis(res);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[OptimizationService] Request aborted.");
      } else {
        console.error(`[OptimizationService] Error fetching ${endpoint}:`, err);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (manual) return;

    // Only analyze if there's meaningful content
    if (typeof triggerContent === "string" && triggerContent.trim().length < 5) {
      setAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    const timeoutId = setTimeout(async () => {
      // Cancel any stale in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const fullPayload = {
          ...payload,
          previousScore: previousScoreRef.current
        };

        const res = await aiFetch<OptimizationAnalysis>(
          endpoint,
          {
            method: "POST",
            body: JSON.stringify(fullPayload),
            signal: abortControllerRef.current.signal
          }
        );

        // Update the previous score for progress tracking
        previousScoreRef.current = res.scores.overall;
        
        setAnalysis(res);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("[OptimizationService] Request aborted due to new input.");
        } else {
          console.error(`[OptimizationService] Error fetching ${endpoint}:`, err);
        }
      } finally {
        setIsAnalyzing(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [triggerContent, manual]); // We only trigger re-eval when the raw text/content or manual mode changes

  return { analysis, isAnalyzing, runAnalysis };
}

/**
 * Hook for Students writing proposals
 */
export function useProposalOptimization(
  text: string,
  jobDescription: string,
  jobRequiredSkills: string[],
  studentTrustScore: number,
  manual: boolean = false
) {
  return useOptimization<ProposalOptimizationPayload>(
    "/optimization/proposal",
    { text, jobDescription, jobRequiredSkills, studentTrustScore },
    text,
    1500,
    manual
  );
}

/**
 * Hook for Businesses creating gigs
 */
export function useGigOptimization(
  description: string,
  title: string,
  budget: number,
  category: string,
  skills: string[],
  businessTrustScore: number
) {
  // We trigger on description length or budget changes
  const trigger = description + budget.toString();
  
  return useOptimization<GigOptimizationPayload>(
    "/optimization/gig",
    { title, description, budget, category, skills, businessTrustScore },
    trigger
  );
}
