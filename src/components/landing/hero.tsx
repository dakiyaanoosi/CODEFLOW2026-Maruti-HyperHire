"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Lock, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden px-4 md:px-8 bg-white border-b border-brand-hairline">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl mx-auto flex flex-col items-center text-center space-y-8 z-10"
      >
        {/* Animated Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-hairline bg-brand-surface-soft text-xs font-semibold text-brand-primary"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-coral animate-pulse" />
          <span>AI-Native Hyperlocal Workforce OS</span>
        </motion.div>

        {/* Cinematic Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-brand-ink max-w-5xl leading-[1.1] font-sans"
        >
          The Operating System for{" "}
          <span className="text-brand-coral">
            On-Demand
          </span>{" "}
          Student Talent.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-brand-body max-w-3xl leading-relaxed font-normal"
        >
          Deploy tasks to verified local students instantly. Auto-match by skills,
          track progress in real-time, and settle payments through automated escrow.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Button size="lg" className="rounded-[12px] bg-brand-primary text-white hover:bg-brand-primary-active px-8 w-full sm:w-auto group" nativeButton={false} render={
            <Link href="/dashboard">
              Deploy a Task <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          } />
          <Button variant="outline" size="lg" className="rounded-[12px] border-brand-hairline bg-white text-brand-ink hover:bg-brand-surface-soft hover:text-brand-ink px-8 w-full sm:w-auto" nativeButton={false} render={
            <Link href="/dashboard">Join as Student</Link>
          } />
        </motion.div>

        {/* Dynamic Interactive Mockup Container */}
        <motion.div
          variants={itemVariants}
          className="w-full pt-12 relative flex justify-center"
        >
          {/* Main Mockup Screen */}
          <div className="w-full max-w-4xl border border-brand-hairline bg-white rounded-[12px] shadow-md overflow-hidden flex flex-col relative">
            {/* Header simulated bar */}
            <div className="flex h-12 items-center justify-between px-4 border-b border-brand-hairline bg-brand-surface-soft">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-hairline border" />
                <span className="w-3 h-3 rounded-full bg-brand-hairline border" />
                <span className="w-3 h-3 rounded-full bg-brand-hairline border" />
                <span className="text-[11px] font-mono ml-3 text-brand-muted select-none">hyperhire.ai/workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-20 rounded bg-brand-surface-strong/60 animate-pulse" />
              </div>
            </div>

            {/* Simulated Workspace View */}
            <div className="flex h-[360px] md:h-[450px] bg-white">
              {/* Sidebar simulation */}
              <div className="w-16 md:w-56 border-r border-brand-hairline p-3 hidden sm:flex flex-col gap-2 bg-brand-surface-soft select-none">
                <div className="h-8 rounded bg-brand-surface-strong/40 mb-4 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-7 rounded bg-brand-primary/10 border-l-2 border-brand-primary" />
                  <div className="h-7 rounded bg-transparent" />
                  <div className="h-7 rounded bg-transparent" />
                  <div className="h-7 rounded bg-transparent" />
                </div>
              </div>

              {/* Main Workspace Body simulation */}
              <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col gap-4 text-left select-none">
                <div className="flex items-center justify-between border-b border-brand-hairline pb-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm md:text-base text-brand-ink">Kolkata Campus Fest - Branding Campaign</h3>
                    <p className="text-[10px] md:text-xs text-brand-muted flex items-center gap-1">
                      <Zap className="h-3 w-3 text-brand-mustard fill-current" /> Active Matchmaking Engine
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-brand-mustard/10 text-brand-mustard border border-brand-mustard/20">
                    MATCHING...
                  </span>
                </div>

                {/* Match Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Candidate 1 */}
                  <Card className="bg-white border border-brand-hairline shadow-sm relative overflow-hidden rounded-[10px]">
                    <CardContent className="p-3.5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-brand-peach/10 border border-brand-peach text-brand-ink flex items-center justify-center font-bold text-xs">
                            SG
                          </div>
                          <div>
                            <h4 className="font-bold text-xs md:text-sm text-brand-ink">Soham Gupta</h4>
                            <p className="text-[10px] text-brand-muted">IIT Kharagpur • Designer</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-brand-coral flex items-center gap-0.5">
                            <Sparkles className="h-3 w-3 text-brand-coral fill-current" /> 96% Match
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-brand-body">
                          <span>Skills Match</span>
                          <span className="font-semibold">98%</span>
                        </div>
                        <div className="w-full bg-brand-surface-strong/40 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "98%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="bg-brand-primary h-full rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-brand-muted pt-1">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-brand-yellow fill-current" /> 4.9 (12 Gigs)
                        </span>
                        <span className="text-brand-coral font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3.5 w-3.5 fill-current" /> Trust Gold
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Candidate 2 */}
                  <Card className="bg-white border border-brand-hairline shadow-sm rounded-[10px]">
                    <CardContent className="p-3.5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-brand-mint/20 border border-brand-mint text-brand-ink flex items-center justify-center font-bold text-xs">
                            AR
                          </div>
                          <div>
                            <h4 className="font-bold text-xs md:text-sm text-brand-ink">Ananya Roy</h4>
                            <p className="text-[10px] text-brand-muted">Jadavpur Univ • Web Dev</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-brand-muted flex items-center gap-0.5">
                            <Sparkles className="h-3 w-3 text-brand-muted fill-current" /> 89% Match
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-brand-body">
                          <span>Skills Match</span>
                          <span className="font-semibold">90%</span>
                        </div>
                        <div className="w-full bg-brand-surface-strong/40 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "90%" }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            className="bg-brand-primary h-full rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-brand-muted pt-1">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-brand-yellow fill-current" /> 4.8 (8 Gigs)
                        </span>
                        <span className="text-brand-muted font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3.5 w-3.5 fill-current" /> Trust Silver
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-2 p-3 bg-brand-surface-soft rounded-lg border border-brand-hairline border-dashed flex items-center justify-between text-xs text-brand-body">
                  <span>Auto-generating smart contracts...</span>
                  <span className="font-mono text-[10px] text-brand-primary animate-pulse">Running model...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Card 1 — Escrow Locked */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-2/3 left-2 md:-left-6 z-20"
          >
            <Card className="bg-card/90 border border-primary/20 backdrop-blur-md shadow-xl max-w-[200px] md:max-w-[240px] select-none text-left">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Simulated Escrow Locked</h4>
                  <p className="text-[10px] text-muted-foreground">INR 15,000 Milestone secured</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Floating UI Card 2 — Trust Rating Boost */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: 2, ease: "easeInOut" }}
            className="absolute top-1/4 right-2 md:-right-6 z-20"
          >
            <Card className="bg-card/90 border border-purple-500/20 backdrop-blur-md shadow-xl max-w-[200px] md:max-w-[240px] select-none text-left">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">AI Match Rating</h4>
                  <p className="text-[10px] text-muted-foreground">Skill compatibility approved</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
