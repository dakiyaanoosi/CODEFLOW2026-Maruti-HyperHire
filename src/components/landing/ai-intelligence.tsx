"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Check, FileText, Users } from "lucide-react";

type Tab = "matching" | "pitch";

export function AIIntelligence() {
  const [activeTab, setActiveTab] = React.useState<Tab>("matching");

  const candidates = [
    {
      name: "Soham Gupta",
      college: "Jadavpur University - CS Senior",
      match: "96%",
      reason: "Recent Next.js launch for a university event, strong motion portfolio, and close proximity to the project site.",
    },
    {
      name: "Rohan Sen",
      college: "St. Xavier's College - Design Lead",
      match: "91%",
      reason: "Branding work for three local businesses, complete portfolio proof, and consistent milestone approvals.",
    },
    {
      name: "Priya Das",
      college: "IIT Kharagpur - Full Stack Intern",
      match: "85%",
      reason: "React and backend experience from a six-month internship with strong structured delivery notes.",
    },
  ];

  return (
    <section id="ai-intelligence" className="border-b border-brand-hairline bg-white px-4 py-12 md:py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-[12px] bg-brand-forest p-0 text-white ring-0">
          <CardContent className="grid gap-10 p-8 md:p-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal">
                  Integrated AI that runs matching and outreach.
                </h2>
                <p className="text-sm font-normal leading-[1.25] text-white/90">
                  Semantic matching and pitch assistance sit directly inside student portfolios and business job cards.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("matching")}
                  className={`flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-medium ${
                    activeTab === "matching"
                      ? "border-white bg-white text-brand-ink"
                      : "border-white/30 text-white"
                  }`}
                >
                  <Users className="h-4 w-4" /> AI Matchmaker
                </button>
                <button
                  onClick={() => setActiveTab("pitch")}
                  className={`flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-medium ${
                    activeTab === "pitch"
                      ? "border-white bg-white text-brand-ink"
                      : "border-white/30 text-white"
                  }`}
                >
                  <FileText className="h-4 w-4" /> Pitch Optimizer
                </button>
              </div>
            </div>

            <div className="rounded-[10px] bg-white p-4 text-brand-ink">
              {activeTab === "matching" ? (
                <div className="grid gap-3">
                  {candidates.map((candidate) => (
                    <div key={candidate.name} className="rounded-[10px] border border-brand-hairline p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium leading-[1.4]">{candidate.name}</h3>
                          <p className="text-xs text-brand-muted">{candidate.college}</p>
                        </div>
                        <span className="rounded-[6px] bg-brand-surface-soft px-2 py-1 text-sm font-medium text-brand-ink">
                          {candidate.match}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-[1.25] text-brand-body">{candidate.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[10px] bg-brand-surface-soft p-4">
                    <p className="mb-3 text-sm font-medium text-brand-ink">Raw student draft</p>
                    <p className="text-sm leading-[1.25] text-brand-body">
                      I can build your landing page in two days. I know React and Tailwind and made a similar page for a sports fest.
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-brand-hairline p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-ink">
                      <Brain className="h-4 w-4" /> Optimized proposal
                    </div>
                    <p className="text-sm leading-[1.25] text-brand-body">
                      I am a final-year CS student with React and Tailwind experience, including a recent university sports-fest launch. I can deliver a responsive landing page in two days and review the brief today.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-brand-success">
                      <Check className="h-4 w-4" /> Credentials, relevant proof, and timeline clarified.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
