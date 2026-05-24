"use client";

import * as React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { aiWorkflowService } from "@/lib/ai-workflow-service";
import { useState } from "react";

interface WorkflowEmptyStateProps {
  jobTitle: string;
  applicationText: string;
  onSuggestTasks: (tasks: string[]) => void;
}

export function WorkflowEmptyState({ jobTitle, applicationText, onSuggestTasks }: WorkflowEmptyStateProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const suggestions = await aiWorkflowService.suggestTasks(jobTitle, applicationText);
    onSuggestTasks(suggestions);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 mt-10 rounded-[12px] border border-dashed border-brand-hairline bg-white/50 text-center max-w-lg mx-auto">
      <div className="h-12 w-12 rounded-full bg-brand-secondary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-brand-secondary" />
      </div>
      <h3 className="text-base font-semibold text-brand-ink mb-2">
        Let HyperAI kickstart this project
      </h3>
      <p className="text-sm text-brand-muted leading-relaxed mb-6">
        There are no tasks in this workspace. We can automatically generate a structured milestone breakdown based on the original job requirements.
      </p>
      
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand-ink text-white rounded-[8px] text-sm font-semibold hover:bg-brand-ink/90 transition-colors disabled:opacity-70"
      >
        {isGenerating ? "Generating Breakdown..." : "Generate AI Task Breakdown"}
        {!isGenerating && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
