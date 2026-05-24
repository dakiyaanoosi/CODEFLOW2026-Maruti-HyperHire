"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { FloatingAssistantButton } from "./FloatingAssistantButton";
import { AssistantPanel } from "./AssistantPanel";

export function HyperAI() {
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const { setContext, history, clearHistory } = useHyperAIStore();
  const [mounted, setMounted] = React.useState(false);
  const prevRole = React.useRef<string | null>(null);

  // Client-side hydration safety
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Track route + role context on every navigation
  React.useEffect(() => {
    if (!mounted || !profile) return;

    const roleChanged = prevRole.current !== null && prevRole.current !== profile.role;
    prevRole.current = profile.role;

    setContext({
      pageContext: pathname,
      userRole: profile.role,
    });

    // Fire initial greeting when role first known or role switches
    if (history.length === 0 || roleChanged) {
      clearHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, profile?.role, mounted]);

  if (!mounted || !profile) return null;

  return (
    <>
      <FloatingAssistantButton />
      <AssistantPanel />
    </>
  );
}

// Named + default export for flexibility
export { FloatingAssistantButton } from "./FloatingAssistantButton";
export { AssistantPanel } from "./AssistantPanel";
export { ChatArea } from "./ChatArea";
export { QuickActions } from "./QuickActions";
export { InsightCards } from "./InsightCards";
export { ContextStatusBar } from "./ContextStatusBar";
export { SemanticBadge } from "./SemanticBadge";

export default HyperAI;
