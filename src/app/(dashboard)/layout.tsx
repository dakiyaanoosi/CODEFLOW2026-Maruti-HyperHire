"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { RightPanel } from "@/components/layout/right-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-background/95 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Contextual Right Details Panel */}
      <RightPanel />
    </div>
  );
}
