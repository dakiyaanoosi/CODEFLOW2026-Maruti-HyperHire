"use client";

import * as React from "react";
import { Bell, ChevronDown, Menu, PanelRightClose, Search, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { useAuthStore } from "@/store/use-auth-store";
import { authService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileSidebar } from "./sidebar";

export function Navbar() {
  const router = useRouter();
  const { isRightPanelOpen, toggleRightPanel } = useUIStore();
  const { user, profile, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-brand-hairline bg-white px-4 md:px-6 select-none">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>

        <div className="relative hidden w-64 sm:block md:w-80">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-brand-muted" />
          <input
            type="search"
            placeholder="Search gigs, talent or settings..."
            className="h-11 w-full rounded-[6px] border border-brand-hairline bg-white py-3 pl-10 pr-4 text-sm font-normal leading-[1.25] text-brand-ink outline-none focus:border-brand-info-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-coral" />
                <span className="sr-only">Notifications</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 rounded-[10px] border-brand-hairline bg-white">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-brand-muted">
              No new notifications.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          className={isRightPanelOpen ? "text-brand-ink" : ""}
          title={isRightPanelOpen ? "Close AI Copilot" : "Open AI Copilot"}
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="h-5 w-5 text-brand-ink" />
          ) : (
            <Sparkles className="h-5 w-5 text-brand-muted" />
          )}
          <span className="sr-only">Toggle AI Copilot Panel</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="flex min-h-10 items-center gap-2 rounded-full p-1 pl-2">
                <Avatar className="h-7 w-7 border border-brand-hairline">
                  {user?.photoURL && (
                    <AvatarImage src={user.photoURL} alt={profile?.name || "User"} />
                  )}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-4 w-4 text-brand-muted sm:block" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 rounded-[10px] border-brand-hairline bg-white">
            <DropdownMenuLabel className="flex flex-col text-left">
              <span className="font-semibold text-brand-ink">{profile?.name || "User"}</span>
              <span className="text-xs text-brand-muted font-normal truncate">{profile?.email || ""}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Billing & Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
