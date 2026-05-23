"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="border-b border-brand-hairline bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-[12px] bg-brand-surface-strong p-8 md:p-12"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
                Start building your hyperlocal student workforce.
              </h2>
              <p className="text-sm font-normal leading-[1.25] text-brand-body">
                Match with vetted college talent in minutes, coordinate milestones, and secure payouts when work is approved.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={
                <Link href="/dashboard">
                  Sign up for free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              } />
              <Button variant="outline" size="lg" nativeButton={false} render={
                <Link href="/dashboard">Book Demo</Link>
              } />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
