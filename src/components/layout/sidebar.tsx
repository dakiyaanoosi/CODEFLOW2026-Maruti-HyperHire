"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Briefcase, ChevronLeft, ChevronRight, LayoutDashboard, Settings, Users } from "lucide-react";
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

function Brand({ collapsed = false, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-xl font-medium text-brand-ink" onClick={onClick}>
      <Image
        src="/hyperhire-icon-gradient.png"
        alt="HyperHire Icon"
        width={32}
        height={32}
        className="h-8 w-8 rounded-[10px]"
      />
      {!collapsed && <span>HyperHire</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: isSidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={cn(
        "hidden h-screen shrink-0 select-none overflow-hidden border-r border-brand-hairline bg-white md:flex md:flex-col",
        isSidebarCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-brand-hairline px-4">
        <Brand collapsed={isSidebarCollapsed} />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium leading-[1.4]",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-brand-muted"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-end border-t border-brand-hairline p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-10 w-10"
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
      <SheetContent side="left" className="flex h-full w-[280px] flex-col bg-white p-0">
        <div className="flex h-16 items-center border-b border-brand-hairline px-6">
          <Brand onClick={() => onOpenChange(false)} />
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={() => onOpenChange(false)}>
                <div
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium",
                    isActive ? "bg-brand-primary text-white" : "text-brand-muted"
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
