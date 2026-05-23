"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="border-b border-brand-hairline bg-white px-4 py-24 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="space-y-8"
        >
          <div className="space-y-5">
            <h1 className="max-w-3xl text-[40px] font-normal leading-[1.2] tracking-normal text-brand-ink">
              The operating system for on-demand student talent.
            </h1>
            <p className="max-w-2xl text-sm font-normal leading-[1.25] text-brand-body">
              Deploy tasks to verified local students, match by skills and proximity, track progress, and release milestone payments from one quiet workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={
              <Link href="/signup">
                Sign up for free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            } />
            <Button variant="outline" size="lg" nativeButton={false} render={
              <Link href="/signup">Book Demo</Link>
            } />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Card className="rounded-[12px] bg-brand-coral p-0 text-white ring-0 sm:col-span-2">
            <CardContent className="grid gap-8 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12">
              <div className="space-y-4">
                <h2 className="text-[32px] font-normal leading-[1.2] tracking-normal">
                  Production staffing in prototype speed.
                </h2>
                <p className="text-sm leading-[1.25] text-white/90">
                  Turn a local requirement into a live student workspace with portfolio proof, trust context, and milestone controls.
                </p>
                <Button variant="outline" nativeButton={false} render={
                  <Link href="/dashboard">Open Workspace</Link>
                } />
              </div>
              <div className="rounded-[10px] bg-white p-4 text-brand-ink">
                <div className="mb-4 flex items-center justify-between border-b border-brand-hairline pb-3">
                  <div>
                    <p className="text-sm font-medium">Campus Fest Branding</p>
                    <p className="text-xs text-brand-muted">Active matchmaking</p>
                  </div>
                  <span className="rounded-[6px] border border-brand-hairline px-2 py-1 text-xs text-brand-body">
                    96% match
                  </span>
                </div>
                <div className="space-y-3">
                  {["Soham Gupta - Designer", "Ananya Roy - Web Dev", "Rohan Sen - Brand Lead"].map((candidate) => (
                    <div key={candidate} className="flex items-center justify-between rounded-[10px] bg-brand-surface-soft p-3">
                      <span className="text-sm">{candidate}</span>
                      <Check className="h-4 w-4 text-brand-success" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[10px] bg-brand-cream p-0 ring-0">
            <CardContent className="space-y-4 p-6">
              <ShieldCheck className="h-8 w-8 text-brand-forest" />
              <h3 className="text-2xl font-normal leading-[1.35] text-brand-ink">Escrow-backed milestones</h3>
              <p className="text-sm leading-[1.25] text-brand-body">Lock project funds, approve delivery, and release payment without chasing invoices.</p>
            </CardContent>
          </Card>

          <Card className="rounded-[10px] bg-brand-mint p-0 ring-0">
            <CardContent className="space-y-4 p-6">
              <Star className="h-8 w-8 text-brand-forest" />
              <h3 className="text-2xl font-normal leading-[1.35] text-brand-ink">Verified talent signals</h3>
              <p className="text-sm leading-[1.25] text-brand-body">Compare trust scores, portfolio proof, proximity, and response history in one view.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
