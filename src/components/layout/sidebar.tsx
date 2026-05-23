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
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Building2,
  Store,
  FileText,
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
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Portfolio", href: "/portfolio", icon: FolderOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { name: "My Profile", href: "/profile", icon: User },
];

const businessNavItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Company Profile", href: "/business-profile", icon: Building2 },
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
        {/* Tooltip when collapsed */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-brand-ink px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            {item.name}
          </span>
        )}
      </div>
    </Link>
  );
}

function UserCard({ collapsed, profile }: { collapsed: boolean; profile: { name: string; email: string; role: string } | null }) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const roleLabel = profile?.role === "student" ? "Student" : profile?.role === "business" ? "Business" : "User";

  if (collapsed) {
    return (
      <button
        onClick={handleLogout}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white transition-opacity hover:opacity-80"
        title={`${profile?.name || "User"} — Log out`}
      >
        {initials}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-brand-ink">{profile?.name || "User"}</p>
        <p className="truncate text-[10px] text-brand-muted capitalize">{roleLabel}</p>
      </div>
      <button
        onClick={handleLogout}
        className="text-brand-muted transition-colors hover:text-brand-ink"
        title="Log out"
        aria-label="Log out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
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
        "hidden h-screen shrink-0 select-none flex-col overflow-x-hidden border-r border-brand-hairline bg-white md:flex",
        isSidebarCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Brand header */}
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

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-3">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            collapsed={isSidebarCollapsed}
          />
        ))}
      </nav>

      {/* Bottom nav (Settings) */}
      <div className="space-y-0.5 border-t border-brand-hairline p-3">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            collapsed={isSidebarCollapsed}
          />
        ))}

        {/* User card */}
        <div className={cn("pt-2", isSidebarCollapsed && "flex justify-center")}>
          <UserCard
            collapsed={isSidebarCollapsed}
            profile={profile ? { name: profile.name, email: profile.email, role: profile.role } : null}
          />
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="flex justify-end border-t border-brand-hairline p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-brand-muted hover:text-brand-ink"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
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
        {/* Brand */}
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

        {/* Primary nav */}
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

        {/* Bottom */}
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
          <div className="pt-2">
            <UserCard
              collapsed={false}
              profile={profile ? { name: profile.name, email: profile.email, role: profile.role } : null}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
