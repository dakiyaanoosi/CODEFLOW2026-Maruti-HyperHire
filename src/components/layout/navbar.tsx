"use client";

import * as React from "react";
import { Menu, Search, Bell, PanelRightClose, PanelRight, ChevronDown } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileSidebar } from "./sidebar";

export function Navbar() {
  const { isRightPanelOpen, toggleRightPanel } = useUIStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/60 backdrop-blur-md px-4 md:px-6 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>

        {/* Search Bar Placeholder */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search gigs, talent or settings..."
            className="w-full bg-accent/40 rounded-lg pl-9 pr-4 py-2 text-sm border border-transparent hover:border-accent focus:border-primary/30 focus:bg-background focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search trigger for mobile */}
        <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                <span className="sr-only">Notifications</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Right Panel Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          className="h-9 w-9 rounded-full"
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="h-5 w-5 text-primary" />
          ) : (
            <PanelRight className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="sr-only">Toggle Right Panel</span>
        </Button>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="flex items-center gap-2 p-1 rounded-full pl-2 hover:bg-accent/40">
                <Avatar className="h-7 w-7 border">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing & Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render Mobile Sidebar */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
