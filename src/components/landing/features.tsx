"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Compass, Lock, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
  const items = [
    {
      icon: Compass,
      title: "Hyperlocal Matchmaking",
      description: "Match with skilled students nearby. Set custom travel radii to coordinate physical or digital delivery instantly.",
      surface: "bg-brand-peach",
    },
    {
      icon: Briefcase,
      title: "Verified Skill Portfolios",
      description: "Browse project proofs, images, videos, and PDF case studies summarized into useful hiring context.",
      surface: "bg-brand-mint",
    },
    {
      icon: Lock,
      title: "Milestone-Based Escrow",
      description: "Secure agreements with simulated escrows that lock at gig start and release after milestone approval.",
      surface: "bg-brand-cream",
    },
    {
      icon: Trophy,
      title: "Dynamic Trust Scores",
      description: "Evaluate candidates using completion ratios, response latency, deadlines, and client feedback.",
      surface: "bg-brand-yellow",
    },
  ];

  return (
    <section id="features" className="border-b border-brand-hairline bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink md:text-[40px]">
            Workforce operations, redesigned for local student networks.
          </h2>
          <p className="text-sm font-normal leading-[1.25] text-brand-body">
            HyperHire provides visual pipelines, instant contracts, and smart matching for teams that rely on nearby college talent.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
                }}
                className={index % 2 === 1 ? "lg:pt-10" : ""}
              >
                <Card className={`${item.surface} h-full rounded-[10px] p-0 ring-0`}>
                  <CardContent className="space-y-6 p-6">
                    <Icon className="h-8 w-8 text-brand-ink" />
                    <div className="space-y-3">
                      <h3 className="text-xl font-normal leading-[1.5] tracking-normal text-brand-ink">{item.title}</h3>
                      <p className="text-sm font-normal leading-[1.25] text-brand-body">{item.description}</p>
                    </div>
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
