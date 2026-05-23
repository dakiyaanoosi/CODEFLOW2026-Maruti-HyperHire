"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, FileText, Star, Brain, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Candidate {
  name: string;
  college: string;
  avatarText: string;
  matchScore: number;
  skills: string[];
  reason: string;
}

export function AIIntelligence() {
  const [activeTab, setActiveTab] = React.useState<"matching" | "pitch">("matching");

  // Candidates for Matchmaker Simulation
  const candidates: Candidate[] = [
    {
      name: "Soham Gupta",
      college: "Jadavpur University • CS Senior",
      avatarText: "SG",
      matchScore: 96,
      skills: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
      reason: "Soham recently built the official Jadavpur tech-fest landing page with Next.js & Framer Motion, which handled 10k+ concurrent users. His local proximity (2km) ensures smooth collaboration.",
    },
    {
      name: "Rohan Sen",
      college: "St. Xavier's College • Design Lead",
      avatarText: "RS",
      matchScore: 91,
      skills: ["Figma", "UI/UX", "Branding", "Tailwind CSS"],
      reason: "Rohan has an outstanding design portfolio featuring landing pages for 3 local business startups in Kolkata. He has a Gold Trust Rating with 100% on-time milestone delivery.",
    },
    {
      name: "Priya Das",
      college: "IIT Kharagpur • Full Stack Intern",
      avatarText: "PD",
      matchScore: 85,
      skills: ["React", "TypeScript", "Node.js", "Firebase"],
      reason: "Priya has strong React and backend Firestore experience from a previous 6-month internship. Recommended for projects requiring robust data inputs and structural setup.",
    },
  ];

  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate>(candidates[0]);

  // Pitch Assistant Simulation
  const rawPitch = "hi, i can build your website landing page in 2 days. i know react and tailwind. i did similar landing page for college sports fest. hire me i am free now.";
  const optimizedPitch = "Hello! I am a final-year CS student with 2+ years of React and Tailwind CSS experience. I recently designed and deployed the responsive landing page for our university sports fest, handling registration pipelines. I can complete your landing page in 2 days with a high-performance Next.js 15 structure, clean typography, and micro-animations. I'm available to sync this afternoon to review your Figma mockup!";
  
  const [pitchState, setPitchState] = React.useState<"idle" | "optimizing" | "completed">("idle");
  const [typingText, setTypingText] = React.useState("");

  const handleOptimizePitch = () => {
    setPitchState("optimizing");
    setTypingText("");
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < optimizedPitch.length) {
        setTypingText((prev) => prev + optimizedPitch.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setPitchState("completed");
      }
    }, 8);
  };

  return (
    <section id="ai-intelligence" className="py-24 border-b px-4 md:px-8 bg-card/10 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[90px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Intelligence Layer</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Integrated AI that runs your matching and outreach.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            No generic prompts. HyperHire integrates semantic matching models and pitch assistants
            directly into student portfolios and business job cards.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center">
          <div className="flex bg-accent/40 rounded-full p-1 border backdrop-blur-md">
            <button
              onClick={() => setActiveTab("matching")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "matching"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" /> AI Matchmaker
            </button>
            <button
              onClick={() => setActiveTab("pitch")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "pitch"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" /> AI Pitch Optimizer
            </button>
          </div>
        </div>

        {/* Simulator Content Area */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "matching" ? (
              <motion.div
                key="matching-sim"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch"
              >
                {/* Candidate Selection List */}
                <div className="md:col-span-5 flex flex-col gap-3">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
                    Select Candidate to Match
                  </span>
                  {candidates.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => setSelectedCandidate(c)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedCandidate.name === c.name
                          ? "bg-card border-primary shadow-sm"
                          : "bg-card/45 border-transparent hover:border-accent hover:bg-card/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border font-bold text-xs flex items-center justify-center">
                          {c.avatarText}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-xs md:text-sm">{c.name}</h4>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                            {c.college.split(" • ")[0]}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary flex items-center gap-0.5 shrink-0">
                        <Star className="h-3 w-3 fill-current" /> {c.matchScore}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Match Explanation Output */}
                <div className="md:col-span-7">
                  <Card className="bg-card/45 border backdrop-blur-md h-full flex flex-col justify-between">
                    <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
                      <div className="text-left">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary animate-pulse" />
                          Recommendation Explanation
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                          Synthesizing skills, logs, and proximity metrics.
                        </CardDescription>
                      </div>
                      <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20">
                        COMPATIBILITY: {selectedCandidate.matchScore}%
                      </span>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between gap-6 text-left">
                      {/* Explanation Text block */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            AI Explanation Reasoning
                          </span>
                          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-foreground">
                            &ldquo;{selectedCandidate.reason}&rdquo;
                          </p>
                        </div>

                        {/* Skill Match list */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Skills Analyzed
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCandidate.skills.map((skill) => (
                              <span
                                key={skill}
                                className="text-[10px] font-medium bg-accent/60 border rounded-md px-2 py-0.5 flex items-center gap-1"
                              >
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" /> {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Small disclaimer */}
                      <span className="text-[9px] text-muted-foreground/60 border-t pt-2 block font-mono">
                        Generated by HyperMatch v1.0. Proximity filters set at 5km.
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pitch-sim"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
              >
                {/* Raw Input Box */}
                <Card className="bg-card/45 border backdrop-blur-md flex flex-col text-left">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold">Raw Student Draft</CardTitle>
                    <CardDescription className="text-[10px]">What the student wrote originally</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg border text-xs sm:text-sm font-medium leading-relaxed italic text-muted-foreground flex-1">
                      &ldquo;{rawPitch}&rdquo;
                    </div>
                    <Button
                      onClick={handleOptimizePitch}
                      disabled={pitchState === "optimizing"}
                      className="w-full h-9 rounded-lg text-xs font-bold shadow-md shadow-primary/10 gap-2 shrink-0"
                    >
                      {pitchState === "optimizing" ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Optimizing Proposal...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 fill-current" /> Optimize Proposal with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Optimized Output Box */}
                <Card className="bg-card/45 border border-primary/20 backdrop-blur-md flex flex-col text-left relative overflow-hidden">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Brain className="h-4 w-4 text-primary animate-pulse" />
                        AI Optimized Proposal
                      </CardTitle>
                      <CardDescription className="text-[10px]">Enhanced for conversion and style</CardDescription>
                    </div>
                    {pitchState === "completed" && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                        CONVERSION UP +45%
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="p-3 bg-card rounded-lg border text-xs sm:text-sm leading-relaxed font-semibold min-h-[120px] flex-1">
                      {pitchState === "idle" && (
                        <span className="text-muted-foreground/60 italic text-xs">
                          Click the Optimize button to simulate AI refinement.
                        </span>
                      )}
                      {(pitchState === "optimizing" || pitchState === "completed") && (
                        <span>{typingText}</span>
                      )}
                    </div>
                    {pitchState === "completed" && (
                      <div className="space-y-1 bg-primary/5 p-2 rounded border border-primary/10 text-[10px] text-muted-foreground shrink-0">
                        <span className="font-bold text-primary block">AI Enhancements Applied:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Professionalized salutation and CS major credential.</li>
                          <li>Highlighted matching college sports fest portfolio context.</li>
                          <li>Aligned timeline with Next.js 15 specifications.</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
