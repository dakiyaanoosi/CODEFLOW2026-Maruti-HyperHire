import { WorkflowTask } from "@/types/workflow";

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "https://hyperhire-ai-engine.onrender.com";

export interface WorkflowAnalysisResult {
  complexity: "Low" | "Medium" | "High";
  risk_level: "Low" | "Medium" | "High";
  summary: string;
  productivity_insight: string;
}

export const aiWorkflowService = {
  /**
   * Analyzes the current state of a workflow to provide intelligence insights.
   */
  async analyzeWorkflow(
    jobTitle: string,
    applicationText: string,
    currentTasks: WorkflowTask[]
  ): Promise<WorkflowAnalysisResult> {
    try {
      const response = await fetch(`${AI_API_URL}/workflow/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          application_text: applicationText,
          current_tasks: currentTasks.map((t) => t.title),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze workflow");
      }

      return await response.json();
    } catch (e) {
      console.error("AI Workflow Analysis failed:", e);
      // Fallback
      return {
        complexity: "Medium",
        risk_level: "Low",
        summary: "Analysis currently unavailable.",
        productivity_insight: "Stay consistent with updates.",
      };
    }
  },

  /**
   * Suggests an initial breakdown of tasks based on the job requirements.
   */
  async suggestTasks(
    jobTitle: string,
    applicationText: string
  ): Promise<string[]> {
    try {
      const response = await fetch(`${AI_API_URL}/workflow/suggest-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          application_text: applicationText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to suggest tasks");
      }

      const data = await response.json();
      return data.suggested_tasks || [];
    } catch (e) {
      console.error("AI Task Suggestion failed:", e);
      return [];
    }
  },
};
