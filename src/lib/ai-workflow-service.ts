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
    const now = new Date();
    
    // Calculate overdue count
    const overdueCount = currentTasks.filter(t => 
      t.status !== "completed" && 
      t.dueDate && 
      new Date(t.dueDate).getTime() < now.getTime()
    ).length;

    // Calculate inactivity days
    let inactivityDays = 0;
    if (currentTasks.length > 0) {
      const lastUpdate = Math.max(...currentTasks.map(t => new Date(t.updatedAt || t.createdAt).getTime()));
      inactivityDays = Math.max(0, (now.getTime() - lastUpdate) / (1000 * 60 * 60 * 24));
    }

    try {
      const taskSignals = currentTasks.map(t => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate || null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));

      const response = await fetch(`${AI_API_URL}/workflow/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          application_text: applicationText,
          current_tasks: currentTasks.map((t) => t.title),
          task_signals: taskSignals,
          inactivity_days: inactivityDays,
          overdue_count: overdueCount
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze workflow");
      }

      return await response.json();
    } catch (e) {
      console.error("AI Workflow Analysis failed, using local model:", e);
      
      // Dynamic fallback based on overdue counts and inactivity
      let riskScore = 10;
      if (currentTasks.length === 0) riskScore += 30;
      if (overdueCount > 0) riskScore += Math.min(50, overdueCount * 20);
      if (inactivityDays > 0) riskScore += Math.min(40, Math.floor(inactivityDays * 10));
      riskScore = Math.min(100, riskScore);

      let risk_level: "Low" | "Medium" | "High" = "Low";
      if (riskScore >= 70) risk_level = "High";
      else if (riskScore >= 30) risk_level = "Medium";

      let complexity: "Low" | "Medium" | "High" = "Low";
      if (currentTasks.length > 10 || jobTitle.toLowerCase().includes("backend") || jobTitle.toLowerCase().includes("ai")) {
        complexity = "High";
      } else if (currentTasks.length > 5) {
        complexity = "Medium";
      }

      let summary = "";
      if (currentTasks.length === 0) {
        summary = "[Fallback Mode] No tasks have been created. High risk of project stalling.";
      } else if (overdueCount > 0) {
        summary = `[Fallback Mode] Workflow has ${overdueCount} overdue task(s). Action is required.`;
      } else if (inactivityDays > 4.0) {
        summary = `[Fallback Mode] No board activity recorded in ${Math.floor(inactivityDays)} days.`;
      } else {
        summary = "[Fallback Mode] Workflow is well-structured and actively managed.";
      }

      return {
        complexity,
        risk_level,
        summary,
        productivity_insight: "Breaking down tasks into smaller, <2 day deliverables improves velocity by 34%.",
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
