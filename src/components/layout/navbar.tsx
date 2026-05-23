"use client";

import * as React from "react";
import { Bell, ChevronDown, Menu, PanelRight, PanelRightClose, Search } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
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
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="h-5 w-5 text-brand-ink" />
          ) : (
            <PanelRight className="h-5 w-5 text-brand-muted" />
          )}
          <span className="sr-only">Toggle Right Panel</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="flex min-h-10 items-center gap-2 rounded-full p-1 pl-2">
                <Avatar className="h-7 w-7 border border-brand-hairline">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-4 w-4 text-brand-muted sm:block" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 rounded-[10px] border-brand-hairline bg-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing & Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
