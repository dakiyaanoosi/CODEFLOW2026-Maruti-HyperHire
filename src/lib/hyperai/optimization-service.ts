"use client";

import { useState, useEffect, useRef } from "react";
import { 
  OptimizationAnalysis, 
  ProposalOptimizationPayload, 
  GigOptimizationPayload 
} from "@/types/optimization";
import { aiFetch } from "@/services/ai/client";

function getLocalOptimizationFallback(endpoint: string, payload: unknown): OptimizationAnalysis | null {
  const p = payload as {
    text?: string;
    jobRequiredSkills?: string[];
    studentTrustScore?: number;
    description?: string;
    skills?: string[];
    budget?: number;
    businessTrustScore?: number;
    previousScore?: number | null;
  };

  if (endpoint.includes("/proposal")) {
    const textLower = (p.text || "").toLowerCase();
    const wordCount = textLower.split(/\s+/).filter(Boolean).length;
    const requiredSkills = p.jobRequiredSkills || [];
    const studentTrustScore = p.studentTrustScore || 0;

    const skillsMentioned = requiredSkills.filter((s: string) => textLower.includes(s.toLowerCase())).length;
    let relevance = requiredSkills.length === 0 ? 40 : Math.min(100, Math.round((skillsMentioned / requiredSkills.length) * 100) + 20);
    if (wordCount < 20) relevance = Math.min(relevance, 30);

    let clarity = wordCount < 35 ? Math.min(100, 30 + (wordCount * 2)) : 85;
    let professionalism = /sincerely|regards|thank you|hello|hi/.test(textLower) ? 90 : 65;

    const weaknesses = [];
    const genericPhrases = ["i want this job", "i am hardworking", "hire me", "i can do this"];
    for (const phrase of genericPhrases) {
      if (textLower.includes(phrase)) {
        weaknesses.push({
          phrase,
          reason: "Lacks technical specificity and sounds generic.",
          suggestedFix: "Detail a specific past project where you delivered similar results."
        });
        professionalism = Math.max(40, professionalism - 15);
        clarity = Math.max(40, clarity - 10);
      }
    }

    if (wordCount < 15 && textLower !== "") {
      weaknesses.push({
        phrase: p.text || "",
        reason: "Proposal is too brief to evaluate semantic fit.",
        suggestedFix: "Expand on how your skills directly solve the client's core problem."
      });
    }

    const trust_compatibility = Math.min(100, studentTrustScore + 10);
    const market_comp = Math.round((relevance + professionalism) / 2);
    const overall = Math.round((clarity + relevance + professionalism + market_comp + trust_compatibility) / 5);

    const insights: OptimizationAnalysis["insights"] = [];
    if (relevance < 60) {
      insights.push({
        text: "This proposal lacks explicit technical references. Including keywords from the gig will boost your semantic match score.",
        type: "strategic"
      });
    }
    if (studentTrustScore > 85) {
      insights.push({
        text: "Your Elite trust ranking significantly increases hiring probability. Ensure your proposal timeline matches your high reliability score.",
        type: "trust_impact"
      });
    }

    return {
      scores: {
        overall: Math.max(0, overall),
        clarity: Math.max(0, clarity),
        relevance: Math.max(0, relevance),
        professionalism: Math.max(0, professionalism),
        marketCompetitiveness: Math.max(0, market_comp),
        trustCompatibility: Math.max(0, trust_compatibility)
      },
      previousOverallScore: p.previousScore ?? null,
      percentile: Math.max(1, 100 - overall),
      confidence: Math.min(99, 40 + (wordCount * 2)),
      confidenceReasoning: "AI Offline — Using deterministic fallback analysis.",
      weaknesses,
      insights,
      lastUpdated: new Date().toISOString()
    };
  } else if (endpoint.includes("/gig")) {
    const descLower = (p.description || "").toLowerCase();
    const wordCount = descLower.split(/\s+/).filter(Boolean).length;
    const skills = p.skills || [];
    const businessTrustScore = p.businessTrustScore || 0;

    let clarity = wordCount < 40 ? Math.min(100, 30 + (wordCount * 1.5)) : 85;
    let relevance = skills.length > 2 ? 90 : 50;
    let professionalism = 85;
    let market_comp = 80;

    const insights: OptimizationAnalysis["insights"] = [];
    const weaknesses = [];

    const budget = p.budget || 0;

    if (budget > 0 && budget < 5000) {
      market_comp = 50;
      insights.push({
        text: "Current budget range may discourage high-trust, elite candidates. The marketplace average for this category is higher.",
        type: "market_trend"
      });
    } else if (budget > 0 && budget < 25000) {
      market_comp = 70;
      insights.push({
        text: "Budget is competitive for intermediate candidates, but consider a slightly higher cap for elite experts.",
        type: "market_trend"
      });
    }

    if (wordCount < 20 && wordCount > 0) {
      weaknesses.push({
        phrase: p.description || "",
        reason: "Description is too brief to semantically attract the right talent.",
        suggestedFix: "Detail the core deliverables, technical stack, and expected timeline clearly."
      });
      clarity = Math.max(30, clarity - 20);
    }

    if (skills.length === 0) {
      insights.push({
        text: "Adding specific technology tags dramatically improves the AI recommendation engine's ability to source candidates.",
        type: "strategic"
      });
    }

    if (businessTrustScore > 80) {
      insights.push({
        text: "Your high business trust score acts as a talent magnet. Emphasize your fast milestone approval history.",
        type: "trust_impact"
      });
    }

    const overall = Math.round((clarity + relevance + professionalism + market_comp + businessTrustScore) / 5);

    return {
      scores: {
        overall: Math.max(0, overall),
        clarity: Math.max(0, Math.round(clarity)),
        relevance: Math.max(0, relevance),
        professionalism: Math.max(0, professionalism),
        marketCompetitiveness: Math.max(0, market_comp),
        trustCompatibility: Math.max(0, businessTrustScore)
      },
      previousOverallScore: p.previousScore ?? null,
      percentile: Math.max(1, 100 - overall),
      confidence: Math.min(95, 50 + (wordCount * 2)),
      confidenceReasoning: "AI Offline — Using deterministic fallback analysis.",
      weaknesses,
      insights,
      lastUpdated: new Date().toISOString()
    };
  }
  return null;
}

// Core generic hook for optimization
function useOptimization<TPayload>(
  endpoint: string, 
  payload: TPayload, 
  triggerContent: string | number, // Usually the raw text being typed
  debounceMs: number = 1500
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
        const fallback = getLocalOptimizationFallback(endpoint, payload);
        if (fallback) {
          setAnalysis(fallback);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
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
          const fallback = getLocalOptimizationFallback(endpoint, payload);
          if (fallback) {
            setAnalysis(fallback);
          }
        }
      } finally {
        setIsAnalyzing(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [triggerContent]); // We only trigger re-eval when the raw text/content changes

  return { analysis, isAnalyzing };
}

/**
 * Hook for Students writing proposals
 */
export function useProposalOptimization(
  text: string,
  jobDescription: string,
  jobRequiredSkills: string[],
  studentTrustScore: number
) {
  return useOptimization<ProposalOptimizationPayload>(
    "/optimization/proposal",
    { text, jobDescription, jobRequiredSkills, studentTrustScore },
    text
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
  businessTrustScore: number,
  manual: boolean = false
) {
  // We trigger on description length or budget changes
  const trigger = description + budget.toString();
  
  return useOptimization<GigOptimizationPayload>(
    "/optimization/gig",
    { title, description, budget, category, skills, businessTrustScore },
    trigger,
    1500,
    manual
  );
}
