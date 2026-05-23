"use client";

import * as React from "react";
import { useUIStore } from "@/store/use-ui-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RightPanel() {
  const { isRightPanelOpen, setRightPanelOpen } = useUIStore();

  return (
    <AnimatePresence>
      {isRightPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden xl:flex flex-col border-l bg-card/60 backdrop-blur-md h-screen sticky top-0 shrink-0 select-none overflow-hidden"
        >
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <span className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Actions
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setRightPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Today&apos;s Hyperlocal Activity</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>Welcome to HyperHire! The workspace is configured and ready.</p>
                  <div className="p-3 bg-accent/40 rounded-lg border text-[11px] font-mono">
                    System Status: ONLINE
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Active Workspace Info</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>Business workflow modules will appear here in subsequent phases.</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
