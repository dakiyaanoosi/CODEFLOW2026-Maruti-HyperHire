"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { invitationService } from "@/lib/invitation-service";
import { GigInvitation } from "@/types/invitation";
import { Mail, Loader2, Briefcase, CheckCircle2, XCircle, Clock, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function InvitationInbox() {
  const { user, profile } = useAuthStore();
  const [invitations, setInvitations] = React.useState<GigInvitation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Acceptance Modal State
  const [isAccepting, setIsAccepting] = React.useState<GigInvitation | null>(null);
  const [acceptanceNote, setAcceptanceNote] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (user?.uid) {
      loadInvitations();
    }
  }, [user?.uid]);

  const loadInvitations = async () => {
    setIsLoading(true);
    const invites = await invitationService.getInvitationsForStudent(user!.uid);
    setInvitations(invites);
    setIsLoading(false);

    // Mark pending ones as viewed
    invites.filter(i => i.status === "pending").forEach(invite => {
      invitationService.markAsViewed(invite.invitationId);
    });
  };

  const handleAccept = async () => {
    if (!isAccepting || !profile) return;
    setIsProcessing(true);
    try {
      await invitationService.acceptInvitation(
        isAccepting.invitationId, 
        profile.name, 
        profile.avatarInitials || "", 
        acceptanceNote.trim()
      );
      // Wait a moment then redirect to the workflow
      setTimeout(() => {
        router.push(`/workflows`);
      }, 1000);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to accept invitation: ${error.message}`);
      setIsProcessing(false);
      setIsAccepting(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    if (confirm("Are you sure you want to decline this invitation?")) {
      try {
        await invitationService.declineInvitation(inviteId);
        loadInvitations();
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 font-medium">Loading your inbox...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-brand-hairline rounded-[16px]">
        <div className="h-16 w-16 bg-brand-surface-soft rounded-full flex items-center justify-center text-brand-muted mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-brand-ink">Your inbox is empty</h3>
        <p className="text-brand-body mt-2 max-w-md">
          When businesses discover your profile and want to collaborate, their invitations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map(invite => {
        const expiresAt = invite.expiresAt || (invite.createdAt + 7 * 24 * 60 * 60 * 1000);
        const isExpired = invite.status === "expired" || Date.now() > expiresAt;
        const isActive = invite.status === "pending" || invite.status === "viewed";

        return (
          <div key={invite.invitationId} className={cn(
            "bg-white border rounded-[16px] overflow-hidden transition-all",
            isActive ? "border-brand-primary/20 shadow-sm" : "border-brand-hairline opacity-75"
          )}>
            <div className="p-6 md:flex gap-6">
              {/* Left Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-ink flex items-center justify-center text-white font-bold">
                    {invite.businessName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-brand-ink">{invite.businessName}</h4>
                    <p className="text-xs text-brand-body">Invited you to collaborate</p>
                  </div>
                </div>

                <div className="bg-brand-surface-soft p-4 rounded-[12px] border border-brand-hairline">
                  <h3 className="text-lg font-bold text-brand-ink mb-1">{invite.jobTitle}</h3>
                  {invite.message && (
                    <div className="mt-3 text-sm text-brand-ink/80 italic border-l-2 border-brand-primary/30 pl-3">
                      "{invite.message}"
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {invite.status === "accepted" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-success/10 text-brand-success text-xs font-bold border border-brand-success/20">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Collaboration Started
                    </span>
                  )}
                  {invite.status === "declined" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-coral/10 text-brand-coral text-xs font-bold border border-brand-coral/20">
                      <XCircle className="h-3.5 w-3.5" /> Declined
                    </span>
                  )}
                  {isExpired && invite.status !== "accepted" && invite.status !== "declined" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-muted/10 text-brand-muted text-xs font-bold border border-brand-hairline">
                      <Clock className="h-3.5 w-3.5" /> Expired
                    </span>
                  )}
                  {!isExpired && isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-warning/10 text-brand-warning text-xs font-bold border border-brand-warning/20">
                      <Clock className="h-3.5 w-3.5" /> Expires in {Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: AI & Actions */}
              <div className="mt-6 md:mt-0 md:w-[320px] shrink-0 space-y-4 border-t md:border-t-0 md:border-l border-brand-hairline pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                
                {/* HyperAI Insight */}
                <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-[12px] p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 blur-2xl rounded-full pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> HyperAI Collaboration Insight
                    </p>
                    <p className="text-xs text-brand-ink leading-relaxed">
                      This collaboration has strong semantic alignment with your portfolio and above-average workflow compatibility.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {isActive && !isExpired && (
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleDecline(invite.invitationId)}
                      className="flex-1 py-2.5 px-3 bg-white border border-brand-hairline hover:bg-brand-surface text-brand-ink text-sm font-semibold rounded-[8px] transition-colors"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => setIsAccepting(invite)}
                      className="flex-[2] py-2.5 px-3 bg-brand-ink hover:bg-brand-ink/90 text-white text-sm font-semibold rounded-[8px] transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      Accept & Start <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {invite.status === "accepted" && invite.workflowId && (
                  <button 
                    onClick={() => router.push(`/workflows/${invite.workflowId}`)}
                    className="w-full py-2.5 px-3 bg-brand-surface-soft hover:bg-brand-surface text-brand-ink text-sm font-semibold rounded-[8px] transition-colors border border-brand-hairline flex items-center justify-center gap-2 mt-4"
                  >
                    Open Workspace <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Acceptance Modal Overlay */}
      {isAccepting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-[480px] bg-white rounded-[16px] shadow-2xl p-6">
            <h3 className="text-xl font-bold text-brand-ink mb-2">Accept Invitation</h3>
            <p className="text-sm text-brand-body mb-6">
              You are about to start a collaboration workspace with <strong className="text-brand-ink">{isAccepting.businessName}</strong>.
            </p>

            <div className="space-y-2 mb-6">
              <label className="text-sm font-semibold text-brand-ink flex items-center justify-between">
                <span>Acceptance Note</span>
                <span className="text-xs font-normal text-brand-muted">Optional</span>
              </label>
              <textarea
                value={acceptanceNote}
                onChange={(e) => setAcceptanceNote(e.target.value)}
                placeholder="e.g. 'I accept! My timezone is EST and I can start immediately.'"
                className="w-full h-24 p-3 bg-white border border-brand-hairline rounded-[8px] text-sm text-brand-ink resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <p className="text-xs text-brand-muted flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> This will be sent as your first message in the chat.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setIsAccepting(null); setAcceptanceNote(""); }}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-surface-soft rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-brand-success text-white text-sm font-semibold rounded-[8px] hover:bg-brand-success/90 transition-colors"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isProcessing ? "Starting Workspace..." : "Accept & Initialize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
