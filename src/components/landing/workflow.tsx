"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Hourglass } from "lucide-react";

export function Workflow() {
  const [activeStep, setActiveStep] = React.useState(1);

  const steps = [
    {
      title: "Match & Escrow",
      shortDesc: "AI matches the best student talent; escrow locks project milestones.",
      status: "Escrow locked",
      desc: "AI matched Soham Gupta with 96% compatibility. Milestone escrow INR 12,000 has been secured.",
    },
    {
      title: "Deliver & Track",
      shortDesc: "Students push files inside the workspace; progress checklist updates.",
      status: "Delivered",
      desc: "Files and project links are attached to the task card. Review checklist is pending client approval.",
    },
    {
      title: "Review & Refine",
      shortDesc: "Clients review deliverables and request revisions in one click.",
      status: "Client approved",
      desc: "All assets are approved. Revision loops are complete and the payment queue is ready.",
    },
    {
      title: "Instant Release",
      shortDesc: "Escrow funds release to the student; trust scores update.",
      status: "Paid",
      desc: "Escrow INR 12,000 released successfully. Trust score increased after on-time delivery.",
    },
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <section id="workflow" className="border-b border-brand-hairline bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink md:text-[40px]">
              Visual tracking from match to checkout.
            </h2>
            <p className="text-sm font-normal leading-[1.25] text-brand-body">
              Each project phase is guided by workspace cards, milestone evidence, and a clear next action.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(index + 1)}
                  className={`w-full rounded-[10px] border p-4 text-left ${
                    activeStep === index + 1
                      ? "border-brand-ink bg-brand-surface-soft"
                      : "border-brand-hairline bg-white"
                  }`}
                >
                  <div className="flex gap-4">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-xs font-medium ${
                      activeStep === index + 1 ? "bg-brand-primary text-white" : "bg-brand-surface-soft text-brand-muted"
                    }`}>
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium leading-[1.4] text-brand-ink">{step.title}</h3>
                      <p className="mt-1 text-xs leading-[1.25] text-brand-muted">{step.shortDesc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Card className="h-full rounded-[10px] bg-brand-cream p-0 ring-0">
              <CardContent className="flex h-full flex-col justify-between gap-8 p-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 border-b border-brand-hairline pb-4">
                    <div>
                      <h3 className="text-xl font-normal leading-[1.5] text-brand-ink">Local Cafe Branding Project</h3>
                      <p className="text-xs text-brand-muted">Active workspace card</p>
                    </div>
                    <span className="rounded-[6px] border border-brand-hairline bg-white px-2 py-1 text-xs font-medium text-brand-body">
                      {currentStep.status}
                    </span>
                  </div>
                  <p className="text-sm leading-[1.25] text-brand-body">{currentStep.desc}</p>
                  <div className="space-y-2 rounded-[10px] bg-white p-4">
                    {["Milestone evidence captured", "Client approval state synced", "Payment release status visible"].map((log) => (
                      <div key={log} className="flex items-start gap-2 text-sm text-brand-body">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-success" />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep((prev) => (prev === 4 ? 1 : prev + 1))}
                  className="flex items-center justify-between border-t border-brand-hairline pt-4 text-sm font-medium text-brand-link"
                >
                  <span className="flex items-center gap-2 text-brand-body">
                    <Hourglass className="h-4 w-4 text-brand-ink" />
                    Advance workflow
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
