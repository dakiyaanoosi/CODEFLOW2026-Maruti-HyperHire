"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Briefcase, TrendingUp, Star, Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const STAT_CARDS = [
  {
    label: "Active Jobs",
    value: "—",
    delta: "Getting started",
    icon: Briefcase,
    accent: "bg-brand-peach",
    href: "/jobs",
  },
  {
    label: "Trust Score",
    value: "—",
    delta: "Build your profile",
    icon: Star,
    accent: "bg-brand-yellow",
    href: "/settings",
  },
  {
    label: "Demand Trend",
    value: "+32%",
    delta: "Video editing this week",
    icon: TrendingUp,
    accent: "bg-brand-mint",
    href: "/analytics",
  },
  {
    label: "Pending Actions",
    value: "—",
    delta: "Check AI copilot →",
    icon: Clock,
    accent: "bg-brand-cream",
    href: "/ai-assistant",
  },
];

const QUICK_LINKS = [
  { label: "Browse open jobs", href: "/jobs", desc: "Find gigs matching your skills" },
  { label: "Build your portfolio", href: "/portfolio", desc: "Showcase your best work" },
  { label: "View analytics", href: "/analytics", desc: "Track demand and trends" },
  { label: "Message a client", href: "/messages", desc: "Start or continue conversations" },
];

export default function DashboardPage() {
  const { profile } = useAuthStore();

  const firstName = profile?.name?.split(" ")[0] || "there";
  const roleLabel = profile?.role === "student" ? "Student Talent" : profile?.role === "business" ? "Business" : "User";
  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="rounded-full bg-brand-surface-strong px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
              {roleLabel}
            </span>
          </div>
          <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-2 text-sm font-normal leading-[1.5] text-brand-body">
            Your AI-native hyperlocal workforce operating system is ready.
          </p>
        </div>

        <Link
          href="/ai-assistant"
          className="flex shrink-0 items-center gap-2 rounded-[12px] bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-active active:bg-brand-primary-active sm:self-end"
        >
          <Sparkles className="h-4 w-4" />
          Ask AI Copilot
        </Link>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group block">
              <div className="relative overflow-hidden rounded-[10px] border border-brand-hairline bg-white p-4 transition-colors hover:border-brand-border-strong">
                <div className="flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${card.accent}`}>
                    <Icon className="h-4 w-4 text-brand-ink" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-brand-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-3 text-2xl font-semibold leading-none text-brand-ink">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-brand-muted">{card.label}</p>
                <p className="mt-0.5 text-[11px] text-brand-muted leading-[1.4]">{card.delta}</p>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* Main workspace area — two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI brief */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-2"
        >
          <div className="rounded-[10px] bg-brand-ink p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white/10">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">AI Workspace Brief</p>
              <span className="rounded-full bg-brand-mint px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink ml-auto">
                Live
              </span>
            </div>
            <p className="text-sm leading-[1.75] text-white/80">
              Demand for <span className="font-semibold text-white">video editing</span> and{" "}
              <span className="font-semibold text-white">landing page design</span> is surging in your region.
              Student talent with social media expertise has an average match score of 89% with active business listings.
              Your workspace is optimized and ready for Phase 2 profile setup.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Video Editing +32%", "Graphic Design +18%", "Social Media +11%"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
        >
          <div className="rounded-[10px] border border-brand-hairline bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
              Quick links
            </p>
            <div className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-[8px] px-3 py-2.5 transition-colors hover:bg-brand-surface-soft"
                >
                  <div>
                    <p className="text-xs font-semibold text-brand-ink">{link.label}</p>
                    <p className="text-[11px] text-brand-muted mt-0.5">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Platform status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
        className="rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-ink">Platform Build Status</p>
            <p className="mt-0.5 text-xs text-brand-muted">Features are being rolled out in phases</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-brand-surface-strong">
              <div className="h-full w-[10%] rounded-full bg-brand-ink" />
            </div>
            <span className="text-xs font-semibold text-brand-ink">Phase 1–3 of 10</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { name: "Landing Page", done: true },
            { name: "Auth System", done: true },
            { name: "Dashboard Shell", done: true },
            { name: "Profiles", done: false },
            { name: "Jobs", done: false },
          ].map(({ name, done }) => (
            <div
              key={name}
              className={`rounded-[6px] px-3 py-2 text-center text-[11px] font-semibold ${
                done
                  ? "bg-brand-ink text-white"
                  : "border border-brand-hairline bg-white text-brand-muted"
              }`}
            >
              {name}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
