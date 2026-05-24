"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { notificationService } from "@/lib/notification-service";
import { SystemNotification, NotificationType } from "@/types/notification";
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  BrainCircuit, 
  Briefcase, 
  MessageSquare, 
  Activity,
  Check,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

const FILTERS = ["All", "AI", "Applications", "Messages", "Workflows", "System"];

export function NotificationCenter() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = React.useState<SystemNotification[]>([]);
  const [activeFilter, setActiveFilter] = React.useState("All");
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    return notificationService.subscribeToNotifications(user.uid, setNotifications, 50);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = React.useMemo(() => {
    if (activeFilter === "All") return notifications;
    if (activeFilter === "AI") return notifications.filter(n => n.type === "ai_insight");
    if (activeFilter === "Applications") return notifications.filter(n => n.type === "application");
    if (activeFilter === "Messages") return notifications.filter(n => n.type === "message");
    if (activeFilter === "Workflows") return notifications.filter(n => n.type === "workflow" || n.type === "task");
    return notifications.filter(n => n.type === "info" || n.type === "system" || n.type === "success" || n.type === "warning");
  }, [notifications, activeFilter]);

  const handleMarkAllRead = async () => {
    if (user && unreadCount > 0) {
      await notificationService.markAllAsRead(user.uid);
    }
  };

  const handleNotificationClick = async (notif: SystemNotification) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif.notificationId);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative focus-visible:ring-0">
            <Bell className="h-5 w-5 text-brand-ink" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-coral ring-2 ring-white"
                />
              )}
            </AnimatePresence>
          </Button>
        }
      />

      <DropdownMenuContent 
        align="end" 
        className="w-[380px] rounded-[12px] border-brand-hairline bg-white p-0 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-hairline p-4 bg-brand-surface-soft/50">
          <h3 className="font-semibold text-brand-ink text-sm flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-brand-coral/10 text-brand-coral px-1.5 py-0.5 rounded text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </h3>
          <button 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-[11px] font-semibold text-brand-link hover:text-brand-primary-active disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-brand-hairline no-scrollbar">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                activeFilter === filter 
                  ? "bg-brand-ink text-white" 
                  : "bg-transparent text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto p-1 bg-brand-surface-soft/20">
          <AnimatePresence initial={false}>
            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-brand-surface-strong flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-brand-muted" />
                </div>
                <p className="text-sm font-semibold text-brand-ink">You're all caught up</p>
                <p className="text-[11px] text-brand-muted mt-1 leading-relaxed max-w-[200px]">
                  When there's activity on your account, we'll notify you here.
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notif) => (
                <NotificationItem 
                  key={notif.notificationId} 
                  notif={notif} 
                  onClick={() => {
                    handleNotificationClick(notif);
                    setIsOpen(false);
                  }}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ notif, onClick }: { notif: SystemNotification, onClick: () => void }) {
  const Icon = getIcon(notif.type);
  const timeStr = formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd');

  const content = (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-[8px] transition-colors cursor-pointer group relative",
      !notif.isRead ? "bg-brand-surface-soft" : "hover:bg-brand-surface-soft/50"
    )}>
      {!notif.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-coral" />
      )}
      
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ml-2 border",
        getIconStyle(notif.type)
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={cn(
            "text-[13px] leading-tight truncate",
            !notif.isRead ? "font-semibold text-brand-ink" : "font-medium text-brand-ink/80"
          )}>
            {notif.title}
          </p>
          <span className="text-[10px] text-brand-muted whitespace-nowrap shrink-0 pt-0.5">
            {timeStr}
          </span>
        </div>
        <p className="text-[11px] text-brand-muted leading-snug line-clamp-2">
          {notif.description}
        </p>
      </div>
    </div>
  );

  if (notif.actionUrl) {
    return (
      <Link href={notif.actionUrl} onClick={onClick} className="block mb-0.5 last:mb-0">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="mb-0.5 last:mb-0">
      {content}
    </div>
  );
}

function getIcon(type: NotificationType) {
  switch (type) {
    case "success": return CheckCircle2;
    case "warning":
    case "urgent": return AlertTriangle;
    case "ai_insight": return BrainCircuit;
    case "application": return Briefcase;
    case "message": return MessageSquare;
    case "workflow":
    case "task": return Activity;
    case "info":
    case "system":
    default: return Info;
  }
}

function getIconStyle(type: NotificationType) {
  switch (type) {
    case "success": return "bg-brand-success/10 border-brand-success/20 text-brand-success";
    case "warning":
    case "urgent": return "bg-brand-warning/10 border-brand-warning/20 text-brand-warning";
    case "ai_insight": return "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary";
    case "application": return "bg-brand-ink/5 border-brand-hairline text-brand-ink";
    case "message": return "bg-brand-info-bg border-brand-info-border text-brand-link";
    case "workflow":
    case "task": return "bg-brand-surface-strong border-brand-hairline text-brand-ink";
    case "info":
    case "system":
    default: return "bg-brand-surface-soft border-brand-hairline text-brand-muted";
  }
}
