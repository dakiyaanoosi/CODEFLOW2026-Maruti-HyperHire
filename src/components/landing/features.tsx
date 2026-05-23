"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Briefcase, Lock, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
  const items = [
    {
      icon: Compass,
      title: "Hyperlocal Matchmaking",
      description: "Match with skilled students nearby. Set custom travel radii to coordinate physical or digital delivery instantly.",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-500",
    },
    {
      icon: Briefcase,
      title: "Verified Skill Portfolios",
      description: "Browse high-definition project proofs, images, videos, and PDF case studies. Summarized automatically by local AI models.",
      color: "from-purple-500/20 to-pink-500/20 text-purple-500",
    },
    {
      icon: Lock,
      title: "Milestone-Based Escrow",
      description: "Secure agreements with automated simulated escrows. Payments lock at gig start and release instantly upon milestone approval.",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-500",
    },
    {
      icon: Trophy,
      title: "Dynamic Trust Scores",
      description: "Evaluate candidates using live scores based on completion ratios, response latency, deadlines, and client feedback.",
      color: "from-amber-500/20 to-orange-500/20 text-amber-500",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden border-b px-4 md:px-8">
      {/* Glow backgrounds */}
      <div className="absolute top-1/2 left-10 w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Core Architecture</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Workforce operations, redesigned for the AI era.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            HyperHire provides the visual pipelines, instant contracts, and smart matching
            to run on-demand operations with local college networks.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={cardVariants}>
                <Card className="bg-card/40 border backdrop-blur-md hover:border-primary/20 hover:bg-card/65 transition-all duration-300 group shadow-sm select-none h-full">
                  <CardHeader className="pb-3 flex flex-row items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-sm border border-white/5`}>
                      <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
