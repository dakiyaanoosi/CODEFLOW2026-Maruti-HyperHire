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
    currentTasks: WorkflowTask[],
    role?: "student" | "business"
  ): Promise<WorkflowAnalysisResult> {
    const now = new Date();
    
    // Calculate overdue count
    const overdueCount = currentTasks.filter(t => 
      t.status !== "approved" && 
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
          overdue_count: overdueCount,
          role: role || null
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze workflow");
      }

      const result = await response.json();
      
      // If backend returns a general result, tailor it on client side for strict role enforcement
      if (role === "business") {
        return {
          ...result,
          summary: result.summary + " (Client Review Tip: Re-verify all deliverables before releasing payment. Use 'Revision Request' task type if changes are needed.)",
          productivity_insight: "Releasing escrow payments within 24 hours of successful delivery increases freelancer satisfaction and repeat client hire rates."
        };
      } else {
        return {
          ...result,
          summary: result.summary + " (Execution Tip: Keep tasks active and upload drafts regularly to show progress to the client.)",
          productivity_insight: "Breaking down execution tasks into small milestones of <2 days improves work velocity by 34%."
        };
      }
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
      let productivity_insight = "";
      
      if (role === "business") {
        productivity_insight = "Releasing escrow payments within 24 hours of successful delivery increases freelancer satisfaction and repeat client hire rates.";
        if (currentTasks.length === 0) {
          summary = "[Fallback Mode] No student execution tasks have been created yet. Project scope should be reviewed and tasks generated.";
        } else if (overdueCount > 0) {
          summary = `[Fallback Mode] Student has ${overdueCount} overdue task(s). Prepare to review their progress and request revisions if deliverables fall short.`;
        } else if (inactivityDays > 4.0) {
          summary = `[Fallback Mode] No student execution recorded in ${Math.floor(inactivityDays)} days. Check in with the student regarding deliverables.`;
        } else {
          summary = "[Fallback Mode] Freelancer is actively making progress. Verify deliverables once completed prior to releasing escrow.";
        }
      } else {
        productivity_insight = "Breaking down execution tasks into small milestones of <2 days improves work velocity by 34%.";
        if (currentTasks.length === 0) {
          summary = "[Fallback Mode] No execution tasks have been created. Focus on defining your project plan and adding execution tasks.";
        } else if (overdueCount > 0) {
          summary = `[Fallback Mode] You have ${overdueCount} overdue task(s). Focus on unblocking these items and upload deliverable files to proceed.`;
        } else if (inactivityDays > 4.0) {
          summary = `[Fallback Mode] No activity recorded on your execution board in ${Math.floor(inactivityDays)} days. Keep the client informed by updating task progress.`;
        } else {
          summary = "[Fallback Mode] Your board execution is active. Update progress and upload deliverables when ready to submit.";
        }
      }

      return {
        complexity,
        risk_level,
        summary,
        productivity_insight,
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
