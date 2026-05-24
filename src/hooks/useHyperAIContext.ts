"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";

interface HyperAIContextPayload {
  activeJob?: any | null;
  activeProfile?: any | null;
  activePortfolio?: any[] | null;
  activeApplication?: any | null;
  recommendationState?: any | null;
}

/**
 * useHyperAIContext
 *
 * Drop-in hook for any dashboard page that wants to inject live data
 * into the HyperAI assistant context. Call it once with the relevant
 * data and the assistant will become context-aware for that page.
 *
 * Dependencies are shallowly compared by JSON serialization to avoid
 * unnecessary re-injections on every render.
 *
 * @example
 * useHyperAIContext({ activeProfile: profile, activePortfolio: portfolios });
 */
export function useHyperAIContext(payload: HyperAIContextPayload) {
  const { setContext } = useHyperAIStore();

  // Serialize payload to detect real changes
  const serialized = JSON.stringify({
    jobId: payload.activeJob?.jobId ?? null,
    profileUid: payload.activeProfile?.uid ?? payload.activeProfile?.name ?? null,
    portfolioCount: payload.activePortfolio?.length ?? null,
    applicationId: payload.activeApplication?.id ?? null,
    recState: payload.recommendationState?.match_percentage ?? null,
  });

  const prevSerialized = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (serialized === prevSerialized.current) return;
    prevSerialized.current = serialized;

    setContext({
      activeJob: payload.activeJob ?? null,
      activeProfile: payload.activeProfile ?? null,
      activePortfolio: payload.activePortfolio ?? null,
      activeApplication: payload.activeApplication ?? null,
      recommendationState: payload.recommendationState ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);
}
