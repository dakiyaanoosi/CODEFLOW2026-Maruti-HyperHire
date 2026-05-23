"use client";

import * as React from "react";
import { motion } from "framer-motion";

export function Stats() {
  const partners = [
    "IIT Kharagpur",
    "Jadavpur University",
    "St. Xavier's College",
    "Calcutta University",
    "Kolkata Tech Hub",
    "Bengal Enterprise",
  ];

  const stats = [
    { value: "15,000+", label: "Verified Students" },
    { value: "12 mins", label: "Average Match Time" },
    { value: "INR 45L+", label: "Student Earnings" },
    { value: "98.4%", label: "Job Completion Rate" },
  ];

  return (
    <section className="py-16 bg-card/20 border-b relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-12">
        {/* Partners / Trusted By Ticker */}
        <div className="space-y-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            Connecting Talent From Top Regional Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {partners.map((partner, index) => (
              <motion.span
                key={partner}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="text-sm font-semibold tracking-tight text-muted-foreground hover:text-foreground transition-colors cursor-default"
              >
                {partner}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-accent/60">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-center space-y-2"
            >
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
                {stat.value}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
