"use client";

import * as React from "react";
import { Building2, ChevronDown, LogOut, Menu, User } from "lucide-react";
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
import { NotificationCenter } from "./NotificationCenter";

export function Navbar() {
  const router = useRouter();
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

  const handleProfileNavigation = () => {
    if (!profile) {
      router.push("/profile"); // Fallback if still loading
      return;
    }
    // Route to business profile if role is business (case-insensitive check just in case)
    if (profile.role?.toLowerCase() === "business") {
      router.push("/business-profile");
    } else {
      // Default to student profile
      router.push("/profile");
    }
  };

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
      </div>

      <div className="flex items-center gap-2">
        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex h-10 items-center gap-2 rounded-[10px] px-1.5 pr-2"
                title="Account menu"
              >
                <Avatar className="h-8 w-8 border border-brand-hairline">
                  {user?.photoURL && (
                    <AvatarImage src={user.photoURL} alt={profile?.name || "User"} />
                  )}
                  <AvatarFallback className={profile?.role === "business" ? "bg-brand-primary text-white" : "bg-brand-coral text-white"}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-brand-muted" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 rounded-[10px] border-brand-hairline bg-white">
            <DropdownMenuLabel className="truncate">
              {profile?.name || "Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileNavigation} className="gap-2">
              {profile?.role === "business" ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {profile?.role === "business" ? "Company Profile" : "Profile"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-brand-coral">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
