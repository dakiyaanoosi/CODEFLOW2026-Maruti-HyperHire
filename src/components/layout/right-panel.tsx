"use client";

import { useUIStore } from "@/store/use-ui-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function RightPanel() {
  const { isRightPanelOpen, setRightPanelOpen } = useUIStore();

  return (
    <AnimatePresence>
      {isRightPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="hidden h-screen shrink-0 select-none overflow-hidden border-l border-brand-hairline bg-white xl:flex xl:flex-col"
        >
          <div className="flex h-16 items-center justify-between border-b border-brand-hairline px-4">
            <span className="flex items-center gap-2 text-sm font-medium text-brand-ink">
              <Sparkles className="h-4 w-4 text-brand-coral" />
              Quick Actions
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Today&apos;s Hyperlocal Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-brand-body">
                  <p>HyperHire workspace is configured and ready.</p>
                  <div className="rounded-[10px] bg-brand-surface-soft p-3 text-xs text-brand-muted">
                    System Status: Online
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Workspace Info</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-brand-body">
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
