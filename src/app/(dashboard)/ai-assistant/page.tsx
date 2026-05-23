import { Sparkles } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
          AI Assistant
        </h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">
          Your persistent AI copilot — summarize dashboards, match candidates, and generate insights.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[10px] border border-brand-hairline bg-white py-24">
        <div className="grid h-14 w-14 place-items-center rounded-[12px] bg-brand-ink">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="mt-4 text-sm font-medium text-brand-ink">Global AI Copilot</p>
        <p className="mt-1.5 max-w-xs text-center text-sm text-brand-muted">
          AI-native workspace intelligence with context awareness. Launching in Phase 8.
        </p>
      </div>
    </div>
  );
}
