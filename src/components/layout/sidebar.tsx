"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LayoutDashboard, Briefcase, Users, Settings, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gigs & Tasks", href: "/jobs", icon: Briefcase },
  { name: "Talent Pool", href: "/talent", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: isSidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "hidden md:flex flex-col border-r bg-card/60 backdrop-blur-md h-screen sticky top-0 shrink-0 select-none overflow-hidden",
        isSidebarCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Brand logo header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent font-extrabold"
            >
              HyperHire
            </motion.span>
          )}
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer mb-1",
                  isActive
                    ? "text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-primary rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={cn("flex items-center justify-center shrink-0", isSidebarCollapsed ? "mx-auto" : "")}>
                  <Icon className={cn("h-5 w-5 transition-transform duration-200 group-hover:scale-105", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                </div>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse button footer */}
      <div className="p-3 border-t flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 hover:bg-accent rounded-md ml-auto"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full bg-card">
        <div className="px-6 border-b h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl" onClick={() => onOpenChange(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent font-extrabold">
              HyperHire
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={() => onOpenChange(false)}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer mb-1",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
