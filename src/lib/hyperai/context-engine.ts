import { trustService } from "@/lib/trust/trust-service";
import { workflowService } from "@/lib/workflow-service";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { PlatformSignalPayload, AIContextResponse } from "@/types/hyperai";
import { aiFetch } from "@/services/ai/client";

// Debounce helper
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  } as T;
}

class ContextEngine {
  private userId: string | null = null;
  private role: string | null = null;
  private unsubscribeTrust: (() => void) | null = null;
  private unsubscribeWorkflows: (() => void) | null = null;

  // Cached state for heuristic payload
  private trustProfile: any = null;
  private activeWorkflowsCount = 0;
  private overdueTasksCount = 0;

  // Evaluate the combined ecosystem state to generate Contextual Intelligence
  private evaluateEcosystem = debounce(async () => {
    if (!this.userId || !this.role || !this.trustProfile) return;

    const store = useHyperAIStore.getState();
    store.setEvaluatingContext(true);

    const payload: PlatformSignalPayload = {
      userId: this.userId,
      role: this.role,
      trustDimensions: this.trustProfile.dimensions || {
        reliability: 80, communication: 80, delivery: 80, collaboration: 80
      },
      activeWorkflowsCount: this.activeWorkflowsCount,
      overdueTasksCount: this.overdueTasksCount,
      recentActivityCount: 0, // Simplified for hackathon
      marketSpecialization: ["React", "UI/UX"] // In reality, pulled from active profile
    };

    try {
      const response = await aiFetch<AIContextResponse>(
        "/hyperai/context",
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        // Fallback if backend offline
        {
          summary: {
            executiveSummary: "Your marketplace presence is stable.",
            overallHealth: "stable",
            lastAnalyzedAt: new Date().toISOString()
          },
          insights: []
        }
      );

      store.setContextData(response.insights, response.summary);
    } catch (e) {
      console.error("[ContextEngine] Failed to evaluate ecosystem", e);
    } finally {
      store.setEvaluatingContext(false);
    }
  }, 2000); // 2 second debounce

  public boot(userId: string, role: string) {
    // Prevent duplicate boots
    if (this.userId === userId) return;
    this.shutdown();

    this.userId = userId;
    this.role = role;
    
    console.log(`[ContextEngine] Booting up for ${role} ${userId}`);

    // Subscribe to Trust
    this.unsubscribeTrust = trustService.subscribeToTrustProfile(userId, (profile) => {
      this.trustProfile = profile;
      this.evaluateEcosystem();
    });

    // Subscribe to Workflows
    this.unsubscribeWorkflows = workflowService.subscribeToUserWorkflows(userId, role as any, (workflows) => {
      this.activeWorkflowsCount = workflows.filter(w => w.status === "active").length;
      // Heuristic: Just pretending tasks are overdue if progress is low after some days
      // For hackathon scale, we will just use 0 unless we actually wired up deep deadline tracking
      this.evaluateEcosystem();
    });
  }

  public shutdown() {
    if (this.unsubscribeTrust) this.unsubscribeTrust();
    if (this.unsubscribeWorkflows) this.unsubscribeWorkflows();
    
    this.userId = null;
    this.role = null;
    this.trustProfile = null;
    console.log(`[ContextEngine] Shutdown complete`);
  }
}

export const contextEngine = new ContextEngine();
