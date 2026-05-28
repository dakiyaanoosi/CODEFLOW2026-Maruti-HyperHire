import { WorkflowTask } from "@/types/workflow";
import { Deliverable } from "@/types/deliverable";
import { Timestamp } from "firebase/firestore";

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
    role?: "student" | "business",
    deliverables?: Deliverable[],
    escrowStatus?: string,
    collaborationStatus?: string,
    escrowUpdatedAt?: unknown,
    releaseEligibleAt?: unknown
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

      const deliverableSignals = deliverables ? deliverables.map(d => ({
        title: d.title,
        version: d.version,
        reviewStatus: d.reviewStatus,
        feedback: d.feedback || null,
        submittedAt: d.submittedAt,
        reviewedAt: d.reviewedAt || null
      })) : [];

      const response = await fetch(`${AI_API_URL}/workflow/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          application_text: applicationText,
          current_tasks: currentTasks.map((t) => t.title),
          task_signals: taskSignals,
          deliverable_signals: deliverableSignals,
          inactivity_days: inactivityDays,
          overdue_count: overdueCount,
          role: role || null,
          escrow_status: escrowStatus || null,
          collaboration_status: collaborationStatus || null,
          escrow_updated_at: escrowUpdatedAt || null,
          release_eligible_at: releaseEligibleAt || null
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
      
      // Dynamic fallback based on overdue counts, inactivity, deliverable revision history, and financial friction
      let riskScore = 10;
      let revisionFrictionMessage = "";

      if (currentTasks.length === 0) riskScore += 30;
      if (overdueCount > 0) riskScore += Math.min(50, overdueCount * 20);
      if (inactivityDays > 0) riskScore += Math.min(40, Math.floor(inactivityDays * 10));

      if (deliverables && deliverables.length > 0) {
        const maxVersion = Math.max(...deliverables.map(d => d.version));
        const activeRevisions = deliverables.filter(d => d.reviewStatus === "revision_requested").length;

        if (maxVersion > 2) {
          riskScore += 25; // Repeated revision loop indicates communication friction
          revisionFrictionMessage = `⚠️ Repeated revisions detected (up to v${maxVersion}). Review alignment on task expectations to prevent timeline drift.`;
        } else if (activeRevisions > 0) {
          riskScore += 10;
          revisionFrictionMessage = `⚠️ Active revisions requested. Address client feedback precisely to clear execution blocks.`;
        }

        // Calculate average turnaround speed
        let totalTurnaroundMs = 0;
        let reviewedCount = 0;
        deliverables.forEach(d => {
          if (d.submittedAt && d.reviewedAt) {
            const subTime = d.submittedAt instanceof Timestamp ? d.submittedAt.toDate().getTime() : new Date(d.submittedAt).getTime();
            const revTime = d.reviewedAt instanceof Timestamp ? d.reviewedAt.toDate().getTime() : new Date(d.reviewedAt).getTime();
            if (revTime > subTime) {
              totalTurnaroundMs += (revTime - subTime);
              reviewedCount++;
            }
          }
        });

        if (reviewedCount > 0) {
          const avgHours = totalTurnaroundMs / (1000 * 60 * 60);
          if (avgHours > 48 && role === "business") {
            revisionFrictionMessage += ` Slow review turnaround detected (averaging ${Math.round(avgHours)} hours). Approve or reject quickly to keep the workspace momentum active.`;
          }
        }
      }

      // Local fallback diagnostics for financial friction
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      const twoDays = 2 * 24 * 60 * 60 * 1000;

      const getParsedDate = (val: unknown): Date | null => {
        if (!val) return null;
        if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as { toDate: unknown }).toDate === "function") {
          return (val as { toDate: () => Date }).toDate();
        }
        if (typeof val === "string" || typeof val === "number" || val instanceof Date) {
          return new Date(val as string | number | Date);
        }
        return null;
      };

      const parsedEscrowUpdated = getParsedDate(escrowUpdatedAt);
      const parsedReleaseEligible = getParsedDate(releaseEligibleAt);

      let financialFrictionMessage = "";
      if ((collaborationStatus === "awaiting_funding" || escrowStatus === "pending_funding") && parsedEscrowUpdated && (now.getTime() - parsedEscrowUpdated.getTime() > threeDays)) {
        riskScore += 20;
        financialFrictionMessage += " ⚠️ Escrow funding is stalled (pending for >3 days). Business must fund the escrow to unlock work execution.";
      }
      if (escrowStatus === "eligible_for_release" && parsedReleaseEligible && (now.getTime() - parsedReleaseEligible.getTime() > twoDays)) {
        riskScore += 15;
        financialFrictionMessage += " ⚠️ Release lag detected (eligible for >2 days). Client should release the approved payment.";
      }
      if (escrowStatus === "disputed") {
        riskScore = 100;
        financialFrictionMessage += " ⚠️ ACTIVE CONTRACT DISPUTE. All workflow execution tasks are frozen.";
      }

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

      if (revisionFrictionMessage) {
        summary = `${summary} ${revisionFrictionMessage}`;
      }
      if (financialFrictionMessage) {
        summary = `${summary} ${financialFrictionMessage}`;
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
