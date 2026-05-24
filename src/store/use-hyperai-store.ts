import { create } from "zustand";
import { ChatMessage, ChatRequest, ChatResponse } from "@/services/ai/types";
import { aiService } from "@/services/ai/service";
import { ContextualInsight, AIEcosystemSummary } from "@/types/hyperai";

interface HyperAIState {
  isOpen: boolean;
  history: ChatMessage[];
  isLoading: boolean;
  pageContext: string | null;
  userRole: "student" | "business" | null;
  activeJob: any | null;
  activeProfile: any | null;
  activePortfolio: any[] | null;
  activeApplication: any | null;
  recommendationState: any | null;
  suggestions: string[];
  quickActions: string[];
  reasoningHighlights: Record<string, any> | null;
  /** True when at least one meaningful context entity is set */
  contextLoaded: boolean;

  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  /** Open the panel and pre-fill a message in one call */
  openWithMessage: (message: string) => Promise<void>;
  setContext: (context: {
    pageContext?: string | null;
    userRole?: "student" | "business" | null;
    activeJob?: any | null;
    activeProfile?: any | null;
    activePortfolio?: any[] | null;
    activeApplication?: any | null;
    recommendationState?: any | null;
  }) => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;

  // Contextual Intelligence State
  insights: ContextualInsight[];
  ecosystemSummary: AIEcosystemSummary | null;
  dismissedInsightIds: Record<string, number>;
  isEvaluatingContext: boolean;
  
  setEvaluatingContext: (evaluating: boolean) => void;
  setContextData: (insights: ContextualInsight[], summary: AIEcosystemSummary) => void;
  dismissInsight: (id: string) => void;
}

export const useHyperAIStore = create<HyperAIState>((set, get) => ({
  isOpen: false,
  history: [],
  isLoading: false,
  pageContext: null,
  userRole: null,
  activeJob: null,
  activeProfile: null,
  activePortfolio: null,
  activeApplication: null,
  recommendationState: null,
  suggestions: [],
  quickActions: [],
  reasoningHighlights: null,
  contextLoaded: false,

  insights: [],
  ecosystemSummary: null,
  dismissedInsightIds: {},
  isEvaluatingContext: false,

  openAssistant: () => set({ isOpen: true }),
  closeAssistant: () => set({ isOpen: false }),
  toggleAssistant: () => set((state) => ({ isOpen: !state.isOpen })),

  openWithMessage: async (message) => {
    set({ isOpen: true });
    // Small delay to allow panel animation to start
    await new Promise((r) => setTimeout(r, 350));
    await get().sendMessage(message);
  },

  setContext: (context) => {
    const prevRole = get().userRole;
    set((state) => ({
      ...state,
      ...context,
      contextLoaded: !!(
        context.activeJob ??
        context.activeProfile ??
        context.activePortfolio ??
        context.activeApplication ??
        state.activeJob ??
        state.activeProfile ??
        state.activePortfolio ??
        state.activeApplication
      ),
    }));

    // If role changed or history is empty, populate role-aware greeting
    const newRole = context.userRole || get().userRole;
    if (newRole !== prevRole || get().history.length === 0) {
      get().clearHistory();
    }
  },

  sendMessage: async (content) => {
    const {
      history,
      pageContext,
      userRole,
      activeJob,
      activeProfile,
      activePortfolio,
      activeApplication,
      recommendationState,
    } = get();

    const userMsg: ChatMessage = { role: "user", content };
    const updatedHistory = [...history, userMsg];

    set({ history: updatedHistory, isLoading: true, reasoningHighlights: null });

    try {
      const request: ChatRequest = {
        message: content,
        history: updatedHistory,
        pageContext,
        userRole,
        activeJob,
        activeProfile,
        activePortfolio,
        activeApplication,
        recommendationState,
      };

      const res: ChatResponse = await aiService.chatWithAssistant(request);

      set({
        history: [...updatedHistory, { role: "assistant", content: res.response }],
        suggestions: res.suggestions ?? [],
        quickActions: res.quickActions ?? [],
        reasoningHighlights: res.reasoningHighlights ?? null,
        isLoading: false,
      });
    } catch (err) {
      console.error("HyperAI Store: sendMessage failed", err);
      set({
        history: [
          ...updatedHistory,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting to the HyperHire AI Engine. Please verify your internet connection, make sure the AI service is running, or check if the local FastAPI server is running if you are in development mode.",
          },
        ],
        isLoading: false,
      });
    }
  },

  clearHistory: () => {
    const role = get().userRole;
    const profile = get().activeProfile;
    const name = profile?.name ? ` ${profile.name.split(" ")[0]}` : "";

    let greeting = "";
    let actions: string[] = [];
    let hints: string[] = [];

    if (role === "business") {
      greeting = `Hello! I'm HyperAI, your hiring intelligence copilot.${name ? ` Great to have you,${name}.` : ""} I can analyze your job descriptions, rank candidates, optimize requirements, and explain AI match scores. Select a quick action or ask me anything about your hiring pipeline.`;
      actions = ["Improve Gig", "Analyze Candidate Quality", "Optimize Hiring Requirements", "Predict Application Quality"];
      hints = [
        "Open a job post to let me analyze it for quality improvements.",
        "Click 'Rank Candidates' on any gig to load live match data.",
      ];
    } else {
      greeting = `Hello! I'm HyperAI, your career intelligence copilot.${name ? ` Welcome back,${name}!` : ""} I can optimize your profile, analyze portfolio relevance, explain match scores, and suggest trending skills for your target roles. Select a quick action or ask me anything.`;
      actions = ["Improve Profile", "Analyze Portfolio", "Suggest Trending Skills", "Explain Match Score"];
      hints = [
        "Select a gig in the marketplace to get a detailed match breakdown.",
        "Add trending skills to your profile to rank higher in AI recommendations.",
      ];
    }

    set({
      history: [{ role: "assistant", content: greeting }],
      suggestions: hints,
      quickActions: actions,
      reasoningHighlights: null,
    });
  },

  setEvaluatingContext: (evaluating) => set({ isEvaluatingContext: evaluating }),
  
  setContextData: (insights, summary) => {
    // Filter out dismissed insights (cooldown of 24h)
    const now = Date.now();
    const { dismissedInsightIds } = get();
    
    // Clean up expired cooldowns
    const activeDismissals = { ...dismissedInsightIds };
    for (const [id, timestamp] of Object.entries(activeDismissals)) {
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        delete activeDismissals[id];
      }
    }

    const filteredInsights = insights.filter(i => !activeDismissals[i.id]);

    set({ 
      insights: filteredInsights, 
      ecosystemSummary: summary,
      dismissedInsightIds: activeDismissals
    });
  },

  dismissInsight: (id) => {
    set((state) => ({
      insights: state.insights.filter(i => i.id !== id),
      dismissedInsightIds: {
        ...state.dismissedInsightIds,
        [id]: Date.now()
      }
    }));
  }
}));
