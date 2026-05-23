"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-24 border-b px-4 md:px-8 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative rounded-3xl border border-primary/20 bg-card/45 backdrop-blur-md p-8 md:p-16 text-center space-y-8 overflow-hidden shadow-xl shadow-primary/5"
        >
          {/* Decorative background grid inside card */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Ready to deploy your hyperlocal student workforce?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Match with vetted college talent in minutes, coordinate project milestones
            collaboratively, and secure payouts instantly upon approval.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 w-full sm:w-auto group" nativeButton={false} render={
              <Link href="/dashboard">
                Launch Workspace <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            } />
            <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto hover:bg-accent/40" nativeButton={false} render={
              <Link href="/dashboard">Create Account</Link>
            } />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
