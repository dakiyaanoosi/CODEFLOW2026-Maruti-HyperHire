"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { workflowService } from "@/lib/workflow-service";
import { aiWorkflowService } from "@/lib/ai-workflow-service";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { WorkflowBoard } from "@/components/workflows/WorkflowBoard";
import { Loader2, ArrowLeft, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspacePage({ params }: { params: { workflowId: string } }) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const workflowId = params.workflowId;

  const [workflow, setWorkflow] = React.useState<Workflow | null>(null);
  const [columns, setColumns] = React.useState<WorkflowColumn[]>([]);
  const [tasks, setTasks] = React.useState<WorkflowTask[]>([]);
  const [activities, setActivities] = React.useState<WorkflowActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // AI Insights State
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiInsight, setAiInsight] = React.useState<{ summary: string; insight: string; risk: string } | null>(null);

  const actorName = profile?.name || user?.displayName || "User";
  const isBusiness = profile?.role === "business";

  React.useEffect(() => {
    if (!workflowId) return;

    // Load Workflow metadata once (could also be a listener, but standard GET is fine for header)
    workflowService.getWorkflow(workflowId).then((data) => {
      if (!data) {
        router.replace("/workflows");
        return;
      }
      setWorkflow(data);
    });

    const unSubCols = workflowService.subscribeToColumns(workflowId, setColumns);
    const unSubTasks = workflowService.subscribeToTasks(workflowId, (newTasks) => {
      setTasks(newTasks);
      setIsLoading(false);
    });
    const unSubAct = workflowService.subscribeToActivity(workflowId, setActivities);

    return () => {
      unSubCols();
      unSubTasks();
      unSubAct();
    };
  }, [workflowId, router]);

  const handleRunAiAnalysis = async () => {
    if (!workflow) return;
    setIsAnalyzing(true);
    
    // In a real scenario, applicationText would be fetched from the application service.
    // We pass a generic context here for the hackathon.
    const result = await aiWorkflowService.analyzeWorkflow(
      workflow.jobTitle,
      "Application requirements context.", 
      tasks
    );

    setAiInsight({
      summary: result.summary,
      insight: result.productivity_insight,
      risk: result.risk_level
    });
    setIsAnalyzing(false);
  };

  if (!user || !profile || isLoading || !workflow) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // Calculate Progress (Dynamic based on completed tasks)
  const completedTasks = tasks.filter(t => t.status === "completed" || columns.find(c => c.columnId === t.columnId)?.name === "Completed").length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-hairline pb-4">
        <div className="flex items-center gap-4">
          <Link href="/workflows" className="p-2 -ml-2 rounded-md hover:bg-brand-surface-soft text-brand-muted hover:text-brand-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-brand-ink">{workflow.jobTitle}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase",
                workflow.status === "completed" ? "bg-brand-success/10 text-brand-success" : "bg-brand-surface-strong text-brand-ink"
              )}>
                {workflow.status}
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-0.5">
              Collaboration between <span className="font-medium text-brand-ink">{workflow.businessName}</span> and <span className="font-medium text-brand-ink">{workflow.studentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 h-2 bg-brand-surface-soft rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-xs font-semibold text-brand-ink">{progressPercent}%</span>
          </div>

          <button 
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-secondary text-white rounded-[8px] text-sm font-semibold hover:bg-brand-secondary/90 transition-colors disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            AI Analyze
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 flex gap-4 items-start"
          >
            <div className="bg-white p-2 rounded-md shadow-sm border border-brand-hairline shrink-0">
              <BrainCircuit className="w-5 h-5 text-brand-secondary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
                HyperAI Project Analysis
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                  aiInsight.risk === "High" ? "bg-brand-warning/10 text-brand-warning" : 
                  aiInsight.risk === "Medium" ? "bg-[#d9a441]/10 text-[#8a6200]" : "bg-brand-success/10 text-brand-success"
                )}>
                  Risk: {aiInsight.risk}
                </span>
              </h4>
              <p className="text-sm text-brand-muted mt-1 leading-relaxed">{aiInsight.summary}</p>
              <div className="mt-2 text-xs font-medium text-brand-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                {aiInsight.insight}
              </div>
            </div>
            <button 
              onClick={() => setAiInsight(null)}
              className="text-brand-muted hover:text-brand-ink p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Board Area */}
      <div className="flex-1 mt-4 -mx-4 px-4 overflow-hidden">
        <WorkflowBoard 
          workflow={workflow}
          columns={columns}
          tasks={tasks}
          activities={activities}
          actorId={user.uid}
          actorName={actorName}
        />
      </div>
    </div>
  );
}
