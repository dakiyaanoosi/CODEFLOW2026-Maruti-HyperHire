"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, ShieldCheck, Hourglass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WorkflowStep {
  number: number;
  title: string;
  shortDesc: string;
  statusBadge: string;
  statusColor: string;
  statusBg: string;
  cardTitle: string;
  desc: string;
  logs: string[];
  actionMessage: string;
}

export function Workflow() {
  const [activeStep, setActiveStep] = React.useState<number>(1);

  const steps: WorkflowStep[] = [
    {
      number: 1,
      title: "Match & Escrow",
      shortDesc: "AI matches the best student talent; escrow locks project milestones.",
      statusBadge: "ESCROW LOCKED",
      statusColor: "text-emerald-500 border-emerald-500/20",
      statusBg: "bg-emerald-500/10",
      cardTitle: "Local Cafe Branding Project",
      desc: "AI matched candidate Soham Gupta (IIT Kharagpur) with 96% compatibility. Milestone escrow INR 12,000 has been secured in the smart contract.",
      logs: [
        "Business deposited milestone escrow funds.",
        "Candidate accepted contract terms.",
        "AI initialized task workspace.",
      ],
      actionMessage: "Workspace ready. Waiting for student delivery.",
    },
    {
      number: 2,
      title: "Deliver & Track",
      shortDesc: "Students push files inside the workspace; progress checklist updates.",
      statusBadge: "DELIVERED / REVIEW",
      statusColor: "text-blue-500 border-blue-500/20",
      statusBg: "bg-blue-500/10",
      cardTitle: "Local Cafe Branding Project",
      desc: "Soham Gupta has submitted files: 'cafe-logo-final.pdf', 'cafe-branding-figma-link'. Review checklist is pending client approval.",
      logs: [
        "Student submitted branding guidelines draft.",
        "Checklist: 4/4 deliverables uploaded.",
        "Figma file link linked to workspace.",
      ],
      actionMessage: "Awaiting client review & approval.",
    },
    {
      number: 3,
      title: "Review & Refine",
      shortDesc: "Clients review deliverables and request revisions in one click.",
      statusBadge: "CLIENT APPROVED",
      statusColor: "text-purple-500 border-purple-500/20",
      statusBg: "bg-purple-500/10",
      cardTitle: "Local Cafe Branding Project",
      desc: "Client approved all 4 design assets. Revision loops completed. Escrow system queue is preparing payment release.",
      logs: [
        "Client marked deliverables as approved.",
        "Checklist completed successfully.",
        "Revision loops resolved.",
      ],
      actionMessage: "Releasing escrow INR 12,000...",
    },
    {
      number: 4,
      title: "Instant Release",
      shortDesc: "Escrow funds release instantly to student; trust scores update.",
      statusBadge: "PAID / OUTCOME",
      statusColor: "text-amber-500 border-amber-500/20",
      statusBg: "bg-amber-500/10",
      cardTitle: "Local Cafe Branding Project",
      desc: "Escrow INR 12,000 released successfully to Soham. Soham's trust score boosted by +12% for on-time delivery.",
      logs: [
        "Funds transferred to student wallet.",
        "Client submitted 5★ rating: 'Excellent work!'",
        "Student trust score updated to Gold level.",
      ],
      actionMessage: "Project complete. Both parties reviewed.",
    },
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <section id="workflow" className="py-24 border-b px-4 md:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Workspace Pipelines</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Visual tracking from match to checkout.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Manage student projects through visual pipelines. Each project progress phase
            is secured by smart contracts and guided by collaborative workspace cards.
          </p>
        </div>

        {/* Step Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left Column - Steps controls */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1 text-left block">
              Workspace Workflow Stages
            </span>
            {steps.map((step) => (
              <div
                key={step.number}
                onClick={() => setActiveStep(step.number)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex gap-4 items-start ${
                  activeStep === step.number
                    ? "bg-card border-primary shadow-sm"
                    : "bg-card/45 border-transparent hover:border-accent hover:bg-card/60"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  activeStep === step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/40 text-muted-foreground"
                }`}>
                  0{step.number}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm">{step.title}</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                    {step.shortDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Status Detail Card */}
          <div className="lg:col-span-7 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Card className="bg-card/45 border backdrop-blur-md text-left shadow-lg overflow-hidden">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">
                        {currentStep.cardTitle}
                      </CardTitle>
                      <CardDescription className="text-[10px]">Active Project Workspace Card</CardDescription>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${currentStep.statusBg} ${currentStep.statusColor}`}>
                      {currentStep.statusBadge}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Description */}
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                      {currentStep.desc}
                    </p>

                    {/* Progress checklist/logs */}
                    <div className="space-y-2 bg-accent/20 p-3 rounded-lg border">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Project Log Stream
                      </span>
                      <ul className="space-y-1.5 text-[11px] font-mono">
                        {currentStep.logs.map((log) => (
                          <li key={log} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{log}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t font-mono">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Hourglass className="h-3.5 w-3.5 text-primary animate-pulse" />
                        {currentStep.actionMessage}
                      </span>
                      {activeStep < 4 ? (
                        <button
                          onClick={() => setActiveStep((prev) => prev + 1)}
                          className="flex items-center gap-1 text-primary font-bold hover:underline"
                        >
                          Next Step <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-0.5 text-emerald-500 font-bold">
                          <ShieldCheck className="h-4 w-4 fill-current" /> Complete
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
