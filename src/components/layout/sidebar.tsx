"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useUIStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Briefcase,
  FolderOpen,
  BarChart2,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  FileText,
  Kanban,
  Wallet,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}
const studentNavItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Workflow", href: "/workflows", icon: Kanban },
  { name: "Portfolio", href: "/portfolio", icon: FolderOpen },
  { name: "Earnings", href: "/earnings", icon: Wallet },
  { name: "Escrow", href: "/escrow", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Messages", href: "/messages", icon: MessageSquare },
];
const businessNavItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Workflow", href: "/workflows", icon: Kanban },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Earnings", href: "/earnings", icon: Wallet },
  { name: "Escrow", href: "/escrow", icon: Shield },
  { name: "Messages", href: "/messages", icon: MessageSquare },
];
const bottomItems: SidebarItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
];
function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: SidebarItem;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium leading-[1.4] transition-colors",
          isActive
            ? "bg-brand-ink text-white"
            : "text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? "text-white" : "text-brand-muted group-hover:text-brand-ink"
          )}
        />
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
        {!collapsed && item.badge && (
          <span className="ml-auto rounded-full bg-brand-coral px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
            {item.badge}
          </span>
        )}
        {}
        {collapsed && (
          <span className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-brand-ink px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            {item.name}
          </span>
        )}
      </div>
    </Link>
  );
}
export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { profile } = useAuthStore();
  const navItems = profile?.role === "business" ? businessNavItems : studentNavItems;
  return (
    <motion.aside
      animate={{ width: isSidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className={cn(
        "hidden h-screen shrink-0 select-none flex-col overflow-visible border-r border-brand-hairline bg-white md:flex",
        isSidebarCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      {}
      <div className="flex h-16 items-center justify-between border-b border-brand-hairline px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-brand-ink">
          <Image
            src="/hyperhire-icon-gradient.png"
            alt="HyperHire"
            width={30}
            height={30}
            className="h-[30px] w-[30px] shrink-0 rounded-[8px]"
          />
          {!isSidebarCollapsed && (
            <span className="text-sm font-semibold leading-[1.4] text-brand-ink">HyperHire</span>
          )}
        </Link>
      </div>
      {}
      <nav className={cn("flex-1 space-y-0.5 p-3", isSidebarCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden")}>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            collapsed={isSidebarCollapsed}
          />
        ))}
      </nav>
      {}
      <div className="space-y-0.5 border-t border-brand-hairline p-3">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            collapsed={isSidebarCollapsed}
          />
        ))}
      </div>
      {}
      <div
        className={cn(
          "flex border-t border-brand-hairline p-2",
          isSidebarCollapsed ? "justify-center" : "justify-end"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-brand-muted hover:text-brand-ink"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
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
  const { profile } = useAuthStore();
  const navItems = profile?.role === "business" ? businessNavItems : studentNavItems;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-full w-[280px] flex-col bg-white p-0">
        {}
        <div className="flex h-16 items-center gap-2.5 border-b border-brand-hairline px-5">
          <Image
            src="/hyperhire-icon-gradient.png"
            alt="HyperHire"
            width={28}
            height={28}
            className="rounded-[7px]"
          />
          <span className="text-sm font-semibold text-brand-ink">HyperHire</span>
        </div>
        {}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={false}
              onClick={() => onOpenChange(false)}
            />
          ))}
        </nav>
        {}
        <div className="space-y-0.5 border-t border-brand-hairline p-3">
          {bottomItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={false}
              onClick={() => onOpenChange(false)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
