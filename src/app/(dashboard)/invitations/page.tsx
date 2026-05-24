"use client";

import * as React from "react";
import { InvitationInbox } from "@/components/invitations/InvitationInbox";

export default function InvitationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-ink tracking-tight">Invitations</h1>
        <p className="text-brand-body text-lg mt-2">
          Review your gig invitations and start collaborating.
        </p>
      </div>

      <InvitationInbox />
    </div>
  );
}
